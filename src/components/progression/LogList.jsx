import { useMemo, useState } from 'react';
import Card from '../ui/Card.jsx';
import DevBadge from '../ui/DevBadge.jsx';
import LogDetailModal from './LogDetailModal.jsx';
import { useTrainingStore } from '../../store/useTrainingStore.js';
import { MUSCLE_LABELS, MUSCLE_COLORS } from '../../lib/constants.js';
import { getVolumeZone, getWeeklySetsByMuscle } from '../../lib/volumeZones.js';

export default function LogList() {
  const days = useTrainingStore((s) => s.days);
  const library = useTrainingStore((s) => s.library);
  const log = useTrainingStore((s) => s.log);
  const [q, setQ] = useState('');
  const [muscleFilter, setMuscleFilter] = useState('all');
  const [selected, setSelected] = useState(null);

  const weeklySets = useMemo(() => getWeeklySetsByMuscle(days), [days]);

  // Muestra todos los ejercicios de la biblioteca — incluso los rotados fuera de un día
  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return library
      .filter((ex) => {
        const matchQ = !qq || ex.name.toLowerCase().includes(qq);
        const matchM = muscleFilter === 'all' || ex.muscle === muscleFilter;
        return matchQ && matchM;
      })
      .sort((a, b) => {
        // Primero los que tienen entradas, ordenados por última fecha
        const aLast = (log[a.id] || []).at(-1)?.date ?? '';
        const bLast = (log[b.id] || []).at(-1)?.date ?? '';
        if (bLast !== aLast) return bLast.localeCompare(aLast);
        return a.name.localeCompare(b.name, 'es');
      });
  }, [library, log, q, muscleFilter]);

  return (
    <>
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar ejercicio…"
            className="md:col-span-8"
          />
          <select value={muscleFilter} onChange={(e) => setMuscleFilter(e.target.value)} className="md:col-span-4">
            <option value="all">Todos los músculos</option>
            {Object.keys(MUSCLE_LABELS).map((m) => (
              <option key={m} value={m}>{MUSCLE_LABELS[m]}</option>
            ))}
          </select>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
        {filtered.map((ex) => {
          const entries = log[ex.id] || [];
          const last = entries[entries.length - 1];
          const color = MUSCLE_COLORS[ex.muscle] || '#94a3b8';
          const zone = getVolumeZone(ex.muscle, weeklySets[ex.muscle] || 0);
          return (
            <button
              key={ex.id}
              onClick={() => setSelected(ex)}
              className="text-left bg-card border border-border rounded-card p-3 hover:border-accent/40 transition"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm text-white truncate">{ex.name}</div>
                  <div className="text-[0.65rem] text-muted mt-0.5">{ex.tech}</div>
                </div>
                <DevBadge label={zone.label} />
              </div>
              <div className="flex items-center justify-between mt-3 text-xs">
                <span
                  className="px-2 py-0.5 rounded text-[0.65rem]"
                  style={{ background: color + '22', color }}
                >
                  {MUSCLE_LABELS[ex.muscle]}
                </span>
                <span className="font-mono text-accent">
                  {last ? last.vol.toFixed(0) + ' kg' : '—'}
                </span>
              </div>
              <div className="text-[0.6rem] text-muted mt-1 font-mono">
                {entries.length} entrada{entries.length !== 1 ? 's' : ''}
              </div>
            </button>
          );
        })}
      </div>

      <LogDetailModal open={!!selected} onClose={() => setSelected(null)} exercise={selected} />
    </>
  );
}
