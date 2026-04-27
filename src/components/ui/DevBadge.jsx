const ZONE_TONES = {
  MV:   { bg: 'bg-slate-500/20', text: 'text-slate-300', border: 'border-slate-500/40' },
  MEV:  { bg: 'bg-ok/20',        text: 'text-ok',        border: 'border-ok/40' },
  MAV:  { bg: 'bg-accent/20',    text: 'text-accent',    border: 'border-accent/40' },
  MRV:  { bg: 'bg-bad/20',       text: 'text-bad',       border: 'border-bad/40' },
  '—':  { bg: 'bg-white/5',      text: 'text-muted',     border: 'border-white/10' },
};

export default function DevBadge({ label, className = '' }) {
  const t = ZONE_TONES[label] || ZONE_TONES['—'];
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-[0.7rem] font-bold rounded border ${t.bg} ${t.text} ${t.border} ${className}`}
    >
      {label}
    </span>
  );
}

/** Deviation pill: renders ok (±tolerance%) / over / under */
export function DevDelta({ actual, target, unit = 'g', tolerance = 0.05 }) {
  const diff = actual - target;
  const pct = target > 0 ? Math.abs(diff) / target : 0;
  const ok = pct <= tolerance;
  const sign = diff >= 0 ? '+' : '';
  const tone = ok ? 'text-ok' : diff > 0 ? 'text-bad' : 'text-warn';
  return (
    <span className={`font-mono text-xs font-semibold ${tone}`}>
      {sign}
      {diff.toFixed(1)}
      {unit}
    </span>
  );
}
