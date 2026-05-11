import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { cloudLoadSafe, cloudSave } from '../lib/cloudSync';

const CLOUD_KEY = 'profile';

const DEFAULTS = {
  nombre: 'Fernando',
  edad: 23,
  peso: 64.3,
  altura: 174,
  sexo: 'm',
  act: 1.725,
  // NEAT (kcal/día sin ejercicio) — usado para el balance real del día.
  // act se mantiene para el cálculo del objetivo Lyle (planificación).
  neat: 600,
  highPct: 110,
  lowPct: 90,
  carb: 56,
  prot: 25,
  lip: 19,
};

export const useProfileStore = create(
  persist(
    (set, get) => ({
      ...DEFAULTS,
      setField: (key, val) => set((s) => ({ ...s, [key]: val })),
      setMacros: (carb, prot, lip) => set({ carb, prot, lip }),

      // ── Cloud sync ──────────────────────────────────────────────
      _initCloud: async () => {
        const r = await cloudLoadSafe(CLOUD_KEY);
        if (!r.ok) {
          console.warn('[profile] sync deshabilitado en esta sesión por error inicial.');
          return;
        }
        if (r.found && r.data) {
          const { setField, setMacros, _initCloud, ...profile } = r.data;
          set(profile);
        } else {
          const { setField, setMacros, _initCloud, ...profile } = get();
          cloudSave(CLOUD_KEY, profile);
        }
        useProfileStore.subscribe((s) => {
          const { setField, setMacros, _initCloud, ...profile } = s;
          cloudSave(CLOUD_KEY, profile);
        });
      },
    }),
    { name: 'dieta2025_profile' }
  )
);
