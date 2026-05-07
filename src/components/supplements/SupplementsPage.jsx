import { useState } from 'react';
import TodayChecklist from './TodayChecklist.jsx';
import SupplementLibrary from './SupplementLibrary.jsx';
import { useSupplementStore } from '../../store/useSupplementStore.js';

const TABS = [
  { id: 'today', label: 'Hoy' },
  { id: 'library', label: 'Biblioteca' },
];

export default function SupplementsPage() {
  const [tab, setTab] = useState('today');
  const totalActive = useSupplementStore((s) => s.library.filter((x) => x.active).length);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl tracking-wider">SUPLEMENTACIÓN</h1>
        <p className="text-muted text-sm">{totalActive} suplemento{totalActive !== 1 ? 's' : ''} activo{totalActive !== 1 ? 's' : ''}</p>
      </div>

      <div className="flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
              tab === t.id
                ? 'border-accent text-accent'
                : 'border-transparent text-muted hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'today' && <TodayChecklist />}
      {tab === 'library' && <SupplementLibrary />}
    </div>
  );
}
