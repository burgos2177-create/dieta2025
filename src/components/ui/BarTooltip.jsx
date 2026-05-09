/**
 * Wrapper que muestra un tooltip flotante al hacer hover sobre el contenido.
 * Pensado para envolver MacroBar / MicroStat con la lista de "top 3 alimentos".
 */
export default function BarTooltip({ title, items, unit, children }) {
  const hasItems = (items || []).length > 0;
  return (
    <div className="relative group">
      {children}
      <div
        className={`absolute z-30 left-1/2 -translate-x-1/2 bottom-full mb-2 w-72 max-w-[90vw] bg-card border border-border rounded-lg shadow-2xl p-3 pointer-events-none transition-opacity duration-150 ${
          hasItems ? 'opacity-0 group-hover:opacity-100' : 'opacity-0'
        }`}
      >
        <div className="flex items-baseline justify-between mb-2 pb-2 border-b border-border">
          <span className="text-[0.65rem] uppercase tracking-wider text-muted font-display">
            {title}
          </span>
          <span className="text-[0.6rem] text-muted/70">top {items?.length || 0}</span>
        </div>
        {hasItems ? (
          <ul className="space-y-1.5">
            {items.map((it, idx) => (
              <li key={idx} className="flex items-baseline justify-between gap-2 text-xs">
                <span className="truncate text-white min-w-0">
                  <span className="text-muted/70 font-mono mr-1.5">#{idx + 1}</span>
                  {it.name}
                  {it.brand && <span className="text-muted ml-1">· {it.brand}</span>}
                </span>
                <span className="font-mono text-accent shrink-0">
                  {it.contribution < 10 ? it.contribution.toFixed(1) : Math.round(it.contribution)}
                  {unit}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-xs text-muted/70">Sin alimentos que aporten.</div>
        )}
        {/* Arrow */}
        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-card border-r border-b border-border" />
      </div>
    </div>
  );
}
