import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SEED_FOODS } from '../lib/constants';

// Merge seed into persisted list (add-only on id conflict)
function mergeSeed(foods) {
  const out = [...foods];
  SEED_FOODS.forEach((s) => {
    if (!out.find((f) => f.id === s.id)) out.push(s);
  });
  return out;
}

export const useFoodStore = create(
  persist(
    (set, get) => ({
      foods: [...SEED_FOODS],
      addFood: (food) =>
        set((s) => ({
          foods: [{ ...food, id: food.id || 'f' + Date.now() }, ...s.foods],
        })),
      updateFood: (id, food) =>
        set((s) => ({
          foods: s.foods.map((f) => (f.id === id ? { ...f, ...food, id } : f)),
        })),
      deleteFood: (id) =>
        set((s) => ({ foods: s.foods.filter((f) => f.id !== id) })),
      getById: (id) => get().foods.find((f) => f.id === id),
      replaceAll: (foods) => set({ foods: mergeSeed(foods) }),
    }),
    {
      name: 'dieta2025_foods',
      onRehydrateStorage: () => (state) => {
        if (state) state.foods = mergeSeed(state.foods || []);
      },
    }
  )
);
