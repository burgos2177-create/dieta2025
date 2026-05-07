import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SEED_TRAINING, SEED_LIBRARY, TR_DAYS_CONFIG } from '../lib/constants';
import { cloudLoad, cloudSave } from '../lib/cloudSync';
import { getMondayKey, todayDayIdx } from '../lib/dates';
import { getMesoInfoForWeek } from '../lib/mesocycle';

const CLOUD_KEY = 'training';

const cloneLibrary = () => JSON.parse(JSON.stringify(SEED_LIBRARY));

/** Build the seed template: an object keyed by weekday (0..6), with a workout per training day. */
function buildSeedTemplate() {
  const template = {};
  TR_DAYS_CONFIG.forEach((cfg, i) => {
    const seed = SEED_TRAINING[i];
    template[cfg.weekday] = JSON.parse(JSON.stringify(seed));
  });
  return template;
}

/** Migrate legacy `days` array to weekday-keyed `template`. */
function migrateLegacy(state) {
  if (state && Array.isArray(state.days) && !state.template) {
    const template = {};
    TR_DAYS_CONFIG.forEach((cfg, i) => {
      if (state.days[i]) template[cfg.weekday] = state.days[i];
    });
    state.template = template;
    delete state.days;
  }
}

/** Resolve a training day for (weekKey, weekday):
 *  1. Snapshot (manual edit) wins.
 *  2. Active mesocycle's routine for this (weekday, week-in-meso) if defined.
 *  3. Static template fallback. */
export function selectTrainingDay(state, weekKey, weekday) {
  const snap = state.weeks?.[weekKey]?.[weekday];
  if (snap) return snap;
  const info = getMesoInfoForWeek(state.mesocycles, state.activeMesocycleId, weekKey);
  if (info?.meso?.routines?.[weekday]?.exercises?.length > 0) {
    const exs = info.meso.routines[weekday].exercises;
    const weekIdx = info.weekNumber - 1;
    const exercises = exs.map((ex) => {
      const wk = ex.weeks?.[weekIdx] || ex.weeks?.[0] || {};
      return {
        id: ex.id,
        name: ex.name,
        tech: ex.tech || '',
        muscle: ex.muscle,
        equipment: ex.equipment || 'manual',
        equipmentData: wk.equipmentData ? { ...wk.equipmentData } : { kg: Number(wk.weight) || 0 },
        reps: Number(wk.reps) || 0,
        sets: Number(wk.sets) || 0,
        weight: Number(wk.weight) || 0,
      };
    });
    return { exercises };
  }
  return state.template?.[weekday] || null;
}

/** Returns array of {weekday, day, isSnapshot, status, kcalBurned, ...} for all
 *  training days in the week. Uses selectTrainingDay so it honors
 *  mesocycle.routines when active. status is 'planned'|'open'|'closed'. */
export function selectTrainingDaysForWeek(state, weekKey) {
  return TR_DAYS_CONFIG.map((cfg) => {
    const snap = state.weeks?.[weekKey]?.[cfg.weekday];
    const day = selectTrainingDay(state, weekKey, cfg.weekday);
    let status = 'planned';
    if (snap) status = snap.status === 'closed' ? 'closed' : 'open';
    return {
      weekday: cfg.weekday,
      cfg,
      day,
      isSnapshot: !!snap,
      status,
      kcalBurned: snap?.kcalBurned ?? null,
      closedAt: snap?.closedAt ?? null,
      openedAt: snap?.openedAt ?? null,
    };
  }).filter((x) => x.day);
}

/** Find the most recent prior week's snapshot for the same (weekday, exerciseId). */
export function findPreviousExecuted(state, weekKey, weekday, exerciseId) {
  const keys = Object.keys(state.weeks || {}).sort().filter((k) => k < weekKey);
  for (let i = keys.length - 1; i >= 0; i--) {
    const wk = keys[i];
    const day = state.weeks[wk]?.[weekday];
    if (!day) continue;
    const ex = (day.exercises || []).find((e) => e.id === exerciseId);
    if (ex) {
      const reps = Number(ex.reps) || 0;
      const sets = Number(ex.sets) || 0;
      const weight = Number(ex.weight) || 0;
      return { reps, sets, weight, vol: reps * sets * weight, weekKey: wk };
    }
  }
  return null;
}

/** Find the planned (theoretical) values for an exercise at a given (weekKey, weekday)
 *  using the active mesocycle's routine. Returns null if no planned exists. */
export function findTheoreticalForExercise(state, weekKey, weekday, exerciseId) {
  const info = getMesoInfoForWeek(state.mesocycles, state.activeMesocycleId, weekKey);
  if (!info?.meso?.routines?.[weekday]?.exercises?.length) return null;
  const ex = info.meso.routines[weekday].exercises.find((e) => e.id === exerciseId);
  if (!ex) return null;
  const wk = ex.weeks?.[info.weekNumber - 1] || ex.weeks?.[0] || {};
  const reps = Number(wk.reps) || 0;
  const sets = Number(wk.sets) || 0;
  const weight = Number(wk.weight) || 0;
  return { reps, sets, weight, vol: reps * sets * weight };
}

export function isTrainingDaySnapshot(state, weekKey, weekday) {
  return !!state.weeks?.[weekKey]?.[weekday];
}

/** Mutate a day in place — clones template into snapshot if needed, then runs the mutator.
 *  IMPORTANT: uses shallow cloning so unchanged exercises preserve their object refs.
 *  Mutators must use Array.map (not in-place mutations) to replace only the changed
 *  exercise, otherwise unrelated rows would re-render and clobber their local edit state. */
function mutateDay(state, weekKey, weekday, mutator) {
  const weeks = { ...(state.weeks || {}) };
  const week = { ...(weeks[weekKey] || {}) };
  const existing = week[weekday];
  let day;
  if (existing) {
    // Shallow clone — exercise objects keep the same identity until a mutator
    // replaces a specific one via map().
    day = { ...existing, exercises: [...(existing.exercises || [])] };
  } else {
    // First write to this (week, day) — materialize from template.
    const tmpl = state.template?.[weekday] || { exercises: [] };
    day = { ...tmpl, exercises: (tmpl.exercises || []).map((e) => ({ ...e })) };
  }
  mutator(day);
  week[weekday] = day;
  weeks[weekKey] = week;
  return weeks;
}

export const useTrainingStore = create(
  persist(
    (set, get) => ({
      template: buildSeedTemplate(),
      weeks: {},
      log: {},
      library: cloneLibrary(),
      workoutPresets: [],
      mesocycles: [],
      activeMesocycleId: null,
      activeWeek: getMondayKey(new Date()),
      activeDay: todayDayIdx(),

      setActiveWeek: (key) => set({ activeWeek: key }),
      setActiveDay: (idx) => set({ activeDay: idx }),

      // ── Exercise mutators (write to active week's snapshot) ──
      updateExercise: (weekday, exIdx, field, value) =>
        set((s) => {
          const weeks = mutateDay(s, s.activeWeek, weekday, (day) => {
            day.exercises = day.exercises.map((e, ei) =>
              ei === exIdx ? { ...e, [field]: value } : e
            );
          });
          // Keep the existing auto-log behavior
          const ex = weeks[s.activeWeek][weekday].exercises[exIdx];
          const vol = (Number(ex.reps) || 0) * (Number(ex.sets) || 0) * (Number(ex.weight) || 0);
          const log = { ...s.log };
          const list = log[ex.id] || [];
          const today = new Date().toISOString().slice(0, 10);
          const lastSameDay = [...list].reverse().find((l) => l.date === today);
          if (!lastSameDay || Math.abs(lastSameDay.vol - vol) > 0.1) {
            log[ex.id] = [
              ...list,
              { date: today, reps: Number(ex.reps) || 0, sets: Number(ex.sets) || 0, weight: Number(ex.weight) || 0, vol },
            ];
          }
          return { weeks, log };
        }),

      /** Apply a patch to an exercise WITHOUT auto-logging. Used for live edits
       *  (e.g. switching equipment) that should persist immediately so the
       *  preset-match badge updates, but don't deserve a log entry. */
      updateExerciseFieldsNoLog: (weekday, exIdx, patch) =>
        set((s) => ({
          weeks: mutateDay(s, s.activeWeek, weekday, (day) => {
            day.exercises = day.exercises.map((e, ei) =>
              ei === exIdx ? { ...e, ...patch } : e
            );
          }),
        })),

      /** Apply an arbitrary patch to an exercise (auto-logs once). */
      updateExerciseFields: (weekday, exIdx, patch) =>
        set((s) => {
          const weeks = mutateDay(s, s.activeWeek, weekday, (day) => {
            day.exercises = day.exercises.map((e, ei) =>
              ei === exIdx ? { ...e, ...patch } : e
            );
          });
          const ex = weeks[s.activeWeek][weekday].exercises[exIdx];
          const vol = (Number(ex.reps) || 0) * (Number(ex.sets) || 0) * (Number(ex.weight) || 0);
          const log = { ...s.log };
          const list = log[ex.id] || [];
          const today = new Date().toISOString().slice(0, 10);
          const lastSameDay = [...list].reverse().find((l) => l.date === today);
          if (!lastSameDay || Math.abs(lastSameDay.vol - vol) > 0.1) {
            log[ex.id] = [
              ...list,
              { date: today, reps: Number(ex.reps) || 0, sets: Number(ex.sets) || 0, weight: Number(ex.weight) || 0, vol },
            ];
          }
          return { weeks, log };
        }),

      addExercise: (weekday, exercise) =>
        set((s) => {
          const id = exercise.id || 'e' + Date.now();
          const ex = { ...exercise, id };
          const weeks = mutateDay(s, s.activeWeek, weekday, (day) => {
            day.exercises = [...(day.exercises || []), ex];
          });
          const inLib = s.library.some(
            (l) => l.id === id || (l.name.toLowerCase() === ex.name.toLowerCase() && l.muscle === ex.muscle)
          );
          const library = inLib
            ? s.library
            : [...s.library, { id, name: ex.name, tech: ex.tech || '', muscle: ex.muscle }];
          return { weeks, library };
        }),

      addToLibrary: (exercise) =>
        set((s) => {
          const inLib = s.library.some(
            (l) => l.name.toLowerCase() === exercise.name.toLowerCase() && l.muscle === exercise.muscle
          );
          if (inLib) return s;
          const id = exercise.id || 'e' + Date.now();
          return { library: [...s.library, { id, name: exercise.name, tech: exercise.tech || '', muscle: exercise.muscle }] };
        }),

      reorderExercise: (weekday, fromIdx, toIdx) =>
        set((s) => ({
          weeks: mutateDay(s, s.activeWeek, weekday, (day) => {
            const exercises = [...day.exercises];
            const [moved] = exercises.splice(fromIdx, 1);
            exercises.splice(toIdx, 0, moved);
            day.exercises = exercises;
          }),
        })),

      deleteExercise: (weekday, exIdx) =>
        set((s) => ({
          weeks: mutateDay(s, s.activeWeek, weekday, (day) => {
            day.exercises = day.exercises.filter((_, ei) => ei !== exIdx);
          }),
        })),

      // ── Day session lifecycle ──
      /** Materialize the current planned view (meso routine or template) into a
       *  snapshot, ready to be edited. Marks the entry as 'open'. */
      openDayEntry: (weekKey, weekday) =>
        set((s) => {
          const planned = selectTrainingDay(s, weekKey, weekday) || { exercises: [] };
          // Already a snapshot? Make sure it is open (re-uses existing exercises).
          const existing = s.weeks?.[weekKey]?.[weekday];
          const day = existing
            ? { ...existing, status: 'open', closedAt: undefined, openedAt: existing.openedAt || Date.now() }
            : {
                exercises: (planned.exercises || []).map((e) => ({
                  ...e,
                  equipmentData: e.equipmentData ? { ...e.equipmentData } : { kg: Number(e.weight) || 0 },
                })),
                status: 'open',
                openedAt: Date.now(),
              };
          const weeks = { ...(s.weeks || {}) };
          const week = { ...(weeks[weekKey] || {}) };
          week[weekday] = day;
          weeks[weekKey] = week;
          return { weeks };
        }),
      /** Close a day entry, optionally with kcal burned. */
      closeDayEntry: (weekKey, weekday, kcalBurned) =>
        set((s) => {
          const day = s.weeks?.[weekKey]?.[weekday];
          if (!day) return {};
          const updated = {
            ...day,
            status: 'closed',
            kcalBurned: Number(kcalBurned) || 0,
            closedAt: Date.now(),
          };
          const weeks = { ...s.weeks };
          weeks[weekKey] = { ...weeks[weekKey], [weekday]: updated };
          return { weeks };
        }),
      /** Re-open a closed day entry. */
      reopenDayEntry: (weekKey, weekday) =>
        set((s) => {
          const day = s.weeks?.[weekKey]?.[weekday];
          if (!day) return {};
          const { kcalBurned: _kc, closedAt: _ca, ...rest } = day;
          const updated = { ...rest, status: 'open' };
          const weeks = { ...s.weeks };
          weeks[weekKey] = { ...weeks[weekKey], [weekday]: updated };
          return { weeks };
        }),

      // Drop a snapshot — day reverts to template
      resetDayToTemplate: (weekKey, weekday) =>
        set((s) => {
          if (!s.weeks?.[weekKey]?.[weekday]) return {};
          const weeks = { ...s.weeks };
          const week = { ...weeks[weekKey] };
          delete week[weekday];
          if (Object.keys(week).length === 0) delete weeks[weekKey];
          else weeks[weekKey] = week;
          return { weeks };
        }),
      // Save snapshot back as new template
      saveDayAsTemplate: (weekKey, weekday) =>
        set((s) => {
          const day = s.weeks?.[weekKey]?.[weekday];
          if (!day) return {};
          const template = { ...s.template, [weekday]: JSON.parse(JSON.stringify(day)) };
          return { template };
        }),

      // ── Log entries ──
      appendLog: (exId, entry) =>
        set((s) => ({ log: { ...s.log, [exId]: [...(s.log[exId] || []), entry] } })),
      deleteLogEntry: (exId, entryIdx) =>
        set((s) => ({
          log: { ...s.log, [exId]: (s.log[exId] || []).filter((_, i) => i !== entryIdx) },
        })),
      clearLog: (exId) =>
        set((s) => ({ log: { ...s.log, [exId]: [] } })),

      // ── Workout presets ──
      saveWorkoutPreset: ({ name, exercises, gym, mesoWeek, bodyWeightKg }) =>
        set((s) => {
          const preset = {
            id: `wp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
            name: (name || '').trim() || 'Preset',
            exercises: (exercises || []).map((e) => ({
              id: e.id,
              name: e.name,
              tech: e.tech || '',
              muscle: e.muscle,
              reps: Number(e.reps) || 0,
              sets: Number(e.sets) || 0,
              weight: Number(e.weight) || 0,
              equipment: e.equipment || 'manual',
              equipmentData: e.equipmentData ? { ...e.equipmentData } : { kg: Number(e.weight) || 0 },
            })),
            gym: (gym || '').trim(),
            mesoWeek: mesoWeek == null ? null : Number(mesoWeek),
            bodyWeightKg: bodyWeightKg == null ? null : Number(bodyWeightKg),
            createdAt: Date.now(),
          };
          return { workoutPresets: [...s.workoutPresets, preset] };
        }),
      removeWorkoutPreset: (id) =>
        set((s) => ({ workoutPresets: s.workoutPresets.filter((p) => p.id !== id) })),
      /** Clone a preset and apply overrides (e.g. {mesoWeek: 2, name: 'Pierna S2'}). */
      duplicateWorkoutPreset: (id, overrides = {}) =>
        set((s) => {
          const src = s.workoutPresets.find((p) => p.id === id);
          if (!src) return {};
          const copy = {
            ...src,
            id: `wp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
            name: (overrides.name ?? src.name).trim() || src.name,
            exercises: src.exercises.map((e) => ({
              ...e,
              equipmentData: e.equipmentData ? { ...e.equipmentData } : { kg: Number(e.weight) || 0 },
            })),
            gym: overrides.gym !== undefined ? overrides.gym : src.gym,
            mesoWeek: overrides.mesoWeek !== undefined ? overrides.mesoWeek : src.mesoWeek,
            bodyWeightKg: overrides.bodyWeightKg !== undefined ? overrides.bodyWeightKg : src.bodyWeightKg,
            createdAt: Date.now(),
          };
          delete copy.updatedAt;
          return { workoutPresets: [...s.workoutPresets, copy] };
        }),
      overwriteWorkoutPreset: (id, { name, exercises, gym, mesoWeek, bodyWeightKg }) =>
        set((s) => ({
          workoutPresets: s.workoutPresets.map((p) =>
            p.id !== id ? p : {
              ...p,
              name: name ? name.trim() : p.name,
              exercises: (exercises || []).map((e) => ({
                id: e.id,
                name: e.name,
                tech: e.tech || '',
                muscle: e.muscle,
                reps: Number(e.reps) || 0,
                sets: Number(e.sets) || 0,
                weight: Number(e.weight) || 0,
                equipment: e.equipment || 'manual',
                equipmentData: e.equipmentData ? { ...e.equipmentData } : { kg: Number(e.weight) || 0 },
              })),
              gym: gym !== undefined ? (gym || '').trim() : p.gym,
              mesoWeek: mesoWeek !== undefined
                ? (mesoWeek == null ? null : Number(mesoWeek))
                : p.mesoWeek,
              bodyWeightKg: bodyWeightKg !== undefined
                ? (bodyWeightKg == null ? null : Number(bodyWeightKg))
                : p.bodyWeightKg,
              updatedAt: Date.now(),
            }
          ),
        })),
      renameWorkoutPreset: (id, name) =>
        set((s) => ({
          workoutPresets: s.workoutPresets.map((p) => (p.id === id ? { ...p, name: (name || '').trim() || p.name } : p)),
        })),
      applyWorkoutPreset: (weekday, presetId, mode = 'append') =>
        set((s) => {
          const preset = s.workoutPresets.find((p) => p.id === presetId);
          if (!preset) return {};
          return {
            weeks: mutateDay(s, s.activeWeek, weekday, (day) => {
              const cloned = preset.exercises.map((e) => ({ ...e }));
              day.exercises = mode === 'replace' ? cloned : [...(day.exercises || []), ...cloned];
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
      resetMesoStart: (id, newStartWeek) =>
        set((s) => ({
          mesocycles: s.mesocycles.map((m) =>
            m.id === id ? { ...m, startWeek: newStartWeek || s.activeWeek } : m
          ),
        })),

      // ── Mesocycle routines (per-day, per-week exercise matrix) ──
      addMesoRoutineExercise: (mesoId, weekday, exercise) =>
        set((s) => ({
          mesocycles: s.mesocycles.map((m) => {
            if (m.id !== mesoId) return m;
            const routines = { ...(m.routines || {}) };
            const day = routines[weekday] ? { ...routines[weekday] } : { exercises: [] };
            day.exercises = [...(day.exercises || []), exercise];
            routines[weekday] = day;
            return { ...m, routines };
          }),
        })),
      removeMesoRoutineExercise: (mesoId, weekday, exIdx) =>
        set((s) => ({
          mesocycles: s.mesocycles.map((m) => {
            if (m.id !== mesoId) return m;
            const routines = { ...(m.routines || {}) };
            const day = routines[weekday];
            if (!day) return m;
            const exercises = (day.exercises || []).filter((_, i) => i !== exIdx);
            routines[weekday] = { ...day, exercises };
            return { ...m, routines };
          }),
        })),
      updateMesoRoutineExercise: (mesoId, weekday, exIdx, patch) =>
        set((s) => ({
          mesocycles: s.mesocycles.map((m) => {
            if (m.id !== mesoId) return m;
            const routines = { ...(m.routines || {}) };
            const day = routines[weekday];
            if (!day) return m;
            const exercises = (day.exercises || []).map((e, i) =>
              i === exIdx ? { ...e, ...patch } : e
            );
            routines[weekday] = { ...day, exercises };
            return { ...m, routines };
          }),
        })),
      updateMesoRoutineWeek: (mesoId, weekday, exIdx, weekIdx, patch) =>
        set((s) => ({
          mesocycles: s.mesocycles.map((m) => {
            if (m.id !== mesoId) return m;
            const routines = { ...(m.routines || {}) };
            const day = routines[weekday];
            if (!day) return m;
            const exercises = (day.exercises || []).map((e, i) => {
              if (i !== exIdx) return e;
              const weeks = [...(e.weeks || [])];
              weeks[weekIdx] = { ...(weeks[weekIdx] || {}), ...patch };
              return { ...e, weeks };
            });
            routines[weekday] = { ...day, exercises };
            return { ...m, routines };
          }),
        })),
      moveMesoRoutineExercise: (mesoId, weekday, fromIdx, toIdx) =>
        set((s) => ({
          mesocycles: s.mesocycles.map((m) => {
            if (m.id !== mesoId) return m;
            const routines = { ...(m.routines || {}) };
            const day = routines[weekday];
            if (!day) return m;
            const exercises = [...(day.exercises || [])];
            if (toIdx < 0 || toIdx >= exercises.length) return m;
            const [moved] = exercises.splice(fromIdx, 1);
            exercises.splice(toIdx, 0, moved);
            routines[weekday] = { ...day, exercises };
            return { ...m, routines };
          }),
        })),
      /** Initialize the routine for (mesoId, weekday) by copying from the
       *  static template — same exercises in all N weeks of the mesocycle. */
      importMesoRoutineFromTemplate: (mesoId, weekday) =>
        set((s) => {
          const tmpl = s.template?.[weekday];
          if (!tmpl?.exercises?.length) return {};
          const meso = s.mesocycles.find((m) => m.id === mesoId);
          if (!meso) return {};
          const N = meso.weeks || 5;
          const exercises = tmpl.exercises.map((e) => ({
            id: e.id,
            name: e.name,
            tech: e.tech || '',
            muscle: e.muscle,
            equipment: e.equipment || 'manual',
            weeks: Array.from({ length: N }, () => ({
              reps: Number(e.reps) || 0,
              sets: Number(e.sets) || 0,
              weight: Number(e.weight) || 0,
              equipmentData: e.equipmentData ? { ...e.equipmentData } : { kg: Number(e.weight) || 0 },
            })),
          }));
          return {
            mesocycles: s.mesocycles.map((m) =>
              m.id !== mesoId
                ? m
                : { ...m, routines: { ...(m.routines || {}), [weekday]: { exercises } } }
            ),
          };
        }),
      /** Copy week N values to all subsequent weeks of a SPECIFIC exercise. */
      fillMesoRoutineWeeksFrom: (mesoId, weekday, exIdx, fromWeekIdx) =>
        set((s) => ({
          mesocycles: s.mesocycles.map((m) => {
            if (m.id !== mesoId) return m;
            const day = m.routines?.[weekday];
            if (!day?.exercises?.length) return m;
            const exercises = day.exercises.map((e, i) => {
              if (i !== exIdx) return e;
              const src = e.weeks?.[fromWeekIdx];
              if (!src) return e;
              const weeks = e.weeks.map((w, idx) =>
                idx > fromWeekIdx
                  ? { ...src, equipmentData: { ...(src.equipmentData || {}) } }
                  : w
              );
              return { ...e, weeks };
            });
            return {
              ...m,
              routines: { ...(m.routines || {}), [weekday]: { ...day, exercises } },
            };
          }),
        })),

      resetSeed: () => set({ template: buildSeedTemplate(), weeks: {}, log: {}, library: cloneLibrary() }),

      // ── Cloud sync ──
      _initCloud: async () => {
        const data = await cloudLoad(CLOUD_KEY);
        if (data) {
          // Migrate legacy cloud (had `days` array)
          const legacy = data.days;
          let template = data.template;
          if (!template && Array.isArray(legacy)) {
            template = {};
            TR_DAYS_CONFIG.forEach((cfg, i) => {
              if (legacy[i]) template[cfg.weekday] = legacy[i];
            });
          }
          set({
            template: template || buildSeedTemplate(),
            weeks: data.weeks || {},
            log: data.log || {},
            library: data.library || cloneLibrary(),
            workoutPresets: Array.isArray(data.workoutPresets) ? data.workoutPresets : [],
            mesocycles: Array.isArray(data.mesocycles) ? data.mesocycles : [],
            activeMesocycleId: data.activeMesocycleId || null,
          });
        } else {
          const s = get();
          cloudSave(CLOUD_KEY, {
            template: s.template, weeks: s.weeks, log: s.log, library: s.library,
            workoutPresets: s.workoutPresets,
            mesocycles: s.mesocycles, activeMesocycleId: s.activeMesocycleId,
          });
        }
        useTrainingStore.subscribe((s) => {
          cloudSave(CLOUD_KEY, {
            template: s.template, weeks: s.weeks, log: s.log, library: s.library,
            workoutPresets: s.workoutPresets,
            mesocycles: s.mesocycles, activeMesocycleId: s.activeMesocycleId,
          });
        });
      },
    }),
    {
      name: 'dieta2025_training',
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        migrateLegacy(state);
        if (!state.template) state.template = buildSeedTemplate();
        if (!state.weeks) state.weeks = {};
        if (!state.log) state.log = {};
        if (!state.library) state.library = cloneLibrary();
        if (!Array.isArray(state.workoutPresets)) state.workoutPresets = [];
        if (!Array.isArray(state.mesocycles)) state.mesocycles = [];
        if (state.activeMesocycleId === undefined) state.activeMesocycleId = null;
        if (!state.activeWeek) state.activeWeek = getMondayKey(new Date());
        if (typeof state.activeDay !== 'number') state.activeDay = todayDayIdx();
      },
    }
  )
);

/** True when two exercise lists are equivalent (same ids, reps, sets, kg, equipment). */
export function exercisesEqual(a, b) {
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const x = a[i], y = b[i];
    if (!x || !y) return false;
    if (x.id !== y.id) return false;
    if ((Number(x.reps) || 0) !== (Number(y.reps) || 0)) return false;
    if ((Number(x.sets) || 0) !== (Number(y.sets) || 0)) return false;
    if (Math.abs((Number(x.weight) || 0) - (Number(y.weight) || 0)) > 0.05) return false;
    if ((x.equipment || 'manual') !== (y.equipment || 'manual')) return false;
  }
  return true;
}

/** Returns the preset whose exercises match the given list, or null. */
export function findMatchingWorkoutPreset(presets, exercises) {
  if (!presets || !exercises) return null;
  return presets.find((p) => exercisesEqual(p.exercises, exercises)) || null;
}

/** Re-export for convenience */
export { getMesoInfoForWeek };
