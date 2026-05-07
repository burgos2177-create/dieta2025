import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { buildSeedNutPlan, MEALS_CONFIG } from '../lib/constants';
import { cloudLoad, cloudSave } from '../lib/cloudSync';
import { getMondayKey, todayDayIdx } from '../lib/dates';
import { dayType } from '../lib/calculators';
import { getMesoInfoForWeek, materializeMesoDay } from '../lib/mesocycle';

const CLOUD_KEY = 'nutrition';
const DEFAULT_MEALS = MEALS_CONFIG;

/** Make sure each weekday in `daysObj` has an entry for every meal. */
function ensureDaysShape(daysObj, meals) {
  const out = { ...daysObj };
  for (let d = 0; d < 7; d++) {
    if (!out[d]) out[d] = {};
    else out[d] = { ...out[d] };
    for (const m of meals) {
      if (!out[d][m.id]) out[d][m.id] = [];
    }
  }
  return out;
}

/** Ensure the weeks object only contains valid week structures. */
function ensureWeeks(weeks, meals) {
  const out = {};
  if (!weeks || typeof weeks !== 'object') return out;
  for (const k of Object.keys(weeks)) {
    out[k] = {};
    const w = weeks[k] || {};
    for (let d = 0; d < 7; d++) {
      if (w[d] != null) {
        // Snapshot exists for this day — keep & shape it
        out[k][d] = { ...w[d] };
        for (const m of meals) {
          if (!out[k][d][m.id]) out[k][d][m.id] = [];
        }
      }
    }
  }
  return out;
}

/** Migrate from legacy `plan` shape to `template`. */
function migrateLegacy(state) {
  if (state && state.plan && !state.template) {
    state.template = state.plan;
    delete state.plan;
  }
}

function newPresetId() {
  return `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

function newMealId() {
  return `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

/** Deep-clone a single day plan (entries are immutable enough; spread is fine). */
function cloneDayPlan(day) {
  if (!day) return {};
  const out = {};
  for (const mealId of Object.keys(day)) {
    out[mealId] = (day[mealId] || []).map((e) => ({ ...e }));
  }
  return out;
}

/** Get day plan reading from snapshot (weeks) → mesocycle → static template. */
export function selectDayPlan(state, weekKey, dayIdx) {
  // 1. Manual snapshot wins
  const snap = state.weeks?.[weekKey]?.[dayIdx];
  if (snap) return snap;
  // 2. Active mesocycle covering this week
  const info = getMesoInfoForWeek(state.mesocycles, state.activeMesocycleId, weekKey);
  if (info) {
    const presetsById = Object.fromEntries((state.presets || []).map((p) => [p.id, p]));
    const type = dayType(dayIdx);
    return materializeMesoDay(info.meso, type, state.meals || [], presetsById);
  }
  // 3. Static template fallback
  return state.template?.[dayIdx] || {};
}

/** True if there is a snapshot stored for the given (week, day). */
export function isDaySnapshot(state, weekKey, dayIdx) {
  return !!state.weeks?.[weekKey]?.[dayIdx];
}

/** Mutate a day in-place: ensures a snapshot exists (cloning template) before mutation. */
function mutateDay(state, weekKey, dayIdx, mutator) {
  const weeks = { ...(state.weeks || {}) };
  const week = { ...(weeks[weekKey] || {}) };
  const existing = week[dayIdx];
  // Clone template if no snapshot yet
  const day = existing
    ? { ...existing, ...Object.fromEntries(Object.entries(existing).map(([k, v]) => [k, [...v]])) }
    : cloneDayPlan(state.template?.[dayIdx] || {});
  // Ensure all meal slots exist
  for (const m of state.meals || []) {
    if (!day[m.id]) day[m.id] = [];
  }
  mutator(day);
  week[dayIdx] = day;
  weeks[weekKey] = week;
  return weeks;
}

export const useNutritionStore = create(
  persist(
    (set, get) => ({
      template: buildSeedNutPlan(),
      weeks: {},
      meals: DEFAULT_MEALS,
      presets: [],
      mesocycles: [],
      activeMesocycleId: null,
      activeWeek: getMondayKey(new Date()),
      activeDay: todayDayIdx(),

      setActiveWeek: (key) => set({ activeWeek: key }),
      setActiveDay: (idx) => set({ activeDay: idx }),

      // ── Day mutators (write to current activeWeek snapshot) ──
      addEntry: (dayIdx, mealId, entry) =>
        set((s) => ({
          weeks: mutateDay(s, s.activeWeek, dayIdx, (day) => {
            day[mealId] = [...(day[mealId] || []), entry];
          }),
        })),
      updateEntry: (dayIdx, mealId, entryIdx, amount) =>
        set((s) => ({
          weeks: mutateDay(s, s.activeWeek, dayIdx, (day) => {
            const list = [...(day[mealId] || [])];
            if (list[entryIdx]) list[entryIdx] = { ...list[entryIdx], amount };
            day[mealId] = list;
          }),
        })),
      removeEntry: (dayIdx, mealId, entryIdx) =>
        set((s) => ({
          weeks: mutateDay(s, s.activeWeek, dayIdx, (day) => {
            day[mealId] = (day[mealId] || []).filter((_, i) => i !== entryIdx);
          }),
        })),

      // Drop a snapshot — day reverts to template
      resetDayToTemplate: (weekKey, dayIdx) =>
        set((s) => {
          if (!s.weeks?.[weekKey]?.[dayIdx]) return {};
          const weeks = { ...s.weeks };
          const week = { ...weeks[weekKey] };
          delete week[dayIdx];
          if (Object.keys(week).length === 0) delete weeks[weekKey];
          else weeks[weekKey] = week;
          return { weeks };
        }),
      // Save current snapshot back into the template
      saveDayAsTemplate: (weekKey, dayIdx) =>
        set((s) => {
          const day = s.weeks?.[weekKey]?.[dayIdx];
          if (!day) return {};
          const template = { ...s.template, [dayIdx]: cloneDayPlan(day) };
          return { template };
        }),

      // ── Meal management (affects template + future writes) ──
      addMeal: ({ label, icon, sub }) =>
        set((s) => {
          const meal = { id: newMealId(), label: label.trim(), icon: icon || '🍽', sub: (sub || '').trim() };
          const meals = [...s.meals, meal];
          // Ensure the meal slot exists in template (snapshots get the slot lazily)
          const template = { ...s.template };
          for (let d = 0; d < 7; d++) {
            template[d] = { ...(template[d] || {}), [meal.id]: [] };
          }
          return { meals, template };
        }),
      updateMeal: (mealId, patch) =>
        set((s) => ({
          meals: s.meals.map((m) => (m.id === mealId ? { ...m, ...patch } : m)),
        })),
      removeMeal: (mealId) =>
        set((s) => {
          const meals = s.meals.filter((m) => m.id !== mealId);
          const template = { ...s.template };
          for (let d = 0; d < 7; d++) {
            if (template[d]) {
              const next = { ...template[d] };
              delete next[mealId];
              template[d] = next;
            }
          }
          // Also strip from snapshots
          const weeks = { ...s.weeks };
          for (const wk of Object.keys(weeks)) {
            const w = { ...weeks[wk] };
            for (const d of Object.keys(w)) {
              const day = { ...w[d] };
              delete day[mealId];
              w[d] = day;
            }
            weeks[wk] = w;
          }
          return { meals, template, weeks };
        }),
      moveMeal: (mealId, dir) =>
        set((s) => {
          const idx = s.meals.findIndex((m) => m.id === mealId);
          if (idx < 0) return {};
          const target = dir === 'up' ? idx - 1 : idx + 1;
          if (target < 0 || target >= s.meals.length) return {};
          const meals = [...s.meals];
          [meals[idx], meals[target]] = [meals[target], meals[idx]];
          return { meals };
        }),

      // ── Presets ──
      savePreset: ({ name, entries }) =>
        set((s) => {
          const preset = {
            id: newPresetId(),
            name: name.trim(),
            entries: entries.map((e) => ({ foodId: e.foodId, amount: e.amount, unit: e.unit })),
            createdAt: Date.now(),
          };
          return { presets: [...s.presets, preset] };
        }),
      removePreset: (id) =>
        set((s) => ({ presets: s.presets.filter((p) => p.id !== id) })),
      renamePreset: (id, name) =>
        set((s) => ({
          presets: s.presets.map((p) => (p.id === id ? { ...p, name: name.trim() } : p)),
        })),
      applyPreset: (dayIdx, mealId, presetId, mode = 'append') =>
        set((s) => {
          const preset = s.presets.find((p) => p.id === presetId);
          if (!preset) return {};
          return {
            weeks: mutateDay(s, s.activeWeek, dayIdx, (day) => {
              const cloned = preset.entries.map((e) => ({ ...e }));
              day[mealId] = mode === 'replace' ? cloned : [...(day[mealId] || []), ...cloned];
            }),
          };
        }),

      // ── Mesocycles ──
      addMesocycle: (meso) =>
        set((s) => ({
          mesocycles: [...s.mesocycles, meso],
          activeMesocycleId: meso.id,
        })),
      updateMesocycle: (id, patch) =>
        set((s) => ({
          mesocycles: s.mesocycles.map((m) => (m.id === id ? { ...m, ...patch } : m)),
        })),
      removeMesocycle: (id) =>
        set((s) => ({
          mesocycles: s.mesocycles.filter((m) => m.id !== id),
          activeMesocycleId: s.activeMesocycleId === id ? null : s.activeMesocycleId,
        })),
      setActiveMesocycleId: (id) => set({ activeMesocycleId: id }),
      /** Reset the start week of a mesocycle to a given Monday key (defaults to current activeWeek). */
      resetMesoStart: (id, newStartWeek) =>
        set((s) => ({
          mesocycles: s.mesocycles.map((m) =>
            m.id === id ? { ...m, startWeek: newStartWeek || s.activeWeek } : m
          ),
        })),
      /** Set the preset for a (dayType, mealId) of a mesocycle. presetId can be null to clear. */
      setMesoPlan: (id, dayTypeStr, mealId, presetId) =>
        set((s) => ({
          mesocycles: s.mesocycles.map((m) => {
            if (m.id !== id) return m;
            const plans = { ...(m.plans || { high: {}, low: {}, normo: {} }) };
            const slot = { ...(plans[dayTypeStr] || {}) };
            if (presetId == null) delete slot[mealId];
            else slot[mealId] = presetId;
            plans[dayTypeStr] = slot;
            return { ...m, plans };
          }),
        })),

      resetSeed: () => set({ template: buildSeedNutPlan(), meals: DEFAULT_MEALS, weeks: {} }),

      // ── Cloud sync ──
      _initCloud: async () => {
        const data = await cloudLoad(CLOUD_KEY);
        if (data) {
          const legacyPlan = data.plan;
          const meals = Array.isArray(data.meals) && data.meals.length ? data.meals : DEFAULT_MEALS;
          const template = ensureDaysShape(data.template || legacyPlan || buildSeedNutPlan(), meals);
          const weeks = ensureWeeks(data.weeks, meals);
          const presets = Array.isArray(data.presets) ? data.presets : [];
          const mesocycles = Array.isArray(data.mesocycles) ? data.mesocycles : [];
          const activeMesocycleId = data.activeMesocycleId || null;
          set({ template, weeks, meals, presets, mesocycles, activeMesocycleId });
        } else {
          const s = get();
          cloudSave(CLOUD_KEY, {
            template: s.template, weeks: s.weeks, meals: s.meals, presets: s.presets,
            mesocycles: s.mesocycles, activeMesocycleId: s.activeMesocycleId,
          });
        }
        useNutritionStore.subscribe((s) => {
          cloudSave(CLOUD_KEY, {
            template: s.template, weeks: s.weeks, meals: s.meals, presets: s.presets,
            mesocycles: s.mesocycles, activeMesocycleId: s.activeMesocycleId,
          });
        });
      },
    }),
    {
      name: 'dieta2025_nutrition',
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        if (!Array.isArray(state.meals) || !state.meals.length) state.meals = DEFAULT_MEALS;
        if (!Array.isArray(state.presets)) state.presets = [];
        if (!Array.isArray(state.mesocycles)) state.mesocycles = [];
        if (state.activeMesocycleId === undefined) state.activeMesocycleId = null;
        migrateLegacy(state);
        state.template = ensureDaysShape(state.template || buildSeedNutPlan(), state.meals);
        state.weeks = ensureWeeks(state.weeks, state.meals);
        if (!state.activeWeek) state.activeWeek = getMondayKey(new Date());
        if (typeof state.activeDay !== 'number') state.activeDay = todayDayIdx();
      },
    }
  )
);
