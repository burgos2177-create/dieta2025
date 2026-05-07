import { useMemo, useState } from 'react';
import Card from '../ui/Card.jsx';
import SupplementFormModal from './SupplementFormModal.jsx';
import { useSupplementStore } from '../../store/useSupplementStore.js';
import { timingMeta } from '../../lib/supplementsSeed.js';
import { DAYS } from '../../lib/constants.js';
import { showToast } from '../ui/Toast.jsx';

export default function SupplementLibrary() {
  const library = useSupplementStore((s) => s.library);
  const addSupplement = useSupplementStore((s) => s.addSupplement);
  const updateSupplement = useSupplementStore((s) => s.updateSupplement);
  const removeSupplement = useSupplementStore((s) => s.removeSupplement);

  const [q, setQ] = useState('');
  const [editing, setEditing] = useState(null); // null | { mode, sup? }

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return library;
    return library.filter((s) => s.name.toLowerCase().includes(qq) || (s.brand || '').toLowerCase().includes(qq));
  }, [library, q]);

  const sorted = useMemo(
    () => [...filtered].sort((a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name, 'es')),
    [filtered]
  );

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar suplemento…"
            className="flex-1"
          />
          <button
            onClick={() => setEditing({ mode: 'add' })}
            className="px-4 py-2 text-sm rounded-lg bg-accent text-black font-semibold hover:brightness-110"
          >
            ＋ Nuevo suplemento
          </button>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {sorted.map((sup) => {
          const meta = timingMeta(sup.timing);
          const days = (sup.daysOfWeek || []).map((d) => DAYS[d]?.label).join(' ');
          return (
            <Card key={sup.id} pad={false} className={`flex flex-col ${!sup.active ? 'opacity-60' : ''}`}>
              <div className="p-4 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-display text-base text-white truncate">{sup.name}</div>
                    <div className="text-xs text-muted">{sup.brand || '—'}</div>
                  </div>
                  <span className="font-mono text-sm text-accent shrink-0">
                    {sup.doseAmount} {sup.doseUnit}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5 text-[0.65rem]">
                  <span className="bg-white/[0.03] border border-border rounded px-1.5 py-0.5 text-muted">
                    {meta.icon} {meta.label}
                  </span>
                  <span className="bg-white/[0.03] border border-border rounded px-1.5 py-0.5 text-muted">
                    {days || '—'}
                  </span>
                  {sup.kcalPerDose > 0 && (
                    <span className="bg-white/[0.03] border border-border rounded px-1.5 py-0.5 text-muted">
                      {sup.kcalPerDose} kcal
                    </span>
                  )}
                  {!sup.active && (
                    <span className="bg-white/[0.03] border border-warn/40 rounded px-1.5 py-0.5 text-warn">
                      inactivo
                    </span>
                  )}
                </div>
                {sup.notes && <div className="text-[0.7rem] text-muted mt-2 italic">{sup.notes}</div>}
              </div>
              <div className="border-t border-border px-4 py-2 flex justify-end gap-3 text-xs">
                <button
                  onClick={() => updateSupplement(sup.id, { active: !sup.active })}
                  className="text-muted hover:text-accent"
                  title="Alternar activo"
                >
                  {sup.active ? '⏸ Pausar' : '▶ Activar'}
                </button>
                <button
                  onClick={() => setEditing({ mode: 'edit', sup })}
                  className="text-muted hover:text-accent"
                >
                  ✏️ Editar
                </button>
                <button
                  onClick={() => {
                    if (confirm(`¿Eliminar "${sup.name}"?`)) {
                      removeSupplement(sup.id);
                      showToast('Suplemento eliminado');
                    }
                  }}
                  className="text-muted hover:text-bad"
                >
                  🗑 Eliminar
                </button>
              </div>
            </Card>
          );
        })}
        {sorted.length === 0 && (
          <Card className="sm:col-span-2 lg:col-span-3">
            <div className="text-sm text-muted text-center py-4">No hay suplementos.</div>
          </Card>
        )}
      </div>

      <SupplementFormModal
        open={!!editing}
        mode={editing?.mode}
        initial={editing?.sup}
        onClose={() => setEditing(null)}
        onSubmit={(data) => {
          if (editing?.mode === 'edit') {
            updateSupplement(editing.sup.id, data);
            showToast('Suplemento actualizado', 'ok');
          } else {
            addSupplement(data);
            showToast('Suplemento creado', 'ok');
          }
        }}
      />
    </div>
  );
}
