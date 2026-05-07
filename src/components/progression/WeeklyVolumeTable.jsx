import { useMemo } from 'react';
import Card from '../ui/Card.jsx';
import DevBadge from '../ui/DevBadge.jsx';
import { useTrainingStore, selectTrainingDaysForWeek } from '../../store/useTrainingStore.js';
import { VOLUME_ZONES, getWeeklySetsByMuscle, getVolumeZone } from '../../lib/volumeZones.js';
import { MUSCLE_LABELS } from '../../lib/constants.js';

export default function WeeklyVolumeTable() {
  const trainingDays = useTrainingStore((s) => selectTrainingDaysForWeek(s, s.activeWeek));
  const days = useMemo(() => trainingDays.map((d) => d.day), [trainingDays]);
  const totals = useMemo(() => getWeeklySetsByMuscle(days), [days]);
  const muscles = Object.keys(VOLUME_ZONES);
  return (
    <Card title="Volumen semanal completo">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[0.65rem] uppercase tracking-wider text-muted border-b border-border">
              <th className="text-left py-2">Músculo</th>
              <th className="py-2">Sets</th>
              <th className="py-2">MV</th>
              <th className="py-2">MEV</th>
              <th className="py-2">MAV</th>
              <th className="py-2">MRV</th>
              <th className="py-2">Zona</th>
            </tr>
          </thead>
          <tbody className="font-mono">
            {muscles.map((m) => {
              const z = VOLUME_ZONES[m];
              const sets = totals[m] || 0;
              const zone = getVolumeZone(m, sets);
              return (
                <tr key={m} className="border-b border-border/40">
                  <td className="py-2 font-body text-white">{MUSCLE_LABELS[m]}</td>
                  <td className="py-2 text-center text-accent">{sets}</td>
                  <td className="py-2 text-center text-muted">{z.mv[0]}–{z.mv[1]}</td>
                  <td className="py-2 text-center text-muted">{z.mev[0]}–{z.mev[1]}</td>
                  <td className="py-2 text-center text-muted">{z.mav[0]}–{z.mav[1]}</td>
                  <td className="py-2 text-center text-muted">{z.mrv}</td>
                  <td className="py-2 text-center"><DevBadge label={zone.label} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
