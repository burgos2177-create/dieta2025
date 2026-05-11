import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SEED_FOODS, FOOD_CATEGORIES } from '../lib/constants';
import { cloudLoadSafe, cloudSave } from '../lib/cloudSync';

const CLOUD_KEY = 'foods';
const DEFAULT_CATEGORIES = FOOD_CATEGORIES;

function mergeSeed(foods) {
  const out = [...foods];
  SEED_FOODS.forEach((s) => {
    if (!out.find((f) => f.id === s.id)) out.push(s);
  });
  return out;
}

function ensureCategories(cats) {
  return Array.isArray(cats) && cats.length ? cats : DEFAULT_CATEGORIES;
}

function slugify(label) {
  return label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/(^_|_$)/g, '');
}

function uniqueCatId(base, existing) {
  const baseId = base || 'c' + Date.now().toString(36);
  if (!existing.some((c) => c.id === baseId)) return baseId;
  let n = 2;
  while (existing.some((c) => c.id === baseId + '_' + n)) n++;
  return baseId + '_' + n;
}

export const useFoodStore = create(
  persist(
    (set, get) => ({
      foods: [...SEED_FOODS],
      categories: DEFAULT_CATEGORIES,

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

      // ── Categories ─────────────────────────────────────────────
      addCategory: ({ label }) =>
        set((s) => {
          const trimmed = (label || '').trim();
          if (!trimmed) return {};
          if (s.categories.some((c) => c.label.toLowerCase() === trimmed.toLowerCase())) return {};
          const id = uniqueCatId(slugify(trimmed), s.categories);
          return { categories: [...s.categories, { id, label: trimmed }] };
        }),
      renameCategory: (id, label) =>
        set((s) => {
          const trimmed = (label || '').trim();
          if (!trimmed) return {};
          return {
            categories: s.categories.map((c) => (c.id === id ? { ...c, label: trimmed } : c)),
          };
        }),
      removeCategory: (id, reassignTo) =>
        set((s) => {
          const remaining = s.categories.filter((c) => c.id !== id);
          // pick a safe target for any food currently using `id`
          const inUse = s.foods.some((f) => f.category === id);
          let target = reassignTo;
          if (!target || !remaining.some((c) => c.id === target)) {
            target = remaining.find((c) => c.id === 'otro')?.id || remaining[0]?.id;
          }
          if (inUse && !target) {
            // refuse: nothing to reassign to
            return {};
          }
          return {
            categories: remaining,
            foods: s.foods.map((f) => (f.category === id ? { ...f, category: target } : f)),
          };
        }),

      // ── Cloud sync ──────────────────────────────────────────────
      _initCloud: async () => {
        const r = await cloudLoadSafe(CLOUD_KEY);
        if (!r.ok) {
          // Error de red/auth — NO subimos seed encima de lo que pueda haber
          // en la nube. El usuario sigue trabajando local; la próxima recarga
          // intentará re-sincronizar.
          console.warn('[foods] sync deshabilitado en esta sesión por error inicial.');
          return;
        }
        if (r.found && r.data?.foods) {
          set({
            foods: mergeSeed(r.data.foods),
            categories: ensureCategories(r.data.categories),
          });
        } else {
          const s = get();
          cloudSave(CLOUD_KEY, { foods: s.foods, categories: s.categories });
        }
        useFoodStore.subscribe((s) => {
          cloudSave(CLOUD_KEY, { foods: s.foods, categories: s.categories });
        });
      },
    }),
    {
      name: 'dieta2025_foods',
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.foods = mergeSeed(state.foods || []);
        state.categories = ensureCategories(state.categories);
      },
    }
  )
);
