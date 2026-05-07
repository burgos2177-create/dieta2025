import { useState } from 'react';
import Modal from '../ui/Modal.jsx';
import { sumEntries } from '../../lib/calculators.js';

export default function ApplyPresetModal({ open, onClose, onApply, presets, foodsById, mealLabel }) {
  const [selectedId, setSelectedId] = useState(null);
  const [mode, setMode] = useState('append');

  const close = () => {
    setSelectedId(null);
    setMode('append');
    onClose();
  };

  const apply = () => {
    if (!selectedId) return;
    onApply(selectedId, mode);
    close();
  };

  return (
    <Modal open={open} onClose={close} title={`Aplicar preset${mealLabel ? ` · ${mealLabel}` : ''}`}>
      <div className="space-y-4">
        {presets.length === 0 ? (
          <div className="text-sm text-muted bg-white/[0.03] border border-border rounded-lg p-4 text-center">
            Aún no tienes presets guardados.
            <div className="text-xs mt-1 opacity-80">
              Guarda una comida como preset para reutilizarla aquí.
            </div>
          </div>
        ) : (
          <>
            <div className="max-h-72 overflow-auto divide-y divide-border rounded-lg border border-border">
              {presets.map((p) => {
                const t = sumEntries(p.entries, foodsById);
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedId(p.id)}
                    className={`w-full text-left px-3 py-2.5 hover:bg-white/5 transition ${
                      selectedId === p.id ? 'bg-accent/10' : ''
                    }`}
                  >
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm text-white truncate">{p.name}</span>
                      <span className="font-mono text-xs text-accent">{t.kcal.toFixed(0)} kcal</span>
                    </div>
                    <div className="text-[0.65rem] text-muted mt-0.5">
                      {p.entries.length} alimento{p.entries.length !== 1 ? 's' : ''} · P{' '}
                      {t.prot.toFixed(0)}g · CH {t.carb.toFixed(0)}g · G {t.fat.toFixed(0)}g
                    </div>
                  </button>
                );
              })}
            </div>

            <div>
              <div className="text-xs uppercase tracking-wider text-muted font-display mb-2">Modo</div>
              <div className="grid grid-cols-2 gap-2">
                <ModeBtn active={mode === 'append'} onClick={() => setMode('append')} label="Añadir" sub="Se suman al contenido actual" />
                <ModeBtn active={mode === 'replace'} onClick={() => setMode('replace')} label="Reemplazar" sub="Borra y pone solo el preset" />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={close}
                className="px-4 py-2 text-sm rounded-lg border border-border text-muted hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={apply}
                disabled={!selectedId}
                className="px-4 py-2 text-sm rounded-lg bg-accent text-black font-semibold hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Aplicar
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

function ModeBtn({ active, onClick, label, sub }) {
  return (
    <button
      onClick={onClick}
      className={`text-left px-3 py-2 rounded-lg border transition ${
        active
          ? 'border-accent bg-accent/10 text-white'
          : 'border-border text-muted hover:text-white hover:border-white/20'
      }`}
    >
      <div className="text-sm font-semibold">{label}</div>
      <div className="text-[0.65rem] opacity-80">{sub}</div>
    </button>
  );
}
