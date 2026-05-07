import { DAYS } from '../../lib/constants';
import { weekDates } from '../../lib/dates';

export default function DaySelector({ active, onChange, weekKey, snapshotDays = [] }) {
  const dates = weekKey ? weekDates(weekKey) : null;
  const today = new Date();
  const todayYmd = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  return (
    <div className="grid grid-cols-7 gap-2">
      {DAYS.map((d, i) => {
        const isActive = i === active;
        const date = dates?.[i];
        const dateYmd = date ? `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}` : null;
        const isToday = dateYmd && dateYmd === todayYmd;
        const hasSnapshot = snapshotDays.includes(i);
        return (
          <button
            key={i}
            onClick={() => onChange(i)}
            className={`relative py-3 rounded-lg border text-center transition ${
              isActive
                ? 'bg-accent/15 border-accent/40 text-accent shadow-[0_0_20px_rgba(0,229,255,0.15)]'
                : 'bg-card border-border text-muted hover:text-white hover:border-white/20'
            } ${isToday && !isActive ? 'ring-1 ring-accent/30' : ''}`}
          >
            <div className="font-display text-lg leading-none">
              {d.label}
              {date && (
                <span className="ml-1 text-[0.7rem] font-mono opacity-70">{date.getDate()}</span>
              )}
            </div>
            <div className="text-[0.65rem] uppercase mt-1 text-muted/80">
              {d.type === 'train' ? d.workout : d.type === 'normo' ? 'Normo' : 'Off'}
            </div>
            {hasSnapshot && (
              <span
                className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-accent"
                title="Día con registro propio"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
