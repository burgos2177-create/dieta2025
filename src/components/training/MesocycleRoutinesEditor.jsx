import { useState } from 'react';
import Modal from '../ui/Modal.jsx';
import { TR_DAYS_CONFIG, MUSCLE_LABELS, MUSCLE_COLORS } from '../../lib/constants.js';
import { EQUIPMENT_TYPES, getEquipment, computeWeightKg } from '../../lib/equipment.js';
import { mesoPhaseLabel } from '../../lib/mesocycle.js';
import { useProfileStore } from '../../store/useProfileStore.js';

/** Editor de la rutina del mesociclo: matriz ejercicio × semana. */
export default function MesocycleRoutinesEditor({
  open, onClose, meso, hasTemplateForWeekday,
  onAddExercise, onRemoveExercise, onUpdateExercise, onUpdateWeek,
  onMoveExercise, onImportFromTemplate, onFillFromWeek,
}) {
  const [weekday, setWeekday] = useState(0);

  if (!meso) return null;
  const N = meso.weeks || 5;
  const dayRoutine = meso.routines?.[weekday];
  const exercises = dayRoutine?.exercises || [];

  const newExercise = () => ({
    id: `ex_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    name: 'Ejercicio',
    tech: '',
    muscle: 'CUAD',
    equipment: 'manual',
    weeks: Array.from({ length: N }, () => ({ reps: 0, sets: 0, weight: 0, equipmentData: { kg: 0 } })),
  });

  return (
    <Modal open={open} onClose={onClose} title={`Rutina del mesociclo · ${meso.name}`} maxWidth="max-w-6xl">
      <div className="space-y-4">
        {/* Tabs por día de entreno */}
        <div className="flex gap-1 border-b border-border">
          {TR_DAYS_CONFIG.map((cfg) => {
            const has = (meso.routines?.[cfg.weekday]?.exercises?.length || 0) > 0;
            return (
              <button
                key={cfg.weekday}
                onClick={() => setWeekday(cfg.weekday)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                  weekday === cfg.weekday
                    ? 'border-accent text-accent'
                    : 'border-transparent text-muted hover:text-white'
                }`}
              >
                {cfg.label}
                {has && <span className="ml-1.5 text-[0.55rem] opacity-70">●</span>}
              </button>
            );
          })}
        </div>

        <div className="text-xs text-muted">
          Define reps, sets y peso por semana. La sobrecarga se aplica automáticamente al navegar a la semana correspondiente del mesociclo. Si editas algo durante la sesión, se crea un snapshot solo para ese día — la rutina queda intacta.
        </div>

        {/* Empty state — opciones para inicializar */}
        {exercises.length === 0 ? (
          <div className="bg-white/[0.02] border border-border rounded-lg p-6 text-center space-y-3">
            <div className="text-sm text-muted">
              No hay ejercicios definidos para {TR_DAYS_CONFIG.find((c) => c.weekday === weekday)?.label}.
            </div>
            <div className="flex gap-2 justify-center flex-wrap">
              {hasTemplateForWeekday(weekday) && (
                <button
                  onClick={() => onImportFromTemplate(weekday)}
                  className="px-4 py-2 text-sm rounded-lg bg-accent text-black font-semibold"
                >
                  ⬇ Importar de plantilla
                </button>
              )}
              <button
                onClick={() => onAddExercise(weekday, newExercise())}
                className="px-4 py-2 text-sm rounded-lg border border-border text-muted hover:text-white hover:border-white/20"
              >
                ＋ Añadir ejercicio
              </button>
            </div>
          </div>
        ) : (
          <>
            {exercises.map((ex, exIdx) => (
              <ExerciseRoutineRow
                key={ex.id}
                ex={ex}
                exIdx={exIdx}
                weeks={N}
                isFirst={exIdx === 0}
                isLast={exIdx === exercises.length - 1}
                onRemove={() => onRemoveExercise(weekday, exIdx)}
                onUpdate={(patch) => onUpdateExercise(weekday, exIdx, patch)}
                onUpdateWeek={(weekIdx, patch) => onUpdateWeek(weekday, exIdx, weekIdx, patch)}
                onMove={(dir) => onMoveExercise(weekday, exIdx, exIdx + dir)}
                onFillFrom={(fromWeekIdx) => onFillFromWeek(weekday, exIdx, fromWeekIdx)}
              />
            ))}
            <div className="flex justify-center">
              <button
                onClick={() => onAddExercise(weekday, newExercise())}
                className="px-4 py-2 text-sm rounded-lg border border-dashed border-border text-muted hover:text-accent hover:border-accent/40"
              >
                ＋ Añadir ejercicio
              </button>
            </div>
          </>
        )}

        <div className="flex justify-end pt-2 sticky bottom-0 bg-card pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-border text-muted hover:text-white">
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
}

function ExerciseRoutineRow({
  ex, exIdx, weeks, isFirst, isLast,
  onRemove, onUpdate, onUpdateWeek, onMove, onFillFrom,
}) {
  const eq = getEquipment(ex.equipment || 'manual');
  const profileWeight = useProfileStore((s) => Number(s.peso) || 0);
  const ctx = { bodyweight: profileWeight };
  const color = MUSCLE_COLORS[ex.muscle] || '#94a3b8';

  return (
    <div className="border border-border rounded-lg p-3 bg-white/[0.02]">
      {/* Header: name, muscle, tech, equipment */}
      <div className="grid grid-cols-12 gap-2 items-center mb-2">
        <input
          type="text"
          value={ex.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          placeholder="Nombre"
          className="col-span-12 sm:col-span-4 !py-1 !px-2 text-sm font-medium"
        />
        <select
          value={ex.muscle}
          onChange={(e) => onUpdate({ muscle: e.target.value })}
          className="col-span-6 sm:col-span-2 !py-1 !px-2 text-xs"
          style={{ borderColor: color + '66', color }}
        >
          {Object.keys(MUSCLE_LABELS).map((k) => (
            <option key={k} value={k}>{MUSCLE_LABELS[k]}</option>
          ))}
        </select>
        <input
          type="text"
          value={ex.tech || ''}
          onChange={(e) => onUpdate({ tech: e.target.value })}
          placeholder="Técnica"
          className="col-span-6 sm:col-span-3 !py-1 !px-2 text-xs"
        />
        <select
          value={ex.equipment || 'manual'}
          onChange={(e) => onUpdate({ equipment: e.target.value })}
          className="col-span-9 sm:col-span-2 !py-1 !px-2 text-xs"
        >
          {EQUIPMENT_TYPES.map((e) => (
            <option key={e.id} value={e.id}>{e.short}</option>
          ))}
        </select>
        <div className="col-span-3 sm:col-span-1 flex justify-end gap-0.5">
          <button onClick={() => onMove(-1)} disabled={isFirst} className="text-muted hover:text-accent px-1 disabled:opacity-20" title="Subir">↑</button>
          <button onClick={() => onMove(1)} disabled={isLast} className="text-muted hover:text-accent px-1 disabled:opacity-20" title="Bajar">↓</button>
          <button onClick={onRemove} className="text-muted hover:text-bad px-1" title="Eliminar">×</button>
        </div>
      </div>

      {/* Per-week values */}
      <div className="space-y-1">
        {(() => {
          // Pre-compute weekly volumes so we can render the delta column.
          const vols = Array.from({ length: weeks }, (_, i) => {
            const w = ex.weeks?.[i] || {};
            const kg = computeWeightKg(ex.equipment || 'manual', w.equipmentData || {}, ctx);
            return (Number(w.reps) || 0) * (Number(w.sets) || 0) * kg;
          });
          return Array.from({ length: weeks }, (_, weekIdx) => {
          const wk = ex.weeks?.[weekIdx] || {};
          const data = wk.equipmentData || {};
          const computed = computeWeightKg(ex.equipment || 'manual', data, ctx);
          const vol = vols[weekIdx];
          const delta = weekIdx === 0 ? null : vol - vols[weekIdx - 1];
          const deltaPct = weekIdx === 0
            ? null
            : (vols[weekIdx - 1] > 0 ? (delta / vols[weekIdx - 1]) * 100 : null);
          const phase = mesoPhaseLabel(weekIdx + 1, weeks);
          const updateInput = (key, raw) => {
            const num = raw === '' ? 0 : Number(raw);
            const newData = { ...data, [key]: isFinite(num) ? num : 0 };
            const newKg = computeWeightKg(ex.equipment || 'manual', newData, ctx);
            onUpdateWeek(weekIdx, { equipmentData: newData, weight: newKg });
          };
          return (
            <div key={weekIdx} className="flex items-center gap-2 text-xs">
              <span className="w-8 text-muted">S{weekIdx + 1}</span>
              <span className="w-20 text-muted/70 text-[0.6rem] truncate" title={phase}>{phase}</span>
              <input
                type="number"
                value={wk.reps || ''}
                onChange={(e) => onUpdateWeek(weekIdx, { reps: Number(e.target.value) || 0 })}
                placeholder="reps"
                className="!w-14 !py-1 !px-1 text-center"
                title="Reps"
              />
              <span className="text-muted">×</span>
              <input
                type="number"
                value={wk.sets || ''}
                onChange={(e) => onUpdateWeek(weekIdx, { sets: Number(e.target.value) || 0 })}
                placeholder="sets"
                className="!w-14 !py-1 !px-1 text-center"
                title="Sets"
              />
              <span className="text-muted">·</span>
              {eq.inputs.map((input) => {
                if (input.type === 'multiplier') {
                  return (
                    <select
                      key={input.key}
                      value={data[input.key] ?? 1}
                      onChange={(e) => updateInput(input.key, e.target.value)}
                      className="!w-14 !py-1 !px-1 text-xs"
                      title={input.label}
                    >
                      {input.options.map((o) => <option key={o} value={o}>×{o}</option>)}
                    </select>
                  );
                }
                return (
                  <div key={input.key} className="flex items-center gap-1">
                    <input
                      type="number"
                      step={input.step ?? 0.1}
                      value={data[input.key] ?? ''}
                      onChange={(e) => updateInput(input.key, e.target.value)}
                      placeholder={input.unit}
                      className="!w-16 !py-1 !px-1 text-center"
                      title={input.label}
                    />
                    <span className="text-[0.6rem] text-muted/80">{input.unit}</span>
                  </div>
                );
              })}
              <span className="font-mono text-accent/80 ml-auto whitespace-nowrap">= {computed.toFixed(2)} kg</span>
              <span
                className="font-mono text-cyan-300/80 whitespace-nowrap w-20 text-right"
                title="Volumen = reps × sets × kg"
              >
                {vol.toFixed(0)} vol
              </span>
              <span
                className={`font-mono whitespace-nowrap w-16 text-right ${
                  delta == null ? 'text-muted/40' : delta > 0 ? 'text-ok' : delta < 0 ? 'text-bad' : 'text-muted'
                }`}
                title="Diferencial vs semana anterior (volumen absoluto)"
              >
                {delta == null ? '—' : `${delta >= 0 ? '+' : ''}${delta.toFixed(0)}`}
              </span>
              <span
                className={`font-mono whitespace-nowrap w-16 text-right ${
                  deltaPct == null ? 'text-muted/40' : deltaPct > 0 ? 'text-ok' : deltaPct < 0 ? 'text-bad' : 'text-muted'
                }`}
                title="Diferencial vs semana anterior (%)"
              >
                {deltaPct == null ? '—' : `${deltaPct >= 0 ? '+' : ''}${deltaPct.toFixed(1)}%`}
              </span>
              <button
                onClick={() => onFillFrom(weekIdx)}
                title={`Copiar valores de S${weekIdx + 1} a las semanas siguientes`}
                className="text-muted hover:text-accent px-1 text-[0.6rem]"
              >
                ⤓
              </button>
            </div>
          );
        });
        })()}
      </div>
    </div>
  );
}
