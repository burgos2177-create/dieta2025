import { create } from 'zustand';
import { useEffect } from 'react';

export const useToastStore = create((set) => ({
  toasts: [],
  push: (msg, tone = 'default') => {
    const id = Date.now() + Math.random();
    set((s) => ({ toasts: [...s.toasts, { id, msg, tone }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 2600);
  },
}));

export const showToast = (msg, tone) => useToastStore.getState().push(msg, tone);

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  return (
    <div className="fixed bottom-6 right-6 z-[60] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`px-4 py-2.5 rounded-lg shadow-lg border font-medium text-sm animate-[slideIn_0.2s_ease] ${
            t.tone === 'error'
              ? 'bg-bad/20 border-bad/40 text-bad'
              : t.tone === 'ok'
              ? 'bg-ok/20 border-ok/40 text-ok'
              : 'bg-card border-border text-white'
          }`}
        >
          {t.msg}
        </div>
      ))}
    </div>
  );
}
