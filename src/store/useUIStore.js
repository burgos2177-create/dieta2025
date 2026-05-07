import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useUIStore = create(
  persist(
    (set) => ({
      syncWeek: false,  // when true, nutrition + training share activeWeek
      setSyncWeek: (v) => set({ syncWeek: !!v }),
      toggleSyncWeek: () => set((s) => ({ syncWeek: !s.syncWeek })),
    }),
    { name: 'dieta2025_ui' }
  )
);
