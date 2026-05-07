import { useEffect, useState } from 'react';
import Modal from '../ui/Modal.jsx';
import { sumEntries } from '../../lib/calculators.js';

export default function SavePresetModal({ open, onClose, onSubmit, entries, foodsById, mealLabel }) {
  const [name, setName] = useState('');

  useEffect(() => {
    if (open) setName(mealLabel ? `${mealLabel}` : '');
  }, [open, mealLabel]);

  const totals = entries ? sumEntries(entries, foodsById) : { kcal: 0, prot: 0, carb: 0, fat: 0 };
  const empty = !entries || entries.length === 0;

  const submit = () => {
    if (!name.trim() || empty) return;
    onSubmit({ name: name.trim(), entries });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Guardar como preset">
      <div className="space-y-4">
        {empty ? (
          <div className="text-sm text-muted bg-white/[0.03] border border-border rounded-lg p-3">
            Esta comida está vacía. Añade alimentos antes de guardar como preset.
          </div>
        ) : (
          <>
            <div className="text-xs text-muted bg-white/[0.03] border border-border rounded-lg p-3 space-y-1">
              <div className="font-mono">
                <span className="text-accent">{totals.kcal.toFixed(0)} kcal</span> · P{' '}
                {totals.prot.toFixed(0)}g · CH {totals.carb.toFixed(0)}g · G {totals.fat.toFixed(0)}g
              </div>
              <div>{entries.length} alimento{entries.length !== 1 ? 's' : ''} en este preset.</div>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-muted font-display">Nombre del preset</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ej. Desayuno alto carb"
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
