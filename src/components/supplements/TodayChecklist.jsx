import { useMemo, useState } from 'react';
import Card from '../ui/Card.jsx';
import { useSupplementStore, selectChecklistForDate } from '../../store/useSupplementStore.js';
import { timingMeta } from '../../lib/supplementsSeed.js';
import { ymd, formatLongDate } from '../../lib/dates.js';
import { DAYS } from '../../lib/constants.js';

export default function TodayChecklist() {
  const intake = useSupplementStore((s) => s.intake);
  const toggleIntake = useSupplementStore((s) => s.toggleIntake);
  const clearDay = useSupplementStore((s) => s.clearDay);

  const [activeDate, setActiveDate] = useState(() => new Date());
  const dateKey = ymd(activeDate);
  const weekdayIdx = (() => {
    const d = activeDate.getDay() || 7;
    return d - 1;
  })();

  const items = useSupplementStore((s) => selectChecklistForDate(s, dateKey));

  const byTiming = useMemo(() => {
    const groups = {};
    for (const i of items) {
      const t = i.timing || 'otro';
      if (!groups[t]) groups[t] = [];
      groups[t].push(i);
    }
    return Object.entries(groups).sort(([a], [b]) => timingMeta(a).order - timingMeta(b).order);
  }, [items]);

  const dayIntake = intake[dateKey] || {};
  const takenCount = items.filter((i) => dayIntake[i.supplementId]).length;

  const stepDay = (delta) => {
    const d = new Date(activeDate);
    d.setDate(d.getDate() + delta);
    setActiveDate(d);
  };
  const goToday = () => setActiveDate(new Date());

  return (
    <div className="space-y-4">
      <Card pad={false}>
        <div className="flex items-center justify-between gap-2 px-3 py-2">
          <button onClick={() => stepDay(-1)} className="px-2 py-1.5 rounded text-muted hover:text-white hover:bg-white/5" aria-label="Día anterior">◀</button>
          <div className="flex-1 text-center">
            <div className="text-xs uppercase tracking-wider text-muted font-display">{DAYS[weekdayIdx].name}</div>
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

      <Card>
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-[0.65rem] uppercase tracking-wider text-muted font-display">Progreso del día</div>
            <div className="font-mono text-2xl">
              <span className="text-accent">{takenCount}</span>
              <span className="text-muted"> / {items.length}</span>
            </div>
          </div>
          <div className="flex-1 h-2 rounded-full bg-white/[0.05] overflow-hidden">
            <div
              className="h-full bg-accent transition-all"
              style={{ width: items.length > 0 ? `${(takenCount / items.length) * 100}%` : '0%' }}
            />
          </div>
          {takenCount > 0 && (
            <button
              onClick={() => { if (confirm('¿Borrar el registro del día?')) clearDay(dateKey); }}
              className="text-xs px-2 py-1 rounded border border-border text-muted hover:text-bad hover:border-bad/40"
            >
              ↺ Reset
            </button>
          )}
        </div>
      </Card>

      {items.length === 0 ? (
        <Card>
          <div className="text-sm text-muted text-center py-3">
            Hoy no toca ningún suplemento programado.
            <div className="text-xs mt-1 text-muted/70">
              Crea o activa un protocolo en la pestaña Protocolos.
            </div>
          </div>
        </Card>
      ) : (
        byTiming.map(([timingId, group]) => {
          const meta = timingMeta(timingId);
          return (
            <Card key={timingId} pad={false}>
              <div className="px-4 py-2 border-b border-border flex items-center justify-between">
                <div className="font-display text-sm tracking-wide text-white">
                  <span className="mr-1.5">{meta.icon}</span>{meta.label.toUpperCase()}
                </div>
                <div className="text-[0.65rem] text-muted">
                  {group.filter((i) => dayIntake[i.supplementId]).length}/{group.length}
                </div>
              </div>
              <div className="divide-y divide-border">
                {group.map((item) => {
                  const taken = !!dayIntake[item.supplementId];
                  const w = item.weekInfo;
                  return (
                    <button
                      key={item.key}
                      onClick={() => toggleIntake(dateKey, item.supplementId)}
                      className={`w-full text-left px-4 py-3 flex items-center gap-3 transition ${
                        taken ? 'bg-accent/[0.05]' : 'hover:bg-white/[0.02]'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center text-xs shrink-0 ${
                          taken ? 'border-accent bg-accent text-black' : 'border-border'
                        }`}
                      >
                        {taken ? '✓' : ''}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm flex items-baseline gap-2 ${taken ? 'text-muted line-through' : 'text-white'}`}>
                          <span className="truncate">{item.name}</span>
                          {item.brand && <span className="text-[0.65rem] text-muted shrink-0">· {item.brand}</span>}
                          {w && (
                            <span
                              className="text-[0.6rem] uppercase tracking-wider px-1.5 py-0.5 rounded border border-accent/30 bg-accent/10 text-accent shrink-0"
                              title={w.indefinite ? `Semana ${w.current} (indefinido)` : `Semana ${w.current} de ${w.total}`}
                            >
                              {w.indefinite ? `S${w.current}` : `S${w.current}/${w.total}`}
                            </span>
                          )}
                        </div>
                        {item.notes && <div className="text-[0.65rem] text-muted/80 mt-0.5">{item.notes}</div>}
                      </div>
                      <div className="font-mono text-sm text-accent shrink-0">
                        {item.doseAmount} {item.doseUnit}
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
