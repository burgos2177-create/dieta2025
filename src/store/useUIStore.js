import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useUIStore = create(
  persist(
    (set) => ({
      syncWeek: false,  // when true, nutrition + training share activeWeek
      setSyncWeek: (v) => set({ syncWeek: !!v }),
      toggleSyncWeek: () => set((s) => ({ syncWeek: !s.syncWeek })),
      // Default gym for saving / filtering workout presets
      currentGym: '',
      setCurrentGym: (g) => set({ currentGym: (g || '').trim() }),
      // Dashboard: keep active day always = today's weekday
      lockDayToToday: false,
      setLockDayToToday: (v) => set({ lockDayToToday: !!v }),
    }),
    { name: 'dieta2025_ui' }
  )
);
