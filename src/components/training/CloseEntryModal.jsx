import { useEffect, useState } from 'react';
import Modal from '../ui/Modal.jsx';

export default function CloseEntryModal({ open, onClose, onConfirm, dayLabel, totalVol }) {
  const [kcal, setKcal] = useState('');

  useEffect(() => {
    if (open) setKcal('');
  }, [open]);

  const submit = () => {
    onConfirm(Number(kcal) || 0);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={`Cerrar entrenamiento${dayLabel ? ` · ${dayLabel}` : ''}`}>
      <div className="space-y-4">
        <div className="text-xs text-muted bg-white/[0.03] border border-border rounded-lg p-3">
          Volumen total registrado:{' '}
          <span className="font-mono text-accent">{totalVol?.toFixed(0) || 0} kg</span>
          <div className="mt-1">
            Al cerrar, este día queda bloqueado para evitar cambios accidentales. Puedes
            reabrirlo después si necesitas corregir algo.
          </div>
        </div>

        <div>
          <label className="text-xs uppercase tracking-wider text-muted font-display">
            Kcal gastadas en el entrenamiento
          </label>
          <input
            type="number"
            min="0"
            value={kcal}
            onChange={(e) => setKcal(e.target.value)}
            placeholder="ej. 380"
            autoFocus
            className="mt-1"
          />
          <div className="text-[0.65rem] text-muted/70 mt-1">
            Pon <span className="font-mono">0</span> si no se pudo medir.
          </div>
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
            className="px-4 py-2 text-sm rounded-lg bg-accent text-black font-semibold hover:brightness-110"
          >
            🔒 Cerrar entrenamiento
          </button>
        </div>
      </div>
    </Modal>
  );
}
