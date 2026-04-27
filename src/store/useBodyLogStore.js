import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Body composition log store.
 * Entries persist a dated snapshot of body metrics + optional compressed image.
 * entries is always kept sorted by date ascending.
 */
export const useBodyLogStore = create(
  persist(
    (set, get) => ({
      entries: [],

      addEntry: (entry) =>
        set((s) => {
          const withId = { ...entry, id: entry.id || 'b' + Date.now() };
          const next = [...s.entries, withId].sort((a, b) => a.date.localeCompare(b.date));
          return { entries: next };
        }),

      updateEntry: (id, patch) =>
        set((s) => ({
          entries: s.entries
            .map((e) => (e.id === id ? { ...e, ...patch, id } : e))
            .sort((a, b) => a.date.localeCompare(b.date)),
        })),

      deleteEntry: (id) =>
        set((s) => ({ entries: s.entries.filter((e) => e.id !== id) })),

      clear: () => set({ entries: [] }),
    }),
    {
      name: 'dieta2025_bodylog',
    }
  )
);

/**
 * Compress an uploaded image file to a small JPEG DataURL
 * so it fits safely in localStorage (~50-150kB per snapshot).
 * Returns a Promise<string> with the DataURL.
 */
export function compressImageFile(file, maxDim = 900, quality = 0.72) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve(null);
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
