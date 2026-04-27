import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SEED_TRAINING } from '../lib/constants';

const cloneSeed = () => JSON.parse(JSON.stringify(SEED_TRAINING));

const cloneLibrary = () =>
  SEED_TRAINING.flatMap((day) =>
    day.exercises.map((ex) => ({ id: ex.id, name: ex.name, tech: ex.tech || '', muscle: ex.muscle }))
  );

export const useTrainingStore = create(
  persist(
    (set) => ({
      days: cloneSeed(),
      log: {}, // { [exId]: [ { date, reps, sets, weight, vol } ] }
      // Biblioteca de ejercicios: persiste aunque se eliminen de los días de entreno
      library: cloneLibrary(), // { id, name, tech, muscle }

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
          // Agregar a biblioteca si no existe por id o por nombre+músculo
          const inLib = s.library.some(
            (l) => l.id === id || (l.name.toLowerCase() === ex.name.toLowerCase() && l.muscle === ex.muscle)
          );
          const library = inLib
            ? s.library
            : [...s.library, { id, name: ex.name, tech: ex.tech || '', muscle: ex.muscle }];
          return { days, library };
        }),

      // Solo agrega a la biblioteca sin añadir a ningún día
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
          return {
            days: s.days.map((d, di) => (di === dayIdx ? { ...d, exercises } : d)),
          };
        }),

      // Solo quita del día — la bitácora y la biblioteca no se tocan
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
    }),
    { name: 'dieta2025_training' }
  )
);
