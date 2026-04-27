import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SEED_FOODS } from '../lib/constants';
import { cloudLoad, cloudSave } from '../lib/cloudSync';

const CLOUD_KEY = 'foods';

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

      // ── Cloud sync ──────────────────────────────────────────────
      _initCloud: async () => {
        const data = await cloudLoad(CLOUD_KEY);
        if (data?.foods) {
          set({ foods: mergeSeed(data.foods) });
        } else {
          cloudSave(CLOUD_KEY, { foods: get().foods });
        }
        useFoodStore.subscribe((s) => {
          cloudSave(CLOUD_KEY, { foods: s.foods });
        });
      },
    }),
    {
      name: 'dieta2025_foods',
      onRehydrateStorage: () => (state) => {
        if (state) state.foods = mergeSeed(state.foods || []);
      },
    }
  )
);
