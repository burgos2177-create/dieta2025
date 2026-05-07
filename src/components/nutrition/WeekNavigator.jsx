import { addWeeks, formatWeekRange, getMondayKey, isCurrentWeek } from '../../lib/dates';

export default function WeekNavigator({ activeWeek, onChange, snapshotCount = 0, mesoInfo, onOpenMesocycles }) {
  const isCurrent = isCurrentWeek(activeWeek);
  return (
    <div className="flex items-center justify-between gap-2 bg-white/[0.02] border border-border rounded-lg px-3 py-2">
      <button
        onClick={() => onChange(addWeeks(activeWeek, -1))}
        className="px-2 py-1.5 rounded-md text-muted hover:text-white hover:bg-white/5 transition"
        aria-label="Semana anterior"
        title="Semana anterior"
      >
        ◀
      </button>

      <div className="flex-1 text-center min-w-0">
        <div className="text-xs uppercase tracking-wider text-muted font-display flex items-center justify-center gap-1 flex-wrap">
          {mesoInfo ? (
            <>
              <span className="text-accent normal-case tracking-normal truncate max-w-[14rem]">
                {mesoInfo.meso.name}
              </span>
              <span className="text-white normal-case tracking-normal">
                · Sem {mesoInfo.weekNumber}/{mesoInfo.meso.weeks}
              </span>
              {mesoInfo.phase && (
                <span className="text-muted/80 normal-case tracking-normal">· {mesoInfo.phase}</span>
              )}
            </>
          ) : (
            <span>Semana {isCurrent && <span className="text-accent normal-case">· actual</span>}</span>
          )}
          {snapshotCount > 0 && (
            <span className="text-muted/70 normal-case tracking-normal">
              · {snapshotCount} reg.
            </span>
          )}
        </div>
        <div className="font-mono text-sm text-white">{formatWeekRange(activeWeek)}</div>
      </div>

      <div className="flex items-center gap-1">
        {onOpenMesocycles && (
          <button
            onClick={onOpenMesocycles}
            className="px-2 py-1.5 text-xs rounded-md border border-border text-muted hover:text-white hover:border-white/20 transition"
            title="Mesociclos"
          >
            🔄 Meso
          </button>
        )}
        {!isCurrent && (
          <button
            onClick={() => onChange(getMondayKey(new Date()))}
            className="px-2 py-1.5 text-xs rounded-md border border-border text-muted hover:text-white hover:border-white/20 transition"
            title="Ir a la semana actual"
          >
            Hoy
          </button>
        )}
        <button
          onClick={() => onChange(addWeeks(activeWeek, 1))}
          className="px-2 py-1.5 rounded-md text-muted hover:text-white hover:bg-white/5 transition"
          aria-label="Semana siguiente"
          title="Semana siguiente"
        >
          ▶
        </button>
      </div>
    </div>
  );
}
