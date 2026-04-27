import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useProfileStore = create(
  persist(
    (set) => ({
      nombre: 'Fernando',
      edad: 23,
      peso: 64.3,
      altura: 174,
      sexo: 'm',
      act: 1.725,
      // Lyle cycling
      highPct: 110,
      lowPct: 90,
      // Macros (%)
      carb: 56,
      prot: 25,
      lip: 19,
      setField: (key, val) => set((s) => ({ ...s, [key]: val })),
      setMacros: (carb, prot, lip) => set({ carb, prot, lip }),
    }),
    { name: 'dieta2025_profile' }
  )
);
