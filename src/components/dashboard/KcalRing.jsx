/**
 * Wheel where the FULL circle = normo (TDEE base).
 * - Déficit day (kcal < tdee): cyan fills `kcal/tdee`, the remaining slice is
 *   shaded red (déficit visible).
 * - Superávit day (kcal > tdee): cyan fills 100%, then a green arc on top
 *   represents the surplus invading.
 *
 * Implementation: each arc is a circle with a single contiguous dash
 * positioned via `strokeDasharray = [visible, c]` + `strokeDashoffset` shift.
 * Avoids `transform: rotate` per arc to prevent rendering glitches.
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
  const deficitPct = isDeficit ? 1 - pctBase : 0;

  // Arc helpers
  const baseLen = c * pctBase;
  const deficitLen = c * deficitPct;
  const surplusLen = c * surplusPct;

  const diff = kcal - safeTdee;
  const diffStr = (diff >= 0 ? '+' : '') + Math.round(diff).toLocaleString();

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
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

        {/* Track (full circle background) */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#1c2233"
          strokeWidth={stroke}
          fill="none"
        />

        {/* Base fill: from start (top) for `baseLen` */}
        {pctBase > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke="url(#kcalGrad)"
            strokeWidth={stroke}
            fill="none"
            strokeLinecap={isDeficit ? 'butt' : 'round'}
            strokeDasharray={`${baseLen} ${c}`}
            strokeDashoffset={0}
            style={{ transition: 'stroke-dasharray 0.6s ease' }}
          />
        )}

        {/* Déficit arc: starts where base ends, goes for `deficitLen` */}
        {isDeficit && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke="#ef4444"
            strokeWidth={stroke}
            strokeOpacity={0.35}
            fill="none"
            strokeLinecap="butt"
            strokeDasharray={`${deficitLen} ${c}`}
            strokeDashoffset={-baseLen}
            style={{ transition: 'stroke-dasharray 0.6s ease' }}
          />
        )}

        {/* Superávit arc: drawn over the full base, from start, length `surplusLen` */}
        {isSurplus && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke="url(#kcalSurplusGrad)"
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${surplusLen} ${c}`}
            strokeDashoffset={0}
            style={{ transition: 'stroke-dasharray 0.6s ease' }}
          />
        )}
      </svg>

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
