import { useState } from 'react';
import Modal from '../ui/Modal.jsx';
import { mesoEndWeek, mesoPhaseLabel, newMesocycle } from '../../lib/mesocycle.js';
import { formatWeekRange } from '../../lib/dates.js';

export default function TrainingMesocycleModal({
  open, onClose,
  mesocycles, activeId, currentWeek,
  onCreate, onUpdate, onRemove, onSetActive, onResetStart,
  onEditRoutines,
}) {
  const [editingId, setEditingId] = useState(activeId || null);

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
    <Modal open={open} onClose={onClose} title="Mesociclos de entreno" maxWidth="max-w-2xl">
      <div className="space-y-4">
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
          <Editor
            meso={editing}
            isActive={editing.id === activeId}
            currentWeek={currentWeek}
            onUpdate={(patch) => onUpdate(editing.id, patch)}
            onRemove={() => {
              if (confirm(`¿Eliminar el mesociclo "${editing.name}"? Los snapshots semanales se conservan.`)) {
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
            onEditRoutines={() => onEditRoutines?.(editing.id)}
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

function Editor({ meso, isActive, currentWeek, onUpdate, onRemove, onSetActive, onClearActive, onResetStart, onEditRoutines }) {
  const endWeek = mesoEndWeek(meso);
  return (
    <div className="space-y-4 border border-border rounded-lg p-4 bg-white/[0.02]">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Field label="Nombre">
          <input type="text" value={meso.name} onChange={(e) => onUpdate({ name: e.target.value })} />
        </Field>
        <Field label="Duración (semanas)">
          <input
            type="number" min={1} max={20}
            value={meso.weeks}
            onChange={(e) => onUpdate({ weeks: Math.max(1, Math.min(20, Number(e.target.value) || 1)) })}
          />
        </Field>
        <Field label="Peso de inicio (kg)">
          <input
            type="number" step="0.1"
            value={meso.startWeight ?? 0}
            onChange={(e) => onUpdate({ startWeight: Number(e.target.value) || 0 })}
          />
        </Field>
      </div>

      <div className="text-xs text-muted">
        Inicio: <span className="font-mono text-white">{formatWeekRange(meso.startWeek)}</span>
        {' '} → Fin: <span className="font-mono text-white">{formatWeekRange(endWeek)}</span>
      </div>

      {/* Phase preview */}
      <div className="flex flex-wrap gap-1">
        {Array.from({ length: meso.weeks }, (_, i) => {
          const wn = i + 1;
          return (
            <div
              key={wn}
              className="px-2 py-1 text-[0.65rem] rounded border border-border bg-white/[0.02]"
              title={mesoPhaseLabel(wn, meso.weeks)}
            >
              <span className="text-muted">S{wn}</span>{' '}
              <span className="text-white">{mesoPhaseLabel(wn, meso.weeks)}</span>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        {!isActive ? (
          <button
            onClick={onSetActive}
            className="px-3 py-1.5 text-xs rounded-md bg-accent text-black font-semibold hover:brightness-110"
          >
            ● Activar
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
          onClick={onEditRoutines}
          className="px-3 py-1.5 text-xs rounded-md border border-accent/40 text-accent hover:bg-accent/10 font-semibold"
          title="Editar la matriz de ejercicios × semanas"
        >
          ✏️ Editar rutinas
        </button>
        <button
          onClick={onResetStart}
          className="px-3 py-1.5 text-xs rounded-md border border-border text-muted hover:text-white"
          title="Marcar la semana actual como semana 1"
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
