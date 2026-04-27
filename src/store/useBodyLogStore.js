import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { cloudLoad, cloudSave } from '../lib/cloudSync';

const CLOUD_KEY = 'bodylog';

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

      // ── Cloud sync ──────────────────────────────────────────────
      _initCloud: async () => {
        const data = await cloudLoad(CLOUD_KEY);
        if (data?.entries) {
          // Las fotos (base64) no se suben a Firestore — se quedan solo en local
          const local = get().entries;
          const merged = data.entries.map((e) => {
            const localEntry = local.find((l) => l.id === e.id);
            return localEntry?.photo ? { ...e, photo: localEntry.photo } : e;
          });
          set({ entries: merged });
        } else {
          // Subir sin fotos (para no exceder límite de 1MB de Firestore)
          const entries = get().entries.map(({ photo, ...e }) => e);
          cloudSave(CLOUD_KEY, { entries });
        }
        useBodyLogStore.subscribe((s) => {
          const entries = s.entries.map(({ photo, ...e }) => e);
          cloudSave(CLOUD_KEY, { entries });
        });
      },
    }),
    { name: 'dieta2025_bodylog' }
  )
);

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
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
