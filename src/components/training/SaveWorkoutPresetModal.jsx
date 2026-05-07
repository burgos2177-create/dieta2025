import { useEffect, useState } from 'react';
import Modal from '../ui/Modal.jsx';

export default function SaveWorkoutPresetModal({ open, onClose, onSubmit, exercises, dayLabel }) {
  const [name, setName] = useState('');

  useEffect(() => {
    if (open) setName(dayLabel ? `${dayLabel}` : '');
  }, [open, dayLabel]);

  const empty = !exercises || exercises.length === 0;
  const totalVol = (exercises || []).reduce(
    (a, e) => a + (Number(e.reps) || 0) * (Number(e.sets) || 0) * (Number(e.weight) || 0), 0
  );

  const submit = () => {
    if (!name.trim() || empty) return;
    onSubmit({ name: name.trim(), exercises });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Guardar rutina como preset">
      <div className="space-y-4">
        {empty ? (
          <div className="text-sm text-muted bg-white/[0.03] border border-border rounded-lg p-3">
            Esta rutina no tiene ejercicios. Añade alguno antes de guardar como preset.
          </div>
        ) : (
          <>
            <div className="text-xs text-muted bg-white/[0.03] border border-border rounded-lg p-3">
              <div className="font-mono">
                <span className="text-accent">{totalVol.toFixed(0)} kg vol</span>
                {' · '}
                {exercises.length} ejercicio{exercises.length !== 1 ? 's' : ''}
              </div>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-muted font-display">Nombre del preset</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ej. Pierna pesado, Pull volumen"
                autoFocus
                className="mt-1"
              />
            </div>
          </>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-border text-muted hover:text-white"
          >
            Cancelar
          </button>
          <button
            onClick={submit}
            disabled={empty || !name.trim()}
            className="px-4 py-2 text-sm rounded-lg bg-accent text-black font-semibold hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Guardar preset
          </button>
        </div>
      </div>
    </Modal>
  );
}
