import { useState } from 'react';
import Modal from '../ui/Modal.jsx';
import ExerciseChart from './ExerciseChart.jsx';
import { useTrainingStore } from '../../store/useTrainingStore.js';

const METRICS = [
  { id: 'weight', label: 'Peso' },
  { id: 'vol',    label: 'Volumen' },
  { id: 'rxs',    label: 'Reps×Sets' },
];

export default function LogDetailModal({ open, onClose, exercise }) {
  const log = useTrainingStore((s) => (exercise ? s.log[exercise.id] || [] : []));
  const deleteLogEntry = useTrainingStore((s) => s.deleteLogEntry);
  const clearLog = useTrainingStore((s) => s.clearLog);
  const [metric, setMetric] = useState('vol');

  if (!exercise) return null;
  const sorted = [...log].sort((a, b) => a.date.localeCompare(b.date));

  const handleClear = () => {
    if (confirm(`¿Resetear toda la gráfica de "${exercise.name}"?\n\nSe eliminarán todos los ${log.length} registros. Esta acción no se puede deshacer.`))
      clearLog(exercise.id);
  };

  return (
    <Modal open={open} onClose={onClose} title={exercise.name} maxWidth="max-w-2xl">
      <div className="flex items-center gap-1 mb-4">
        {METRICS.map((m) => (
          <button
            key={m.id}
            onClick={() => setMetric(m.id)}
            className={`px-3 py-1.5 text-xs rounded-md border transition ${
              metric === m.id
                ? 'bg-accent/15 border-accent/40 text-accent'
                : 'bg-transparent border-border text-muted hover:text-white'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <ExerciseChart log={sorted} metric={metric} />

      <div className="mt-4 border-t border-border pt-3">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[0.65rem] uppercase tracking-wider text-muted">Historial</div>
          {log.length > 0 && (
            <button
              onClick={handleClear}
              className="text-[0.65rem] text-bad/70 hover:text-bad transition"
              title="Eliminar todos los registros"
            >
              Resetear gráfica
            </button>
          )}
        </div>
        <div className="max-h-48 overflow-auto">
          <table className="w-full text-xs">
            <thead className="text-muted">
              <tr>
                <th className="text-left py-1">Fecha</th>
                <th className="py-1">Reps</th>
                <th className="py-1">Sets</th>
                <th className="py-1">Peso</th>
                <th className="text-right py-1">Vol</th>
                <th className="text-right py-1">Δ</th>
                <th className="py-1 w-6"></th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {sorted.map((e, i) => {
                const prev = sorted[i - 1];
                const d = prev ? e.vol - prev.vol : 0;
                const tone = d > 0 ? 'text-ok' : d < 0 ? 'text-bad' : 'text-muted';
                // find original index in unsorted log for deletion
                const origIdx = log.indexOf(e);
                return (
                  <tr key={i} className="border-t border-border/60 group">
                    <td className="py-1">{e.date}</td>
                    <td className="py-1 text-center">{e.reps}</td>
                    <td className="py-1 text-center">{e.sets}</td>
                    <td className="py-1 text-center">{e.weight}</td>
                    <td className="py-1 text-right text-accent">{e.vol.toFixed(1)}</td>
                    <td className={`py-1 text-right ${tone}`}>
                      {d === 0 ? '—' : (d > 0 ? '+' : '') + d.toFixed(1)}
                    </td>
                    <td className="py-1 text-center">
                      <button
                        onClick={() => deleteLogEntry(exercise.id, origIdx)}
                        className="opacity-0 group-hover:opacity-100 text-bad/60 hover:text-bad transition px-1"
                        title="Eliminar entrada"
                      >✕</button>
                    </td>
                  </tr>
                );
              })}
              {!sorted.length && (
                <tr><td colSpan={7} className="py-3 text-center text-muted">Sin registros</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  );
}
