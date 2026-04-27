import { useState } from 'react';
import Card from '../ui/Card.jsx';
import Pill from '../ui/Pill.jsx';
import ExerciseRow from './ExerciseRow.jsx';
import { TR_DAYS_CONFIG } from '../../lib/constants.js';

export default function WorkoutDayCard({ dayIdx, day, onEditExercise, onOpenLog, onAddExercise }) {
  const [open, setOpen] = useState(true);
  const cfg = TR_DAYS_CONFIG[dayIdx];
  const totalVol = day.exercises.reduce(
    (a, e) => a + (Number(e.reps) || 0) * (Number(e.sets) || 0) * (Number(e.weight) || 0),
    0
  );
  const tone = cfg.color === 'green' ? 'green' : cfg.color === 'yellow' ? 'yellow' : 'cyan';
  return (
    <Card pad={false}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition"
      >
        <div className="flex items-center gap-3">
          <Pill tone={tone}>{cfg.label}</Pill>
          <div className="text-left">
            <div className="font-display text-lg text-white tracking-wide">{cfg.focus}</div>
            <div className="text-xs text-muted">{day.exercises.length} ejercicios</div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-accent">{totalVol.toFixed(0)} kg vol</div>
          <div className="text-[0.65rem] text-muted">{open ? '▾' : '▸'}</div>
        </div>
      </button>
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
              {day.exercises.map((ex, ei) => (
                <ExerciseRow
                  key={ex.id}
                  dayIdx={dayIdx}
                  exIdx={ei}
                  ex={ex}
                  isFirst={ei === 0}
                  isLast={ei === day.exercises.length - 1}
                  onEdit={(e, idx) => onEditExercise?.(dayIdx, idx, e)}
                  onOpenLog={onOpenLog}
                />
              ))}
            </tbody>
          </table>
          <div className="p-3 border-t border-border">
            <button
              onClick={() => onAddExercise?.(dayIdx)}
              className="w-full border border-dashed border-border rounded-lg py-2 text-sm text-muted hover:text-accent hover:border-accent/40 transition"
            >
              ＋ Agregar ejercicio
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}
