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

/** Resolve a training day for (weekKey, weekday): snapshot wins, else template. */
export function selectTrainingDay(state, weekKey, weekday) {
  const snap = state.weeks?.[weekKey]?.[weekday];
  if (snap) return snap;
  return state.template?.[weekday] || null;
}

/** Returns array of {weekday, day, isSnapshot} for all training days in the week. */
export function selectTrainingDaysForWeek(state, weekKey) {
  return TR_DAYS_CONFIG.map((cfg) => {
    const snap = state.weeks?.[weekKey]?.[cfg.weekday];
    const day = snap || state.template?.[cfg.weekday];
    return { weekday: cfg.weekday, cfg, day, isSnapshot: !!snap };
  }).filter((x) => x.day);
}

export function isTrainingDaySnapshot(state, weekKey, weekday) {
  return !!state.weeks?.[weekKey]?.[weekday];
}

/** Mutate a day in place — clones template into snapshot if needed, then runs the mutator. */
function mutateDay(state, weekKey, weekday, mutator) {
  const weeks = { ...(state.weeks || {}) };
  const week = { ...(weeks[weekKey] || {}) };
  const existing = week[weekday];
  const day = existing
    ? JSON.parse(JSON.stringify(existing))
    : JSON.parse(JSON.stringify(state.template?.[weekday] || { exercises: [] }));
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
      saveWorkoutPreset: ({ name, exercises }) =>
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
            createdAt: Date.now(),
          };
          return { workoutPresets: [...s.workoutPresets, preset] };
        }),
      removeWorkoutPreset: (id) =>
        set((s) => ({ workoutPresets: s.workoutPresets.filter((p) => p.id !== id) })),
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

/** Re-export for convenience */
export { getMesoInfoForWeek };
