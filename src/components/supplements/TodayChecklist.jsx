import { useMemo, useState } from 'react';
import Card from '../ui/Card.jsx';
import { useSupplementStore, selectScheduledForWeekday } from '../../store/useSupplementStore.js';
import { SUPPLEMENT_TIMING_PRESETS, timingMeta } from '../../lib/supplementsSeed.js';
import { ymd, todayDayIdx, formatLongDate, addWeeks, getMondayKey, weekDates } from '../../lib/dates.js';
import { DAYS } from '../../lib/constants.js';

export default function TodayChecklist() {
  const library = useSupplementStore((s) => s.library);
  const intake = useSupplementStore((s) => s.intake);
  const toggleIntake = useSupplementStore((s) => s.toggleIntake);
  const clearDay = useSupplementStore((s) => s.clearDay);

  // Date picker — defaults to today.
  const [activeDate, setActiveDate] = useState(() => new Date());
  const dateKey = ymd(activeDate);
  const weekdayIdx = (() => {
    const d = activeDate.getDay() || 7; return d - 1;
  })();

  const scheduled = useMemo(
    () => selectScheduledForWeekday({ library }, weekdayIdx),
    [library, weekdayIdx]
  );

  // Group by timing
  const byTiming = useMemo(() => {
    const groups = {};
    for (const s of scheduled) {
      const t = s.timing || 'otro';
      if (!groups[t]) groups[t] = [];
      groups[t].push(s);
    }
    // Order timings by preset order
    return Object.entries(groups).sort(([a], [b]) => timingMeta(a).order - timingMeta(b).order);
  }, [scheduled]);

  const dayIntake = intake[dateKey] || {};
  const takenCount = scheduled.filter((s) => dayIntake[s.id]).length;

  const stepDay = (delta) => {
    const d = new Date(activeDate);
    d.setDate(d.getDate() + delta);
    setActiveDate(d);
  };
  const goToday = () => setActiveDate(new Date());

  return (
    <div className="space-y-4">
      {/* Date navigator */}
      <Card pad={false}>
        <div className="flex items-center justify-between gap-2 px-3 py-2">
          <button onClick={() => stepDay(-1)} className="px-2 py-1.5 rounded text-muted hover:text-white hover:bg-white/5" aria-label="Día anterior">◀</button>
          <div className="flex-1 text-center">
            <div className="text-xs uppercase tracking-wider text-muted font-display">
              {DAYS[weekdayIdx].name}
            </div>
            <div className="font-mono text-sm text-white">{formatLongDate(activeDate)}</div>
          </div>
          <div className="flex items-center gap-1">
            {ymd(new Date()) !== dateKey && (
              <button onClick={goToday} className="px-2 py-1.5 text-xs rounded border border-border text-muted hover:text-white hover:border-white/20">Hoy</button>
            )}
            <button onClick={() => stepDay(1)} className="px-2 py-1.5 rounded text-muted hover:text-white hover:bg-white/5" aria-label="Día siguiente">▶</button>
          </div>
        </div>
      </Card>

      {/* Progress summary */}
      <Card>
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-[0.65rem] uppercase tracking-wider text-muted font-display">Progreso del día</div>
            <div className="font-mono text-2xl">
              <span className="text-accent">{takenCount}</span>
              <span className="text-muted"> / {scheduled.length}</span>
            </div>
          </div>
          <div className="flex-1 h-2 rounded-full bg-white/[0.05] overflow-hidden">
            <div
              className="h-full bg-accent transition-all"
              style={{ width: scheduled.length > 0 ? `${(takenCount / scheduled.length) * 100}%` : '0%' }}
            />
          </div>
          {takenCount > 0 && (
            <button
              onClick={() => { if (confirm('¿Borrar el registro del día?')) clearDay(dateKey); }}
              className="text-xs px-2 py-1 rounded border border-border text-muted hover:text-bad hover:border-bad/40"
              title="Borrar todos los marcados de este día"
            >
              ↺ Reset
            </button>
          )}
        </div>
      </Card>

      {/* Groups */}
      {scheduled.length === 0 ? (
        <Card>
          <div className="text-sm text-muted text-center py-3">
            Hoy no toca ningún suplemento programado.
            <div className="text-xs mt-1 text-muted/70">
              Activa o crea suplementos en la pestaña Biblioteca.
            </div>
          </div>
        </Card>
      ) : (
        byTiming.map(([timingId, items]) => {
          const meta = timingMeta(timingId);
          return (
            <Card key={timingId} pad={false}>
              <div className="px-4 py-2 border-b border-border flex items-center justify-between">
                <div className="font-display text-sm tracking-wide text-white">
                  <span className="mr-1.5">{meta.icon}</span>{meta.label.toUpperCase()}
                </div>
                <div className="text-[0.65rem] text-muted">
                  {items.filter((i) => dayIntake[i.id]).length}/{items.length}
                </div>
              </div>
              <div className="divide-y divide-border">
                {items.map((sup) => {
                  const taken = !!dayIntake[sup.id];
                  return (
                    <button
                      key={sup.id}
                      onClick={() => toggleIntake(dateKey, sup.id)}
                      className={`w-full text-left px-4 py-3 flex items-center gap-3 transition ${
                        taken ? 'bg-accent/[0.05]' : 'hover:bg-white/[0.02]'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center text-xs shrink-0 ${
                          taken
                            ? 'border-accent bg-accent text-black'
                            : 'border-border'
                        }`}
                      >
                        {taken ? '✓' : ''}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm ${taken ? 'text-muted line-through' : 'text-white'}`}>
                          {sup.name}
                          {sup.brand && <span className="text-muted ml-1">· {sup.brand}</span>}
                        </div>
                        {sup.notes && <div className="text-[0.65rem] text-muted/80 mt-0.5">{sup.notes}</div>}
                      </div>
                      <div className="font-mono text-sm text-accent shrink-0">
                        {sup.doseAmount} {sup.doseUnit}
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>
          );
        })
      )}
    </div>
  );
}
