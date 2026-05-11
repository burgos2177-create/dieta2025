import { useState } from 'react';
import Card from '../ui/Card.jsx';
import Pill from '../ui/Pill.jsx';
import ExerciseRow from './ExerciseRow.jsx';

export default function WorkoutDayCard({
  weekday, cfg, day, theoretical, isSnapshot, status, kcalBurned, closedAt,
  onEditExercise, onOpenLog, onAddExercise,
  onResetDay, onResetToPlanned, onSaveAsTemplate,
  onOpenEntry, onCloseEntry, onReopenEntry,
  weekKey,
}) {
  const [open, setOpen] = useState(true);
  const [viewPlanned, setViewPlanned] = useState(false);
  // What we actually render: planned (visual-only toggle) or the day's snapshot/plan.
  const renderedDay = viewPlanned && theoretical ? theoretical : day;
  const totalVol = (renderedDay?.exercises || []).reduce(
    (a, e) => a + (Number(e.reps) || 0) * (Number(e.sets) || 0) * (Number(e.weight) || 0),
    0
  );
  const tone = cfg.color === 'green' ? 'green' : cfg.color === 'yellow' ? 'yellow' : 'cyan';
  const isPlanned = status === 'planned';
  const isOpenStatus = status === 'open';
  const isClosed = status === 'closed';
  const readOnly = isPlanned || isClosed;

  const closedDate = closedAt
    ? new Date(closedAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }) +
      ' ' + new Date(closedAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <Card pad={false}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(!open)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setOpen(!open);
          }
        }}
        className="w-full px-4 sm:px-5 py-3 sm:py-4 hover:bg-white/[0.02] transition cursor-pointer outline-none focus:ring-1 focus:ring-accent/40 rounded-card"
      >
        {/* Row 1: día + título + chevron */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Pill tone={tone}>{cfg.label}</Pill>
          <div className="font-display text-base sm:text-lg text-white tracking-wide truncate flex-1 min-w-0">
            {cfg.focus}
          </div>
          <span className="text-muted text-sm shrink-0">{open ? '▾' : '▸'}</span>
        </div>

        {/* Row 2: badges + meta + volumen + acciones */}
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5">
          {isClosed ? (
            <span
              className="text-[0.6rem] uppercase tracking-wider px-1.5 py-0.5 rounded border border-white/20 bg-white/[0.04] text-muted"
              title={`Cerrado ${closedDate}${kcalBurned > 0 ? ` · ${kcalBurned} kcal` : ''}`}
            >
              🔒 Cerrado
            </span>
          ) : isOpenStatus ? (
            <span className="text-[0.6rem] uppercase tracking-wider px-1.5 py-0.5 rounded border border-accent/40 bg-accent/10 text-accent">
              ● En curso
            </span>
          ) : (
            <span className="text-[0.6rem] uppercase tracking-wider px-1.5 py-0.5 rounded border border-border text-muted">
              Plan teórico
            </span>
          )}
          {viewPlanned && !isPlanned && (
            <span className="text-[0.6rem] uppercase tracking-wider px-1.5 py-0.5 rounded border border-warn/40 bg-warn/10 text-warn">
              👁 Vista plan
            </span>
          )}
          <span className="text-xs text-muted">
            {renderedDay?.exercises?.length || 0} ej.
            {isClosed && kcalBurned > 0 && (
              <span className="ml-1 text-accent">· {kcalBurned} kcal</span>
            )}
            {isClosed && kcalBurned === 0 && (
              <span className="ml-1 text-muted/70">· kcal n/d</span>
            )}
          </span>

          {/* Bloque derecho: volumen + acciones */}
          <div className="ml-auto flex items-center gap-1">
            <span className="font-mono text-accent text-xs sm:text-sm whitespace-nowrap">
              {totalVol.toFixed(0)} kg
            </span>
            {!isPlanned && theoretical && (
              <button
                onClick={(e) => { e.stopPropagation(); setViewPlanned((v) => !v); }}
                title={viewPlanned ? 'Volver a la vista normal' : 'Ver el plan teórico (visual, no toca tu registro)'}
                className={`px-1.5 py-1 text-sm transition ${viewPlanned ? 'text-warn' : 'text-muted hover:text-warn'}`}
              >
                👁
              </button>
            )}
            {isOpenStatus && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); onResetToPlanned?.(); }}
                  title="Resetear los valores del entrenamiento al plan teórico (mantiene la entrada abierta)"
                  className="text-muted hover:text-warn px-1.5 py-1 text-sm"
                >
                  🔄
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onResetDay?.(); }}
                  title="Descartar la entrada y volver al plan teórico (borra el registro de este día)"
                  className="text-muted hover:text-bad px-1.5 py-1 text-sm"
                >
                  ↺
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onSaveAsTemplate?.(); }}
                  title="Guardar como plantilla"
                  className="text-muted hover:text-accent px-1.5 py-1 text-sm"
                >
                  💾
                </button>
              </>
            )}
            {isClosed && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); onResetToPlanned?.(); }}
                  title="Resetear los valores al plan teórico (también borra esta entrada de la bitácora)"
                  className="text-muted hover:text-warn px-1.5 py-1 text-sm"
                >
                  🔄
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onReopenEntry?.(); }}
                  title="Reabrir el entrenamiento (también borra esta entrada de la bitácora)"
                  className="text-muted hover:text-accent px-1.5 py-1 text-sm"
                >
                  🔓
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {open && (
        <div className="border-t border-border overflow-x-auto">
          {/* Status banner / call-to-action */}
          {isPlanned && (
            <div className="px-4 py-2 bg-white/[0.02] border-b border-border flex items-center justify-between">
              <div className="text-xs text-muted">
                Esta sesión aún no se ha registrado. Mientras tanto verás el plan teórico (solo lectura).
              </div>
              <button
                onClick={onOpenEntry}
                className="px-3 py-1.5 text-xs rounded-md bg-accent text-black font-semibold hover:brightness-110 whitespace-nowrap"
              >
                ▶ Hacer entrada
              </button>
            </div>
          )}
          {isClosed && (
            <div className="px-4 py-2 bg-white/[0.02] border-b border-border flex items-center justify-between">
              <div className="text-xs text-muted">
                Entrenamiento cerrado{closedDate ? ` el ${closedDate}` : ''}
                {kcalBurned > 0 ? ` · ${kcalBurned} kcal` : ' · kcal no medido'}.
                Reábrelo si necesitas modificar algo.
              </div>
            </div>
          )}

          {viewPlanned && !isPlanned && (
            <div className="px-4 py-2 bg-warn/5 border-b border-warn/30 text-xs text-warn">
              👁 Mostrando el plan teórico (solo visual). Tus valores reales del entrenamiento se conservan en el fondo.
            </div>
          )}
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[0.65rem] uppercase tracking-wider text-muted">
                <th className="text-left py-2 px-2">Ejercicio</th>
                <th className="text-left py-2 px-1">Músculo</th>
                <th className="py-2 px-1">Reps</th>
                <th className="py-2 px-1">Sets</th>
                <th className="py-2 px-1">Equipo · Peso</th>
                <th className="text-right py-2 px-2">Vol</th>
                <th className="text-right py-2 px-2">Δ teó.</th>
                <th className="text-right py-2 px-2">Δ ant.</th>
                <th className="py-2 px-1"></th>
              </tr>
            </thead>
            <tbody>
              {(renderedDay?.exercises || []).map((ex, ei) => (
                <ExerciseRow
                  key={`${ex.id}_${viewPlanned ? 'plan' : 'real'}`}
                  weekday={weekday}
                  exIdx={ei}
                  ex={ex}
                  isFirst={ei === 0}
                  isLast={ei === renderedDay.exercises.length - 1}
                  readOnly={readOnly || viewPlanned}
                  weekKey={weekKey}
                  onEdit={(e, idx) => onEditExercise?.(weekday, idx, e)}
                  onOpenLog={onOpenLog}
                />
              ))}
            </tbody>
          </table>

          {/* Footer actions — only when entry is open */}
          {isOpenStatus && (
            <div className="p-3 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={() => onAddExercise?.(weekday)}
                className="border border-dashed border-border rounded-lg py-2 text-sm text-muted hover:text-accent hover:border-accent/40 transition"
              >
                ＋ Agregar ejercicio
              </button>
              <button
                onClick={onCloseEntry}
                className="border border-accent/40 bg-accent/5 rounded-lg py-2 text-sm text-accent hover:bg-accent/10 font-semibold transition"
              >
                🔒 Cerrar entrenamiento
              </button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
