import { useState } from 'react';
import Card from '../ui/Card.jsx';
import Pill from '../ui/Pill.jsx';
import ExerciseRow from './ExerciseRow.jsx';

export default function WorkoutDayCard({
  weekday, cfg, day, isSnapshot,
  onEditExercise, onOpenLog, onAddExercise,
  onResetDay, onSaveAsTemplate,
  onApplyPreset, onSavePreset,
}) {
  const [open, setOpen] = useState(true);
  const totalVol = (day?.exercises || []).reduce(
    (a, e) => a + (Number(e.reps) || 0) * (Number(e.sets) || 0) * (Number(e.weight) || 0),
    0
  );
  const tone = cfg.color === 'green' ? 'green' : cfg.color === 'yellow' ? 'yellow' : 'cyan';
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
        className="w-full flex items-center justify-between gap-3 px-5 py-4 hover:bg-white/[0.02] transition cursor-pointer outline-none focus:ring-1 focus:ring-accent/40 rounded-card"
      >
        <div className="flex items-center gap-3 min-w-0">
          <Pill tone={tone}>{cfg.label}</Pill>
          <div className="text-left min-w-0">
            <div className="font-display text-lg text-white tracking-wide truncate">{cfg.focus}</div>
            <div className="text-xs text-muted">
              {day?.exercises?.length || 0} ejercicios
              {isSnapshot ? (
                <span className="ml-2 text-accent">· registro</span>
              ) : (
                <span className="ml-2 text-muted/60">· plantilla</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <div className="font-mono text-accent">{totalVol.toFixed(0)} kg vol</div>
            <div className="text-[0.65rem] text-muted">{open ? '▾' : '▸'}</div>
          </div>
          {isSnapshot && (
            <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-1">
              <button
                onClick={onResetDay}
                title="Borrar registro y volver a plantilla"
                className="text-muted hover:text-bad px-2 py-1 text-xs"
              >
                ↺
              </button>
              <button
                onClick={onSaveAsTemplate}
                title="Guardar como nueva plantilla"
                className="text-muted hover:text-accent px-2 py-1 text-xs"
              >
                💾
              </button>
            </div>
          )}
        </div>
      </div>
      {open && (
        <div className="border-t border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[0.65rem] uppercase tracking-wider text-muted">
                <th className="text-left py-2 px-2">Ejercicio</th>
                <th className="text-left py-2 px-1">Músculo</th>
                <th className="py-2 px-1">Reps</th>
                <th className="py-2 px-1">Sets</th>
                <th className="py-2 px-1">Peso</th>
                <th className="text-right py-2 px-2">Vol</th>
                <th className="text-right py-2 px-2">Δ</th>
                <th className="py-2 px-1"></th>
              </tr>
            </thead>
            <tbody>
              {(day?.exercises || []).map((ex, ei) => (
                <ExerciseRow
                  key={ex.id}
                  weekday={weekday}
                  exIdx={ei}
                  ex={ex}
                  isFirst={ei === 0}
                  isLast={ei === day.exercises.length - 1}
                  onEdit={(e, idx) => onEditExercise?.(weekday, idx, e)}
                  onOpenLog={onOpenLog}
                />
              ))}
            </tbody>
          </table>
          <div className="p-3 border-t border-border grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              onClick={() => onAddExercise?.(weekday)}
              className="border border-dashed border-border rounded-lg py-2 text-sm text-muted hover:text-accent hover:border-accent/40 transition"
            >
              ＋ Agregar ejercicio
            </button>
            <button
              onClick={() => onApplyPreset?.(weekday, cfg.label)}
              className="border border-dashed border-border rounded-lg py-2 text-sm text-muted hover:text-accent hover:border-accent/40 transition"
            >
              📋 Aplicar preset
            </button>
            <button
              onClick={() => onSavePreset?.(weekday, cfg.label, day?.exercises || [])}
              disabled={!day?.exercises?.length}
              className="border border-dashed border-border rounded-lg py-2 text-sm text-muted hover:text-accent hover:border-accent/40 transition disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-muted disabled:hover:border-border"
            >
              💾 Guardar preset
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}
