import { addWeeks, formatWeekRange, getMondayKey, isCurrentWeek } from '../../lib/dates';

export default function WeekNavigator({ activeWeek, onChange, snapshotCount = 0 }) {
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

      <div className="flex-1 text-center">
        <div className="text-xs uppercase tracking-wider text-muted font-display">
          Semana
          {isCurrent && (
            <span className="ml-1 text-accent normal-case tracking-normal">· actual</span>
          )}
          {snapshotCount > 0 && (
            <span className="ml-1 text-muted/70 normal-case tracking-normal">
              · {snapshotCount} día{snapshotCount !== 1 ? 's' : ''} con registro
            </span>
          )}
        </div>
        <div className="font-mono text-sm text-white">{formatWeekRange(activeWeek)}</div>
      </div>

      <div className="flex items-center gap-1">
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
