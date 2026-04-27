import { useEffect } from 'react';

export default function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg' }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`w-full ${maxWidth} bg-card border border-border rounded-card shadow-2xl max-h-[90vh] overflow-hidden flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-display text-xl text-white tracking-wide">{title}</h3>
          <button
            onClick={onClose}
            className="text-muted hover:text-white text-2xl leading-none"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>
        <div className="p-5 overflow-auto">{children}</div>
      </div>
    </div>
  );
}
