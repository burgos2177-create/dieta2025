/**
 * Wheel where the FULL circle = normo (TDEE base, NEAT-only).
 * - Déficit day (kcal < tdee): only fills `kcal/tdee`. The remaining slice is
 *   shaded as "déficit" to make the gap obvious.
 * - Superávit day (kcal > tdee): fills 100% in the base color, plus an extra
 *   arc on top of the track in a different color = the surplus portion.
 */
export default function KcalRing({ kcal, tdee }) {
  const size = 220;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const safeTdee = tdee > 0 ? tdee : 1;

  const isSurplus = kcal > safeTdee;
  const isDeficit = kcal < safeTdee;
  const pctBase = Math.min(kcal, safeTdee) / safeTdee;
  const surplusPct = isSurplus ? Math.min((kcal - safeTdee) / safeTdee, 1) : 0;

  // Stroke-dasharray for partial fill
  const baseOffset = c * (1 - pctBase);
  const surplusOffset = c * (1 - surplusPct);
  // Deficit "missing" arc: the gap, drawn as a faint warn slice.
  const deficitPct = isDeficit ? 1 - pctBase : 0;
  const deficitOffset = c * (1 - deficitPct);
  // The deficit arc starts where the base ends. We rotate via dashoffset:
  // rotate the SVG so the deficit slice begins at pctBase along the circle.
  const deficitRotateDeg = -90 + pctBase * 360;

  const diff = kcal - safeTdee;
  const diffStr = (diff >= 0 ? '+' : '') + Math.round(diff).toLocaleString();

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Track (full circle) */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#1c2233"
          strokeWidth={stroke}
          fill="none"
        />

        {/* Base fill (kcal del día, capped at normo) */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#kcalGrad)"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={baseOffset}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />

        {/* Deficit arc — only on déficit days */}
        {isDeficit && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke="#ef4444"
            strokeWidth={stroke}
            fill="none"
            strokeOpacity={0.35}
            strokeLinecap="butt"
            strokeDasharray={c}
            strokeDashoffset={deficitOffset}
            style={{
              transformOrigin: `${size / 2}px ${size / 2}px`,
              transform: `rotate(${deficitRotateDeg}deg)`,
              transition: 'stroke-dashoffset 0.6s ease',
            }}
          />
        )}

        <defs>
          <linearGradient id="kcalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00e5ff" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
          <linearGradient id="kcalSurplusGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#a3e635" />
          </linearGradient>
        </defs>
      </svg>

      {/* Surplus arc — sits ABOVE the track (a second ring slightly larger or
         the same radius layered on top). Drawn separately so it stacks visually. */}
      {isSurplus && (
        <svg
          width={size}
          height={size}
          className="-rotate-90 absolute inset-0 pointer-events-none"
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke="url(#kcalSurplusGrad)"
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={surplusOffset}
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
          <defs>
            <linearGradient id="kcalSurplusGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22c55e" />
              <stop offset="100%" stopColor="#a3e635" />
            </linearGradient>
          </defs>
        </svg>
      )}

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-mono text-4xl font-bold text-white">{kcal.toLocaleString()}</div>
        <div className="text-xs uppercase text-muted tracking-wider font-display">kcal del día</div>
        <div
          className={`text-[0.65rem] mt-1 font-mono ${
            isDeficit ? 'text-bad' : isSurplus ? 'text-ok' : 'text-muted'
          }`}
          title={`vs normo (${safeTdee.toLocaleString()} kcal)`}
        >
          {diffStr} vs normo
        </div>
      </div>
    </div>
  );
}
