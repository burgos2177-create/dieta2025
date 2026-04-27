/**
 * Macro progress bar with overflow-in-red visual.
 * value/target in grams.
 */
export default function MacroBar({ label, value, target, color, unit = 'g' }) {
  const pct = target > 0 ? Math.min((value / target) * 100, 100) : 0;
  const overPct = target > 0 && value > target ? Math.min(((value - target) / target) * 100, 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between">
        <span className="text-xs uppercase tracking-wide text-muted font-display">{label}</span>
        <span className="font-mono text-sm text-white">
          <span className="text-white">{value.toFixed(0)}</span>
          <span className="text-muted"> / {target.toFixed(0)}{unit}</span>
        </span>
      </div>
      <div className="h-2 rounded-full bg-white/5 overflow-hidden relative">
        <div
          className="h-full rounded-full transition-[width] duration-300"
          style={{ width: pct + '%', background: color }}
        />
        {overPct > 0 && (
          <div
            className="absolute top-0 right-0 h-full bg-bad/80"
            style={{ width: overPct + '%' }}
          />
        )}
      </div>
    </div>
  );
}
