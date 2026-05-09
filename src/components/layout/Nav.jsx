import { useProfileStore } from '../../store/useProfileStore.js';

const TABS = [
  { id: 'dashboard',   label: 'Dashboard' },
  { id: 'nutrition',   label: 'Nutrición' },
  { id: 'foods',       label: 'Alimentos' },
  { id: 'training',    label: 'Entreno' },
  { id: 'progression', label: 'Bitácora' },
  { id: 'supplements', label: 'Supl.' },
  { id: 'profile',     label: 'Perfil' },
  { id: 'tools',       label: 'Herramientas' },
];

export default function Nav({ active, onChange }) {
  const nombre = useProfileStore((s) => s.nombre);
  const initial = (nombre || '?').trim().charAt(0).toUpperCase() || '?';
  return (
    <nav className="sticky top-0 z-30 bg-bg/85 backdrop-blur border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 py-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-cyan-600 flex items-center justify-center font-display text-black font-bold">
            {initial}
          </div>
          <span className="font-display text-xl tracking-wider">APP ENTRENAMIENTO</span>
        </div>
        <div className="flex-1 overflow-x-auto scrollbar-none [-webkit-overflow-scrolling:touch]">
          <div className="flex gap-1 py-2 w-max ml-auto pr-1">
            {TABS.map((t) => {
              const isActive = active === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => onChange(t.id)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md whitespace-nowrap transition ${
                    isActive
                      ? 'bg-accent/15 text-accent border border-accent/30'
                      : 'text-muted hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
