import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { buildSeedNutPlan, MEALS_CONFIG } from '../lib/constants';
import { cloudLoad, cloudSave } from '../lib/cloudSync';

const CLOUD_KEY = 'nutrition';
const DEFAULT_MEALS = MEALS_CONFIG;

function ensure7Days(plan, meals) {
  const out = { ...plan };
  for (let d = 0; d < 7; d++) {
    if (!out[d]) out[d] = {};
    else out[d] = { ...out[d] };
    for (const m of meals) {
      if (!out[d][m.id]) out[d][m.id] = [];
    }
  }
  return out;
}

function newMealId() {
  return `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

function newPresetId() {
  return `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export const useNutritionStore = create(
  persist(
    (set, get) => ({
      plan: buildSeedNutPlan(),
      meals: DEFAULT_MEALS,
      presets: [],
      activeDay: 0,

      setActiveDay: (idx) => set({ activeDay: idx }),

      addEntry: (dayIdx, mealId, entry) =>
        set((s) => {
          const plan = ensure7Days(s.plan, s.meals);
          plan[dayIdx] = { ...plan[dayIdx], [mealId]: [...(plan[dayIdx][mealId] || []), entry] };
          return { plan: { ...plan } };
        }),
      updateEntry: (dayIdx, mealId, entryIdx, amount) =>
        set((s) => {
          const plan = ensure7Days(s.plan, s.meals);
          const list = [...(plan[dayIdx][mealId] || [])];
          list[entryIdx] = { ...list[entryIdx], amount };
          plan[dayIdx] = { ...plan[dayIdx], [mealId]: list };
          return { plan: { ...plan } };
        }),
      removeEntry: (dayIdx, mealId, entryIdx) =>
        set((s) => {
          const plan = ensure7Days(s.plan, s.meals);
          const list = (plan[dayIdx][mealId] || []).filter((_, i) => i !== entryIdx);
          plan[dayIdx] = { ...plan[dayIdx], [mealId]: list };
          return { plan: { ...plan } };
        }),

      // ── Meal management ──
      addMeal: ({ label, icon, sub }) =>
        set((s) => {
          const meal = { id: newMealId(), label: label.trim(), icon: icon || '🍽', sub: (sub || '').trim() };
          const meals = [...s.meals, meal];
          const plan = { ...s.plan };
          for (let d = 0; d < 7; d++) {
            plan[d] = { ...(plan[d] || {}), [meal.id]: [] };
          }
          return { meals, plan };
        }),
      updateMeal: (mealId, patch) =>
        set((s) => ({
          meals: s.meals.map((m) => (m.id === mealId ? { ...m, ...patch } : m)),
        })),
      removeMeal: (mealId) =>
        set((s) => {
          const meals = s.meals.filter((m) => m.id !== mealId);
          const plan = { ...s.plan };
          for (let d = 0; d < 7; d++) {
            if (plan[d]) {
              const next = { ...plan[d] };
              delete next[mealId];
              plan[d] = next;
            }
          }
          return { meals, plan };
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
          const plan = ensure7Days(s.plan, s.meals);
          const current = plan[dayIdx][mealId] || [];
          const cloned = preset.entries.map((e) => ({ ...e }));
          const next = mode === 'replace' ? cloned : [...current, ...cloned];
          plan[dayIdx] = { ...plan[dayIdx], [mealId]: next };
          return { plan: { ...plan } };
        }),

      resetSeed: () =>
        set({ plan: buildSeedNutPlan(), meals: DEFAULT_MEALS }),

      // ── Cloud sync ──
      _initCloud: async () => {
        const data = await cloudLoad(CLOUD_KEY);
        if (data) {
          const meals = Array.isArray(data.meals) && data.meals.length ? data.meals : DEFAULT_MEALS;
          const plan = ensure7Days(data.plan || {}, meals);
          set({ plan, meals, presets: Array.isArray(data.presets) ? data.presets : [] });
        } else {
          const s = get();
          cloudSave(CLOUD_KEY, { plan: s.plan, meals: s.meals, presets: s.presets });
        }
        useNutritionStore.subscribe((s) => {
          cloudSave(CLOUD_KEY, { plan: s.plan, meals: s.meals, presets: s.presets });
        });
      },
    }),
    {
      name: 'dieta2025_nutrition',
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        if (!Array.isArray(state.meals) || !state.meals.length) state.meals = DEFAULT_MEALS;
        if (!Array.isArray(state.presets)) state.presets = [];
        state.plan = ensure7Days(state.plan || {}, state.meals);
      },
    }
  )
);
