import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SEED_TRAINING, SEED_LIBRARY } from '../lib/constants';
import { cloudLoad, cloudSave } from '../lib/cloudSync';

const cloneSeed = () => JSON.parse(JSON.stringify(SEED_TRAINING));
const cloneLibrary = () => JSON.parse(JSON.stringify(SEED_LIBRARY));

const CLOUD_KEY = 'training';

export const useTrainingStore = create(
  persist(
    (set, get) => ({
      days: cloneSeed(),
      log: {}, // { [exId]: [ { date, reps, sets, weight, vol } ] }
      library: cloneLibrary(),

      updateExercise: (dayIdx, exIdx, field, value) =>
        set((s) => {
          const days = s.days.map((d, di) =>
            di === dayIdx
              ? { ...d, exercises: d.exercises.map((e, ei) => (ei === exIdx ? { ...e, [field]: value } : e)) }
              : d
          );
          const ex = days[dayIdx].exercises[exIdx];
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
          return { days, log };
        }),

      addExercise: (dayIdx, exercise) =>
        set((s) => {
          const id = exercise.id || 'e' + Date.now();
          const ex = { ...exercise, id };
          const days = s.days.map((d, di) =>
            di === dayIdx ? { ...d, exercises: [...d.exercises, ex] } : d
          );
          const inLib = s.library.some(
            (l) => l.id === id || (l.name.toLowerCase() === ex.name.toLowerCase() && l.muscle === ex.muscle)
          );
          const library = inLib
            ? s.library
            : [...s.library, { id, name: ex.name, tech: ex.tech || '', muscle: ex.muscle }];
          return { days, library };
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

      reorderExercise: (dayIdx, fromIdx, toIdx) =>
        set((s) => {
          const exercises = [...s.days[dayIdx].exercises];
          const [moved] = exercises.splice(fromIdx, 1);
          exercises.splice(toIdx, 0, moved);
          return { days: s.days.map((d, di) => (di === dayIdx ? { ...d, exercises } : d)) };
        }),

      deleteExercise: (dayIdx, exIdx) =>
        set((s) => ({
          days: s.days.map((d, di) =>
            di === dayIdx ? { ...d, exercises: d.exercises.filter((_, ei) => ei !== exIdx) } : d
          ),
        })),

      appendLog: (exId, entry) =>
        set((s) => ({ log: { ...s.log, [exId]: [...(s.log[exId] || []), entry] } })),

      deleteLogEntry: (exId, entryIdx) =>
        set((s) => ({
          log: { ...s.log, [exId]: (s.log[exId] || []).filter((_, i) => i !== entryIdx) },
        })),

      clearLog: (exId) =>
        set((s) => ({ log: { ...s.log, [exId]: [] } })),

      resetSeed: () => set({ days: cloneSeed(), log: {}, library: cloneLibrary() }),

      // ── Cloud sync ──────────────────────────────────────────────
      _initCloud: async () => {
        const data = await cloudLoad(CLOUD_KEY);
        if (data?.days) {
          set({ days: data.days, log: data.log || {}, library: data.library || cloneLibrary() });
        } else {
          // Primera vez: subir el estado actual a la nube
          const { days, log, library } = get();
          cloudSave(CLOUD_KEY, { days, log, library });
        }
        // Suscribir cambios futuros → guardar en la nube
        useTrainingStore.subscribe((s) => {
          cloudSave(CLOUD_KEY, { days: s.days, log: s.log, library: s.library });
        });
      },
    }),
    { name: 'dieta2025_training' }
  )
);
