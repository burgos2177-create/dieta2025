import { useEffect, useState } from 'react';
import Modal from '../ui/Modal.jsx';

const ICON_PRESETS = ['☀️', '🌤', '🍽', '🌙', '🥣', '🥗', '🍎', '🥤', '🥪', '🍳', '🌯', '🥜'];

export default function MealFormModal({ open, mode = 'add', initial, onClose, onSubmit }) {
  const [label, setLabel] = useState('');
  const [icon, setIcon] = useState('🍽');
  const [sub, setSub] = useState('');

  useEffect(() => {
    if (open) {
      setLabel(initial?.label || '');
      setIcon(initial?.icon || '🍽');
      setSub(initial?.sub || '');
    }
  }, [open, initial]);

  const submit = () => {
    const trimmed = label.trim();
    if (!trimmed) return;
    onSubmit({ label: trimmed, icon: icon || '🍽', sub: sub.trim() });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={mode === 'add' ? 'Añadir comida' : 'Editar comida'}>
      <div className="space-y-4">
        <div>
          <label className="text-xs uppercase tracking-wider text-muted font-display">Nombre</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="ej. Merienda, Pre-entreno…"
            autoFocus
            className="mt-1"
          />
        </div>

        <div>
          <label className="text-xs uppercase tracking-wider text-muted font-display">Icono</label>
          <div className="mt-1 flex items-center gap-2">
            <input
              type="text"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              maxLength={4}
              className="!w-16 text-center text-xl"
            />
            <div className="flex-1 flex flex-wrap gap-1">
              {ICON_PRESETS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setIcon(ic)}
                  className={`text-lg w-8 h-8 rounded-md border ${
                    icon === ic ? 'border-accent bg-accent/10' : 'border-border hover:border-white/20'
                  }`}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs uppercase tracking-wider text-muted font-display">Subtítulo (opcional)</label>
          <input
            type="text"
            value={sub}
            onChange={(e) => setSub(e.target.value)}
            placeholder="ej. Mañana, Pre-entreno…"
            className="mt-1"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-border text-muted hover:text-white"
          >
            Cancelar
          </button>
          <button
            onClick={submit}
            disabled={!label.trim()}
            className="px-4 py-2 text-sm rounded-lg bg-accent text-black font-semibold hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {mode === 'add' ? 'Añadir' : 'Guardar'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
