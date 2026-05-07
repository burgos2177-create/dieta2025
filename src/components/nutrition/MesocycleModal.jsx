import { useState } from 'react';
import Modal from '../ui/Modal.jsx';
import { DAY_TYPES, DAY_TYPE_LABEL, mesoEndWeek, newMesocycle } from '../../lib/mesocycle.js';
import { formatWeekRange } from '../../lib/dates.js';

export default function MesocycleModal({
  open, onClose,
  mesocycles, activeId, presets, meals, currentWeek,
  onCreate, onUpdate, onRemove, onSetActive, onResetStart, onSetPlan,
}) {
  const [editingId, setEditingId] = useState(activeId || null);

  // Sync editingId with active when modal opens
  if (open && editingId !== activeId && !mesocycles.find((m) => m.id === editingId)) {
    setEditingId(activeId || mesocycles[0]?.id || null);
  }

  const editing = mesocycles.find((m) => m.id === editingId);

  const startNew = () => {
    const meso = newMesocycle({
      name: `Mesociclo ${mesocycles.length + 1}`,
      startWeek: currentWeek,
      weeks: 5,
      startWeight: 0,
    });
    onCreate(meso);
    setEditingId(meso.id);
  };

  return (
    <Modal open={open} onClose={onClose} title="Mesociclos" maxWidth="max-w-3xl">
      <div className="space-y-4">
        {/* Mesocycle picker */}
        <div className="flex flex-wrap items-center gap-2">
          {mesocycles.length === 0 && (
            <span className="text-sm text-muted">Aún no tienes mesociclos.</span>
          )}
          {mesocycles.map((m) => (
            <button
              key={m.id}
              onClick={() => setEditingId(m.id)}
              className={`px-3 py-1.5 text-xs rounded-md border transition ${
                m.id === editingId
                  ? 'border-accent bg-accent/10 text-white'
                  : 'border-border text-muted hover:text-white hover:border-white/20'
              }`}
            >
              {m.name}
              {m.id === activeId && <span className="ml-1 text-accent">●</span>}
            </button>
          ))}
          <button
            onClick={startNew}
            className="px-3 py-1.5 text-xs rounded-md bg-accent text-black font-semibold hover:brightness-110"
          >
            ＋ Nuevo
          </button>
        </div>

        {editing && (
          <MesoEditor
            meso={editing}
            isActive={editing.id === activeId}
            currentWeek={currentWeek}
            presets={presets}
            meals={meals}
            onUpdate={(patch) => onUpdate(editing.id, patch)}
            onRemove={() => {
              if (confirm(`¿Eliminar el mesociclo "${editing.name}"? Los snapshots manuales se conservan.`)) {
                onRemove(editing.id);
                setEditingId(null);
              }
            }}
            onSetActive={() => onSetActive(editing.id)}
            onClearActive={() => onSetActive(null)}
            onResetStart={() => {
              if (confirm(`¿Resetear el inicio de "${editing.name}" a la semana actual (${formatWeekRange(currentWeek)})?`)) {
                onResetStart(editing.id, currentWeek);
              }
            }}
            onSetPlan={(dayType, mealId, presetId) => onSetPlan(editing.id, dayType, mealId, presetId)}
          />
        )}

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-border text-muted hover:text-white"
          >
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
}

function MesoEditor({
  meso, isActive, currentWeek, presets, meals,
  onUpdate, onRemove, onSetActive, onClearActive, onResetStart, onSetPlan,
}) {
  const endWeek = mesoEndWeek(meso);
  return (
    <div className="space-y-4 border border-border rounded-lg p-4 bg-white/[0.02]">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Field label="Nombre">
          <input
            type="text"
            value={meso.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
          />
        </Field>
        <Field label="Duración (semanas)">
          <input
            type="number"
            min={1} max={20}
            value={meso.weeks}
            onChange={(e) => onUpdate({ weeks: Math.max(1, Math.min(20, Number(e.target.value) || 1)) })}
          />
        </Field>
        <Field label="Peso de inicio (kg)">
          <input
            type="number"
            step="0.1"
            value={meso.startWeight ?? 0}
            onChange={(e) => onUpdate({ startWeight: Number(e.target.value) || 0 })}
          />
        </Field>
      </div>

      <div className="text-xs text-muted">
        Inicio: <span className="font-mono text-white">{formatWeekRange(meso.startWeek)}</span>
        {' '} → Fin: <span className="font-mono text-white">{formatWeekRange(endWeek)}</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {!isActive ? (
          <button
            onClick={onSetActive}
            className="px-3 py-1.5 text-xs rounded-md bg-accent text-black font-semibold hover:brightness-110"
          >
            ● Activar este mesociclo
          </button>
        ) : (
          <button
            onClick={onClearActive}
            className="px-3 py-1.5 text-xs rounded-md border border-border text-muted hover:text-white"
          >
            Desactivar
          </button>
        )}
        <button
          onClick={onResetStart}
          className="px-3 py-1.5 text-xs rounded-md border border-border text-muted hover:text-white"
          title="Marcar la semana actual como semana 1 del mesociclo"
        >
          ↺ Resetear inicio a semana actual
        </button>
        <button
          onClick={onRemove}
          className="px-3 py-1.5 text-xs rounded-md border border-bad/40 text-bad hover:bg-bad/10"
        >
          🗑 Eliminar
        </button>
      </div>

      {/* Plan matrix: each day type × each meal slot → preset selector */}
      <div className="space-y-3 pt-2 border-t border-border">
        <div className="text-xs uppercase tracking-wider text-muted font-display">
          Plan por tipo de día
        </div>
        {presets.length === 0 && (
          <div className="text-xs text-muted bg-warn/10 border border-warn/30 rounded p-2">
            Aún no tienes presets. Guarda algunas comidas como preset desde la página de Nutrición primero.
          </div>
        )}
        {DAY_TYPES.map((dt) => (
          <div key={dt} className="bg-white/[0.02] border border-border rounded p-3">
            <div className="text-sm font-semibold text-white mb-2">
              Día {DAY_TYPE_LABEL[dt]}
              <span className="ml-2 text-[0.65rem] text-muted">
                {dt === 'high' ? '(L, Mi, V)' : dt === 'low' ? '(M, J, S)' : '(D)'}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {meals.map((m) => {
                const cur = meso.plans?.[dt]?.[m.id] || '';
                return (
                  <div key={m.id} className="flex items-center gap-2 text-xs">
                    <span className="text-muted w-24 truncate">{m.icon} {m.label}</span>
                    <select
                      value={cur}
                      onChange={(e) => onSetPlan(dt, m.id, e.target.value || null)}
                      className="!py-1 !px-2 text-xs flex-1"
                    >
                      <option value="">— vacío —</option>
                      {presets.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <div className="text-[0.65rem] uppercase tracking-wider text-muted mb-1 font-display">{label}</div>
      {children}
    </label>
  );
}
