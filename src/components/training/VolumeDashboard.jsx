import { useMemo } from 'react';
import Card from '../ui/Card.jsx';
import DevBadge from '../ui/DevBadge.jsx';
import VolumeBar from './VolumeBar.jsx';
import { getWeeklySetsByMuscle, getVolumeZone, VOLUME_ZONES } from '../../lib/volumeZones.js';

export default function VolumeDashboard({ days }) {
  const totals = useMemo(() => getWeeklySetsByMuscle(days), [days]);
  const muscles = Object.keys(VOLUME_ZONES);
  return (
    <Card
      title="Volumen semanal por músculo"
      right={
        <div className="flex items-center gap-1.5">
          <DevBadge label="MV" />
          <DevBadge label="MEV" />
          <DevBadge label="MAV" />
          <DevBadge label="MRV" />
        </div>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {muscles.map((m) => {
          const sets = totals[m] || 0;
          const zone = getVolumeZone(m, sets);
          return <VolumeBar key={m} muscle={m} sets={sets} zone={zone} />;
        })}
      </div>
    </Card>
  );
}
