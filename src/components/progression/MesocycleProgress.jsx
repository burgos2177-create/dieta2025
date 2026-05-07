import { useMemo } from 'react';
import Card from '../ui/Card.jsx';
import { useTrainingStore, selectTrainingDay } from '../../store/useTrainingStore.js';
import { addWeeks } from '../../lib/dates.js';
import { mesoPhaseLabel } from '../../lib/mesocycle.js';
import { TR_DAYS_CONFIG, MUSCLE_LABELS, MUSCLE_COLORS } from '../../lib/constants.js';

/** Vista comparativa: progresión de cargas/volumen por ejercicio a lo largo del mesociclo activo. */
export default function MesocycleProgress() {
  const mesocycles = useTrainingStore((s) => s.mesocycles);
  const activeMesocycleId = useTrainingStore((s) => s.activeMesocycleId);
  const state = useTrainingStore();

  const meso = mesocycles.find((m) => m.id === activeMesocycleId);

  // Compute weeks of mesocycle: [{weekKey, weekNumber, phase}]
  const weeks = useMemo(() => {
    if (!meso) return [];
    return Array.from({ length: meso.weeks }, (_, i) => ({
      weekKey: addWeeks(meso.startWeek, i),
      weekNumber: i + 1,
      phase: mesoPhaseLabel(i + 1, meso.weeks),
    }));
  }, [meso]);

  // For each training weekday, build a table of (exercise, weekVolumes[])
  const matrices = useMemo(() => {
    if (!meso) return [];
    return TR_DAYS_CONFIG.map((cfg) => {
      // Collect all exercise IDs that appeared in any week of this weekday
      const exerciseMap = {}; // id -> {name, muscle, perWeek: {weekNumber: {reps, sets, weight, vol}}}
      weeks.forEach((wk) => {
        const day = selectTrainingDay(state, wk.weekKey, cfg.weekday);
        if (!day) return;
        (day.exercises || []).forEach((ex) => {
          if (!exerciseMap[ex.id]) {
            exerciseMap[ex.id] = { id: ex.id, name: ex.name, muscle: ex.muscle, perWeek: {} };
          }
          const reps = Number(ex.reps) || 0;
          const sets = Number(ex.sets) || 0;
          const weight = Number(ex.weight) || 0;
          exerciseMap[ex.id].perWeek[wk.weekNumber] = { reps, sets, weight, vol: reps * sets * weight };
        });
      });
      return { cfg, exercises: Object.values(exerciseMap) };
    });
  }, [meso, weeks, state]);

  if (!meso) {
    return (
      <Card>
        <div className="text-center py-6">
          <div className="text-muted text-sm">No hay mesociclo activo.</div>
          <div className="text-muted/70 text-xs mt-1">Activa uno desde la página de Entrenamiento → 🔄 Meso.</div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <Card>
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted font-display">Mesociclo</div>
            <div className="font-display text-xl text-white">{meso.name}</div>
          </div>
          <div className="text-sm text-muted">
            {meso.weeks} semanas · peso inicio: <span className="font-mono text-white">{meso.startWeight || '—'}{meso.startWeight ? ' kg' : ''}</span>
          </div>
        </div>
      </Card>

      {matrices.map(({ cfg, exercises }) => (
        <Card key={cfg.weekday} title={`${cfg.label} · ${cfg.focus}`}>
          {exercises.length === 0 ? (
            <div className="text-sm text-muted text-center py-3">Sin ejercicios registrados en este día.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[0.65rem] uppercase tracking-wider text-muted border-b border-border">
                    <th className="text-left py-2 px-2">Ejercicio</th>
                    {weeks.map((wk) => (
                      <th key={wk.weekNumber} className="text-center py-2 px-2 min-w-[80px]">
                        <div>S{wk.weekNumber}</div>
                        <div className="text-[0.55rem] normal-case opacity-70 font-normal">{wk.phase.split(' ')[0]}</div>
                      </th>
                    ))}
                    <th className="text-right py-2 px-2 text-accent">Δ S1→S{meso.weeks - 1}</th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  {exercises.map((ex) => {
                    const peakWeek = meso.weeks - 1; // peak = penultimate
                    const v1 = ex.perWeek[1]?.vol || 0;
                    const vp = ex.perWeek[peakWeek]?.vol || 0;
                    const delta = v1 > 0 && vp > 0 ? ((vp - v1) / v1) * 100 : null;
                    const color = MUSCLE_COLORS[ex.muscle] || '#94a3b8';
                    return (
                      <tr key={ex.id} className="border-b border-border/40 hover:bg-white/[0.02]">
                        <td className="py-2 px-2">
                          <div className="text-white font-body text-sm">{ex.name}</div>
                          <span
                            className="inline-block mt-0.5 px-1.5 py-0 rounded text-[0.55rem]"
                            style={{ background: color + '22', color, border: `1px solid ${color}44` }}
                          >
                            {MUSCLE_LABELS[ex.muscle] || ex.muscle}
                          </span>
                        </td>
                        {weeks.map((wk) => {
                          const cell = ex.perWeek[wk.weekNumber];
                          if (!cell) {
                            return <td key={wk.weekNumber} className="text-center text-muted/40 px-2">—</td>;
                          }
                          // Compare to previous available week's volume to color
                          const prev = (() => {
                            for (let n = wk.weekNumber - 1; n >= 1; n--) {
                              if (ex.perWeek[n]) return ex.perWeek[n];
                            }
                            return null;
                          })();
                          let toneCls = 'text-white';
                          if (prev) {
                            if (cell.vol > prev.vol + 0.5) toneCls = 'text-ok';
                            else if (cell.vol < prev.vol - 0.5) toneCls = 'text-bad';
                          }
                          return (
                            <td key={wk.weekNumber} className={`text-center px-2 py-1 ${toneCls}`}>
                              <div className="text-sm">{cell.weight}<span className="text-[0.55rem] text-muted">kg</span></div>
                              <div className="text-[0.55rem] text-muted">{cell.reps}×{cell.sets} · <span className="text-accent/80">{cell.vol.toFixed(0)}</span></div>
                            </td>
                          );
                        })}
                        <td className={`text-right px-2 font-semibold ${delta == null ? 'text-muted/40' : delta > 0 ? 'text-ok' : delta < 0 ? 'text-bad' : 'text-muted'}`}>
                          {delta == null ? '—' : `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}%`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
