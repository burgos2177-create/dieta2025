import { DAYS } from '../../lib/constants';

export default function DaySelector({ active, onChange }) {
  return (
    <div className="grid grid-cols-7 gap-2">
      {DAYS.map((d, i) => {
        const isActive = i === active;
        return (
          <button
            key={i}
            onClick={() => onChange(i)}
            className={`py-3 rounded-lg border text-center transition ${
              isActive
                ? 'bg-accent/15 border-accent/40 text-accent shadow-[0_0_20px_rgba(0,229,255,0.15)]'
                : 'bg-card border-border text-muted hover:text-white hover:border-white/20'
            }`}
          >
            <div className="font-display text-lg leading-none">{d.label}</div>
            <div className="text-[0.65rem] uppercase mt-1 text-muted/80">
              {d.type === 'train' ? d.workout : d.type === 'normo' ? 'Normo' : 'Off'}
            </div>
          </button>
        );
      })}
    </div>
  );
}
