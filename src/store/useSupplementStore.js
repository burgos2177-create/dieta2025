import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SEED_SUPPLEMENTS } from '../lib/supplementsSeed';
import { cloudLoad, cloudSave } from '../lib/cloudSync';
import { ymd } from '../lib/dates';

const CLOUD_KEY = 'supplements';

function newId() {
  return `sup_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

function mergeSeed(library) {
  const out = [...(library || [])];
  for (const s of SEED_SUPPLEMENTS) {
    if (!out.find((x) => x.id === s.id)) out.push(s);
  }
  return out;
}

export const useSupplementStore = create(
  persist(
    (set, get) => ({
      library: [...SEED_SUPPLEMENTS],
      // intake[YYYY-MM-DD] = { [supplementId]: true }
      intake: {},

      addSupplement: (data) =>
        set((s) => ({
          library: [...s.library, { id: newId(), active: true, daysOfWeek: [0,1,2,3,4,5,6], doseAmount: 1, doseUnit: 'g', kcalPerDose: 0, ...data }],
        })),
      updateSupplement: (id, patch) =>
        set((s) => ({
          library: s.library.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        })),
      removeSupplement: (id) =>
        set((s) => ({
          library: s.library.filter((x) => x.id !== id),
        })),

      /** Mark a supplement intake (taken=true|false) for a given date (YYYY-MM-DD). */
      markIntake: (dateKey, supplementId, taken) =>
        set((s) => {
          const day = { ...(s.intake[dateKey] || {}) };
          if (taken) day[supplementId] = true;
          else delete day[supplementId];
          const intake = { ...s.intake };
          if (Object.keys(day).length === 0) delete intake[dateKey];
          else intake[dateKey] = day;
          return { intake };
        }),

      /** Toggle a single supplement's intake state for the given date. */
      toggleIntake: (dateKey, supplementId) =>
        set((s) => {
          const day = { ...(s.intake[dateKey] || {}) };
          if (day[supplementId]) delete day[supplementId];
          else day[supplementId] = true;
          const intake = { ...s.intake };
          if (Object.keys(day).length === 0) delete intake[dateKey];
          else intake[dateKey] = day;
          return { intake };
        }),

      clearDay: (dateKey) =>
        set((s) => {
          const intake = { ...s.intake };
          delete intake[dateKey];
          return { intake };
        }),

      // ── Cloud sync ──
      _initCloud: async () => {
        const data = await cloudLoad(CLOUD_KEY);
        if (data) {
          set({
            library: mergeSeed(data.library),
            intake: data.intake || {},
          });
        } else {
          const s = get();
          cloudSave(CLOUD_KEY, { library: s.library, intake: s.intake });
        }
        useSupplementStore.subscribe((s) => {
          cloudSave(CLOUD_KEY, { library: s.library, intake: s.intake });
        });
      },
    }),
    {
      name: 'dieta2025_supplements',
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.library = mergeSeed(state.library || []);
        state.intake = state.intake || {};
      },
    }
  )
);

/** Returns supplements scheduled for the given weekday and active. */
export function selectScheduledForWeekday(state, weekday) {
  return state.library.filter((s) => s.active && (s.daysOfWeek || []).includes(weekday));
}

/** Helper: today's date key in YYYY-MM-DD. */
export function todayKey() {
  return ymd(new Date());
}
