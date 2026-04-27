const TONES = {
  cyan:   'bg-accent/15 text-accent border-accent/30',
  green:  'bg-ok/15 text-ok border-ok/30',
  red:    'bg-bad/15 text-bad border-bad/30',
  yellow: 'bg-warn/15 text-warn border-warn/30',
  gray:   'bg-white/5 text-muted border-white/10',
};

export default function Pill({ children, tone = 'gray', className = '' }) {
  const cls = TONES[tone] || TONES.gray;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${cls} ${className}`}
    >
      {children}
    </span>
  );
}
