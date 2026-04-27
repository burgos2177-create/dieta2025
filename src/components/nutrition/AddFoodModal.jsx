import { useMemo, useState } from 'react';
import Modal from '../ui/Modal.jsx';
import { useFoodStore } from '../../store/useFoodStore.js';
import { computeFoodMacros } from '../../lib/calculators.js';

export default function AddFoodModal({ open, onClose, onAdd, gap }) {
  const foods = useFoodStore((s) => s.foods);
  const [q, setQ] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [amount, setAmount] = useState(100);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return foods.slice(0, 40);
    return foods.filter(
      (f) =>
        f.name.toLowerCase().includes(qq) ||
        (f.brand || '').toLowerCase().includes(qq) ||
        f.category.includes(qq)
    );
  }, [foods, q]);

  const selected = foods.find((f) => f.id === selectedId);
  const preview = selected ? computeFoodMacros(selected, Number(amount) || 0) : null;

  const reset = () => {
    setQ('');
    setSelectedId(null);
    setAmount(100);
  };

  const confirm = () => {
    if (!selected || !amount) return;
    onAdd({ foodId: selected.id, amount: Number(amount), unit: selected.servingUnit });
    reset();
    onClose();
  };

  return (
    <Modal open={open} onClose={() => { reset(); onClose(); }} title="Agregar alimento">
      {gap && (
        <div className="mb-3 text-xs bg-white/5 border border-border rounded-lg p-3 text-muted">
          Brecha actual: <span className="text-accent font-mono">{gap.kcal.toFixed(0)} kcal</span> ·{' '}
          <span className="text-ok font-mono">P {gap.prot.toFixed(1)}g</span> ·{' '}
          <span className="text-cyan-300 font-mono">CH {gap.carb.toFixed(1)}g</span> ·{' '}
          <span className="text-warn font-mono">G {gap.fat.toFixed(1)}g</span>
        </div>
      )}

      <input
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar alimento…"
        className="mb-3"
      />

      <div className="max-h-60 overflow-auto divide-y divide-border rounded-lg border border-border">
        {filtered.length === 0 && (
          <div className="text-sm text-muted px-3 py-4 text-center">Sin resultados</div>
        )}
        {filtered.map((f) => (
          <button
            key={f.id}
            onClick={() => { setSelectedId(f.id); setAmount(f.servingSize); }}
            className={`w-full text-left px-3 py-2 hover:bg-white/5 ${
              f.id === selectedId ? 'bg-accent/10' : ''
            }`}
          >
            <div className="flex justify-between">
              <span className="text-sm text-white">{f.name} {f.brand && <span className="text-muted">· {f.brand}</span>}</span>
              <span className="font-mono text-xs text-muted">
                {f.kcal}kcal / {f.servingSize}{f.servingUnit}
              </span>
            </div>
            <div className="text-[0.65rem] text-muted mt-0.5">
              P {f.prot}g · CH {f.carb}g · G {f.fat}g
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted w-28">Cantidad ({selected.servingUnit})</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1"
            />
          </div>
          {preview && (
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <Stat label="kcal" value={preview.kcal.toFixed(0)} color="text-accent" />
              <Stat label="P"    value={preview.prot.toFixed(1) + 'g'} color="text-ok" />
              <Stat label="CH"   value={preview.carb.toFixed(1) + 'g'} color="text-cyan-300" />
              <Stat label="G"    value={preview.fat.toFixed(1)  + 'g'} color="text-warn" />
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => { reset(); onClose(); }}
              className="px-4 py-2 text-sm rounded-lg border border-border text-muted hover:text-white"
            >
              Cancelar
            </button>
            <button
              onClick={confirm}
              className="px-4 py-2 text-sm rounded-lg bg-accent text-black font-semibold hover:brightness-110"
            >
              Agregar
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function Stat({ label, value, color }) {
  return (
    <div className="bg-white/5 border border-border rounded-lg py-2">
      <div className={`font-mono text-sm ${color}`}>{value}</div>
      <div className="text-[0.6rem] uppercase text-muted">{label}</div>
    </div>
  );
}
