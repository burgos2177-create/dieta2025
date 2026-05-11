import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SEED_TRAINING, SEED_LIBRARY, TR_DAYS_CONFIG } from '../lib/constants';
import { cloudLoadSafe, cloudSave } from '../lib/cloudSync';
import { getMondayKey, todayDayIdx } from '../lib/dates';
import { getMesoInfoForWeek } from '../lib/mesocycle';
import { computeWeightKg } from '../lib/equipment';

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

/** Recompute the canonical kg for an exercise. For 'bodyweight' equipment we
 *  re-derive on the fly from current profile + extraKg, so changes to the
 *  user's body weight propagate retroactively. For other equipment we keep
 *  the stored value. */
function resolveExerciseWeight(equipment, equipmentData, storedWeight, ctx) {
  if (equipment === 'bodyweight') {
    return computeWeightKg(equipment, equipmentData, ctx);
  }
  return Number(storedWeight) || 0;
}

/** Returns the *theoretical* / planned day for (weekKey, weekday), skipping
 *  any snapshot. Used for the 'view planned' toggle and reset-to-planned.
 *  `ctx.bodyweight` is used to live-recompute bodyweight equipment. */
export function selectTheoreticalDay(state, weekKey, weekday, ctx = {}) {
  const info = getMesoInfoForWeek(state.mesocycles, state.activeMesocycleId, weekKey);
  if (info?.meso?.routines?.[weekday]?.exercises?.length > 0) {
    const exs = info.meso.routines[weekday].exercises;
    const weekIdx = info.weekNumber - 1;
    return {
      exercises: exs.map((ex) => {
        const wk = ex.weeks?.[weekIdx] || ex.weeks?.[0] || {};
        const equipment = ex.equipment || 'manual';
        const equipmentData = wk.equipmentData ? { ...wk.equipmentData } : { kg: Number(wk.weight) || 0 };
        return {
          id: ex.id,
          name: ex.name,
          tech: ex.tech || '',
          muscle: ex.muscle,
          equipment,
          equipmentData,
          reps: Number(wk.reps) || 0,
          sets: Number(wk.sets) || 0,
          weight: resolveExerciseWeight(equipment, equipmentData, wk.weight, ctx),
        };
      }),
    };
  }
  return state.template?.[weekday] || null;
}

/** Resolve a training day for (weekKey, weekday):
 *  1. Snapshot (manual edit) wins.
 *  2. Active mesocycle's routine for this (weekday, week-in-meso) if defined.
 *  3. Static template fallback.
 *  `ctx.bodyweight` is used to live-recompute bodyweight equipment. */
export function selectTrainingDay(state, weekKey, weekday, ctx = {}) {
  const snap = state.weeks?.[weekKey]?.[weekday];
  if (snap) {
    // Even on snapshots, recompute bodyweight on the fly so profile changes
    // propagate (the stored weight is allowed to be stale for bodyweight).
    return {
      ...snap,
      exercises: (snap.exercises || []).map((ex) => ({
        ...ex,
        weight: resolveExerciseWeight(ex.equipment, ex.equipmentData, ex.weight, ctx),
      })),
    };
  }
  const info = getMesoInfoForWeek(state.mesocycles, state.activeMesocycleId, weekKey);
  if (info?.meso?.routines?.[weekday]?.exercises?.length > 0) {
    const exs = info.meso.routines[weekday].exercises;
    const weekIdx = info.weekNumber - 1;
    const exercises = exs.map((ex) => {
      const wk = ex.weeks?.[weekIdx] || ex.weeks?.[0] || {};
      const equipment = ex.equipment || 'manual';
      const equipmentData = wk.equipmentData ? { ...wk.equipmentData } : { kg: Number(wk.weight) || 0 };
      return {
        id: ex.id,
        name: ex.name,
        tech: ex.tech || '',
        muscle: ex.muscle,
        equipment,
        equipmentData,
        reps: Number(wk.reps) || 0,
        sets: Number(wk.sets) || 0,
        weight: resolveExerciseWeight(equipment, equipmentData, wk.weight, ctx),
      };
    });
    return { exercises };
  }
  return state.template?.[weekday] || null;
}

/** Returns array of {weekday, day, isSnapshot, status, kcalBurned, ...} for all
 *  training days in the week. Uses selectTrainingDay so it honors
 *  mesocycle.routines when active. status is 'planned'|'open'|'closed'.
 *  `ctx.bodyweight` is forwarded to the day resolvers. */
export function selectTrainingDaysForWeek(state, weekKey, ctx = {}) {
  return TR_DAYS_CONFIG.map((cfg) => {
    const snap = state.weeks?.[weekKey]?.[cfg.weekday];
    const day = selectTrainingDay(state, weekKey, cfg.weekday, ctx);
    let status = 'planned';
    if (snap) status = snap.status === 'closed' ? 'closed' : 'open';
    const theoretical = selectTheoreticalDay(state, weekKey, cfg.weekday, ctx);
    return {
      weekday: cfg.weekday,
      cfg,
      day,
      theoretical,
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
      // extraSessions[weekKey][weekday] = [{ id, type, kcal, durationMin, notes, createdAt }]
      extraSessions: {},
      activeWeek: getMondayKey(new Date()),
      activeDay: todayDayIdx(),

      setActiveWeek: (key) => set({ activeWeek: key }),
      setActiveDay: (idx) => set({ activeDay: idx }),

      // ── Exercise mutators ──
      // NOTE: log entries are NOT created on edits. Only closing the day
      // entry appends to the bitacora; reopening removes them. This ensures
      // the bitacora only contains confirmed/completed sessions.
      updateExercise: (weekday, exIdx, field, value) =>
        set((s) => ({
          weeks: mutateDay(s, s.activeWeek, weekday, (day) => {
            day.exercises = day.exercises.map((e, ei) =>
              ei === exIdx ? { ...e, [field]: value } : e
            );
          }),
        })),

      updateExerciseFieldsNoLog: (weekday, exIdx, patch) =>
        set((s) => ({
          weeks: mutateDay(s, s.activeWeek, weekday, (day) => {
            day.exercises = day.exercises.map((e, ei) =>
              ei === exIdx ? { ...e, ...patch } : e
            );
          }),
        })),

      updateExerciseFields: (weekday, exIdx, patch) =>
        set((s) => ({
          weeks: mutateDay(s, s.activeWeek, weekday, (day) => {
            day.exercises = day.exercises.map((e, ei) =>
              ei === exIdx ? { ...e, ...patch } : e
            );
          }),
        })),

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
      /** Close a day entry, optionally with kcal burned. Appends one log entry
       *  per exercise tagged with sessionKey (weekKey_weekday) so we can
       *  surgically remove them on reopen. */
      closeDayEntry: (weekKey, weekday, kcalBurned) =>
        set((s) => {
          const day = s.weeks?.[weekKey]?.[weekday];
          if (!day) return {};
          const sessionKey = `${weekKey}_${weekday}`;
          // Drop any prior entries from this session (idempotent re-close).
          const log = { ...s.log };
          for (const exId of Object.keys(log)) {
            log[exId] = (log[exId] || []).filter((e) => e.sessionKey !== sessionKey);
          }
          // Append fresh entries based on the snapshot's current values.
          const today = new Date().toISOString().slice(0, 10);
          for (const ex of (day.exercises || [])) {
            const reps = Number(ex.reps) || 0;
            const sets = Number(ex.sets) || 0;
            const weight = Number(ex.weight) || 0;
            const vol = reps * sets * weight;
            const entry = { date: today, reps, sets, weight, vol, sessionKey };
            log[ex.id] = [...(log[ex.id] || []), entry];
          }
          const updated = {
            ...day,
            status: 'closed',
            kcalBurned: Number(kcalBurned) || 0,
            closedAt: Date.now(),
          };
          const weeks = { ...s.weeks };
          weeks[weekKey] = { ...weeks[weekKey], [weekday]: updated };
          return { weeks, log };
        }),
      /** Re-open a closed day entry. Removes all log entries tagged with this
       *  session so the bitacora only counts confirmed (closed) data. */
      reopenDayEntry: (weekKey, weekday) =>
        set((s) => {
          const day = s.weeks?.[weekKey]?.[weekday];
          if (!day) return {};
          const sessionKey = `${weekKey}_${weekday}`;
          const log = { ...s.log };
          for (const exId of Object.keys(log)) {
            log[exId] = (log[exId] || []).filter((e) => e.sessionKey !== sessionKey);
          }
          const { kcalBurned: _kc, closedAt: _ca, ...rest } = day;
          const updated = { ...rest, status: 'open' };
          const weeks = { ...s.weeks };
          weeks[weekKey] = { ...weeks[weekKey], [weekday]: updated };
          return { weeks, log };
        }),
      /** Replace the snapshot's exercises with the planned (theoretical) values
       *  while keeping status='open'. Useful to discard mid-session edits and
       *  start fresh from the meso routine without losing the open state. */
      resetDayToPlanned: (weekKey, weekday) =>
        set((s) => {
          const planned = selectTheoreticalDay(s, weekKey, weekday);
          if (!planned) return {};
          const exercises = (planned.exercises || []).map((e) => ({
            ...e,
            equipmentData: e.equipmentData ? { ...e.equipmentData } : { kg: Number(e.weight) || 0 },
          }));
          const existing = s.weeks?.[weekKey]?.[weekday];
          const day = {
            ...(existing || {}),
            exercises,
            status: 'open',
            openedAt: existing?.openedAt || Date.now(),
            kcalBurned: undefined,
            closedAt: undefined,
          };
          const weeks = { ...(s.weeks || {}) };
          weeks[weekKey] = { ...(weeks[weekKey] || {}), [weekday]: day };
          // If the day was previously closed, also clean its log entries.
          const sessionKey = `${weekKey}_${weekday}`;
          const log = { ...s.log };
          for (const exId of Object.keys(log)) {
            log[exId] = (log[exId] || []).filter((e) => e.sessionKey !== sessionKey);
          }
          return { weeks, log };
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
      /** Replace ALL workoutPresets with one auto-generated per training day
       *  using the active mesocycle's routine (week 1 values). */
      regenerateWorkoutPresetsFromMeso: () =>
        set((s) => {
          const meso = s.mesocycles.find((m) => m.id === s.activeMesocycleId);
          if (!meso) return {};
          const newPresets = [];
          for (const cfg of TR_DAYS_CONFIG) {
            const dayRoutine = meso.routines?.[cfg.weekday];
            if (!dayRoutine?.exercises?.length) continue;
            const exercises = (dayRoutine.exercises || []).map((e) => {
              const wk = e.weeks?.[0] || {};
              return {
                id: e.id,
                name: e.name,
                tech: e.tech || '',
                muscle: e.muscle,
                reps: Number(wk.reps) || 0,
                sets: Number(wk.sets) || 0,
                weight: Number(wk.weight) || 0,
                equipment: e.equipment || 'manual',
                equipmentData: wk.equipmentData ? { ...wk.equipmentData } : { kg: Number(wk.weight) || 0 },
              };
            });
            newPresets.push({
              id: `wp_${Date.now().toString(36)}_${cfg.weekday}_${Math.random().toString(36).slice(2, 6)}`,
              name: `${cfg.focus.split(/[/:]/)[0].trim()} · ${meso.name}`,
              exercises,
              gym: '',
              mesoWeek: 1,
              bodyWeightKg: Number(meso.startWeight) || null,
              createdAt: Date.now(),
            });
          }
          return { workoutPresets: newPresets };
        }),

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
      overwriteWorkoutPreset: (id, patch = {}) =>
        set((s) => ({
          workoutPresets: s.workoutPresets.map((p) => {
            if (p.id !== id) return p;
            const next = { ...p, updatedAt: Date.now() };
            if (patch.name !== undefined && patch.name) next.name = patch.name.trim();
            if (patch.exercises !== undefined) {
              next.exercises = (patch.exercises || []).map((e) => ({
                id: e.id,
                name: e.name,
                tech: e.tech || '',
                muscle: e.muscle,
                reps: Number(e.reps) || 0,
                sets: Number(e.sets) || 0,
                weight: Number(e.weight) || 0,
                equipment: e.equipment || 'manual',
                equipmentData: e.equipmentData ? { ...e.equipmentData } : { kg: Number(e.weight) || 0 },
              }));
            }
            if (patch.gym !== undefined) next.gym = (patch.gym || '').trim();
            if (patch.mesoWeek !== undefined) {
              next.mesoWeek = patch.mesoWeek == null ? null : Number(patch.mesoWeek);
            }
            if (patch.bodyWeightKg !== undefined) {
              next.bodyWeightKg = patch.bodyWeightKg == null ? null : Number(patch.bodyWeightKg);
            }
            return next;
          }),
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

      // ── Extra sessions (cardio / boxeo / etc.) ──
      addExtraSession: (weekKey, weekday, data) =>
        set((s) => {
          const session = {
            id: `es_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
            type: data.type || 'otro',
            kcal: Number(data.kcal) || 0,
            durationMin: Number(data.durationMin) || 0,
            notes: (data.notes || '').trim(),
            createdAt: Date.now(),
          };
          const ex = { ...(s.extraSessions || {}) };
          const wk = { ...(ex[weekKey] || {}) };
          wk[weekday] = [...(wk[weekday] || []), session];
          ex[weekKey] = wk;
          return { extraSessions: ex };
        }),
      updateExtraSession: (weekKey, weekday, id, patch) =>
        set((s) => {
          const ex = { ...(s.extraSessions || {}) };
          const wk = { ...(ex[weekKey] || {}) };
          wk[weekday] = (wk[weekday] || []).map((es) =>
            es.id === id ? { ...es, ...patch } : es
          );
          ex[weekKey] = wk;
          return { extraSessions: ex };
        }),
      removeExtraSession: (weekKey, weekday, id) =>
        set((s) => {
          const ex = { ...(s.extraSessions || {}) };
          const wk = { ...(ex[weekKey] || {}) };
          wk[weekday] = (wk[weekday] || []).filter((es) => es.id !== id);
          if (wk[weekday].length === 0) delete wk[weekday];
          if (Object.keys(wk).length === 0) delete ex[weekKey];
          else ex[weekKey] = wk;
          return { extraSessions: ex };
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
      /** Replace the entire exercises list for a (meso, weekday). Used by
       *  apply-preset-to-routine in replace mode. */
      setMesoRoutineDayExercises: (mesoId, weekday, exercises) =>
        set((s) => ({
          mesocycles: s.mesocycles.map((m) =>
            m.id !== mesoId
              ? m
              : { ...m, routines: { ...(m.routines || {}), [weekday]: { exercises: [...exercises] } } }
          ),
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
        const r = await cloudLoadSafe(CLOUD_KEY);
        if (!r.ok) {
          console.warn('[training] sync deshabilitado en esta sesión por error inicial.');
          return;
        }
        if (r.found && r.data) {
          const data = r.data;
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
            extraSessions: data.extraSessions || {},
          });
        } else {
          const s = get();
          cloudSave(CLOUD_KEY, {
            template: s.template, weeks: s.weeks, log: s.log, library: s.library,
            workoutPresets: s.workoutPresets,
            mesocycles: s.mesocycles, activeMesocycleId: s.activeMesocycleId,
            extraSessions: s.extraSessions,
          });
        }
        useTrainingStore.subscribe((s) => {
          cloudSave(CLOUD_KEY, {
            template: s.template, weeks: s.weeks, log: s.log, library: s.library,
            workoutPresets: s.workoutPresets,
            mesocycles: s.mesocycles, activeMesocycleId: s.activeMesocycleId,
            extraSessions: s.extraSessions,
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
        if (!state.extraSessions || typeof state.extraSessions !== 'object') state.extraSessions = {};
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

/** Convert a workoutPreset's flat exercises array into the routine matrix
 *  shape, replicating the same values across N weeks. */
export function presetToRoutineExercises(preset, numWeeks) {
  return (preset?.exercises || []).map((e) => ({
    id: e.id,
    name: e.name,
    tech: e.tech || '',
    muscle: e.muscle,
    equipment: e.equipment || 'manual',
    weeks: Array.from({ length: numWeeks }, () => ({
      reps: Number(e.reps) || 0,
      sets: Number(e.sets) || 0,
      weight: Number(e.weight) || 0,
      equipmentData: e.equipmentData ? { ...e.equipmentData } : { kg: Number(e.weight) || 0 },
    })),
  }));
}

/** Convert a routine day's exercises (with per-week values) into the flat
 *  preset shape, taking values from the chosen week index (default 0). */
export function routineDayToPresetExercises(dayRoutine, fromWeekIdx = 0) {
  return (dayRoutine?.exercises || []).map((e) => {
    const wk = e.weeks?.[fromWeekIdx] || e.weeks?.[0] || {};
    return {
      id: e.id,
      name: e.name,
      tech: e.tech || '',
      muscle: e.muscle,
      reps: Number(wk.reps) || 0,
      sets: Number(wk.sets) || 0,
      weight: Number(wk.weight) || 0,
      equipment: e.equipment || 'manual',
      equipmentData: wk.equipmentData ? { ...wk.equipmentData } : { kg: Number(wk.weight) || 0 },
    };
  });
}

/** Re-export for convenience */
export { getMesoInfoForWeek };
