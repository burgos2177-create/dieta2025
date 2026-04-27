import { VOLUME_ZONES } from '../../lib/volumeZones.js';
import DevBadge from '../ui/DevBadge.jsx';
import { MUSCLE_LABELS, MUSCLE_COLORS } from '../../lib/constants.js';

/**
 * Single muscle volume bar with MEV/MAV/MRV markers.
 */
export default function VolumeBar({ muscle, sets, zone }) {
  const z = VOLUME_ZONES[muscle];
  if (!z) return null;
  const max = Math.max(z.mrv * 1.25, sets * 1.1, 10);
  const pct = (n) => (n / max) * 100;
  const color = MUSCLE_COLORS[muscle] || '#00e5ff';
  return (
    <div className="bg-white/[0.02] border border-border rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="font-display text-xs tracking-wide text-white/90">{MUSCLE_LABELS[muscle] || muscle}</span>
        <div className="flex items-center gap-1.5">
          <DevBadge label={zone.label} />
          <span className="font-mono text-xs text-muted">{sets}</span>
        </div>
      </div>
      <div className="relative h-3 rounded-full bg-white/[0.04] overflow-hidden">
        <div
          className="absolute top-0 left-0 h-full rounded-full"
          style={{ width: pct(sets) + '%', background: color, boxShadow: `0 0 10px ${color}66` }}
        />
        {/* Markers */}
        <Marker pct={pct(z.mev[0])} label="MEV" />
        <Marker pct={pct(z.mav[0])} label="MAV" />
        <Marker pct={pct(z.mrv)}   label="MRV" danger />
      </div>
      <div className="flex justify-between text-[0.6rem] text-muted/80 font-mono mt-1">
        <span>MEV {z.mev[0]}</span>
        <span>MAV {z.mav[0]}</span>
        <span>MRV {z.mrv}</span>
      </div>
    </div>
  );
}

function Marker({ pct, label, danger }) {
  return (
    <div
      className={`absolute top-0 h-full w-[1.5px] ${danger ? 'bg-bad' : 'bg-white/40'}`}
      style={{ left: pct + '%' }}
      title={label}
    />
  );
}
