import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { buildSeedNutPlan } from '../lib/constants';

function ensure7Days(plan) {
  const out = { ...plan };
  for (let d = 0; d < 7; d++) {
    if (!out[d]) out[d] = { desayuno: [], almuerzo: [], comida: [], cena: [] };
  }
  return out;
}

export const useNutritionStore = create(
  persist(
    (set, get) => ({
      plan: buildSeedNutPlan(),
      activeDay: 0,
      setActiveDay: (idx) => set({ activeDay: idx }),
      addEntry: (dayIdx, mealId, entry) =>
        set((s) => {
          const plan = ensure7Days(s.plan);
          plan[dayIdx] = { ...plan[dayIdx], [mealId]: [...plan[dayIdx][mealId], entry] };
          return { plan: { ...plan } };
        }),
      updateEntry: (dayIdx, mealId, entryIdx, amount) =>
        set((s) => {
          const plan = ensure7Days(s.plan);
          const list = [...plan[dayIdx][mealId]];
          list[entryIdx] = { ...list[entryIdx], amount };
          plan[dayIdx] = { ...plan[dayIdx], [mealId]: list };
          return { plan: { ...plan } };
        }),
      removeEntry: (dayIdx, mealId, entryIdx) =>
        set((s) => {
          const plan = ensure7Days(s.plan);
          const list = plan[dayIdx][mealId].filter((_, i) => i !== entryIdx);
          plan[dayIdx] = { ...plan[dayIdx], [mealId]: list };
          return { plan: { ...plan } };
        }),
      resetSeed: () => set({ plan: buildSeedNutPlan() }),
    }),
    {
      name: 'dieta2025_nutrition',
      onRehydrateStorage: () => (state) => {
        if (state) state.plan = ensure7Days(state.plan || {});
      },
    }
  )
);
