import { useMemo, useState } from 'react';
import Modal from '../ui/Modal.jsx';
import { DAYS } from '../../lib/constants.js';
import { dayPlanSignature, dayPlanHasEntries } from '../../lib/printNutrition.js';

/**
 * Modal con opciones de impresión:
 * - Solo el día activo
 * - Toda la semana, agrupada (junta días con el mismo plan)
 * - Toda la semana, día por día
 */
export default function PrintNutritionModal({
  open, onClose, onPrint,
  activeDay, weekKey, meals, getDayPlanFor, getTargetsFor,
}) {
  const [mode, setMode] = useState('day');

  // Compute groups when "agrupada" is selected to show preview
  const groups = useMemo(() => {
    if (!open) return [];
    const sigToDays = new Map();
    for (let d = 0; d < 7; d++) {
      const plan = getDayPlanFor(d);
      if (!dayPlanHasEntries(meals, plan)) continue;
      const sig = dayPlanSignature(meals, plan);
      if (!sigToDays.has(sig)) sigToDays.set(sig, []);
      sigToDays.get(sig).push(d);
    }
    return [...sigToDays.values()].map((days) => ({
      days,
      labels: days.map((d) => DAYS[d].name),
    }));
  }, [open, meals, getDayPlanFor]);

  const submit = () => {
    onPrint(mode);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Imprimir / Guardar PDF" maxWidth="max-w-lg">
      <div className="space-y-4">
        <div className="space-y-2">
          <ModeOption
            id="day"
            currentMode={mode}
            onPick={setMode}
            label="Solo el día actual"
            sub={DAYS[activeDay].name}
            icon="📄"
          />
          <ModeOption
            id="week-grouped"
            currentMode={mode}
            onPick={setMode}
            label="Toda la semana, agrupada"
            sub={
              groups.length > 0
                ? `${groups.length} grupo${groups.length !== 1 ? 's' : ''}: ${groups
                    .map((g) => g.labels.map((l) => l.slice(0, 3)).join('+'))
                    .join(' · ')}`
                : 'sin días con plan'
            }
            icon="📅"
            disabled={groups.length === 0}
          />
          <ModeOption
            id="week-separate"
            currentMode={mode}
            onPick={setMode}
            label="Toda la semana, día por día"
            sub="7 secciones, una por día (puede ocupar varias hojas)"
            icon="📆"
          />
        </div>

        {mode === 'week-grouped' && groups.length > 0 && (
          <div className="bg-white/[0.03] border border-border rounded-lg p-3 text-xs text-muted">
            <div className="text-[0.65rem] uppercase tracking-wider font-display mb-2">Vista previa de grupos</div>
            <div className="space-y-1">
              {groups.map((g, i) => (
                <div key={i} className="flex items-baseline gap-2">
                  <span className="font-mono text-accent w-6 shrink-0">{i + 1}</span>
                  <span className="text-white">{g.labels.join(' · ')}</span>
                  <span className="text-muted/70">({g.days.length} día{g.days.length !== 1 ? 's' : ''} con el mismo plan)</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-border text-muted hover:text-white">
            Cancelar
          </button>
          <button
            onClick={submit}
            className="px-5 py-2 text-sm rounded-lg bg-accent text-black font-semibold hover:brightness-110"
          >
            🖨 Generar PDF
          </button>
        </div>
      </div>
    </Modal>
  );
}

function ModeOption({ id, currentMode, onPick, label, sub, icon, disabled }) {
  const active = currentMode === id;
  return (
    <button
      onClick={() => !disabled && onPick(id)}
      disabled={disabled}
      className={`w-full text-left px-4 py-3 rounded-lg border transition flex items-start gap-3 ${
        active
          ? 'border-accent bg-accent/10 text-white'
          : 'border-border text-muted hover:text-white hover:border-white/20'
      } disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      <div className="text-2xl shrink-0">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold">{label}</div>
        <div className="text-[0.7rem] text-muted/80 mt-0.5">{sub}</div>
      </div>
      <div className={`w-4 h-4 rounded-full border-2 shrink-0 ${active ? 'border-accent bg-accent' : 'border-border'}`} />
    </button>
  );
}
