import { useState } from 'react';
import LogList from './LogList.jsx';
import WeeklyVolumeTable from './WeeklyVolumeTable.jsx';

const TABS = [
  { id: 'log',    label: 'Bitácora' },
  { id: 'volume', label: 'Volumen semanal' },
];

export default function ProgressionPage() {
  const [tab, setTab] = useState('log');
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl tracking-wider">BITÁCORA</h1>
        <p className="text-muted text-sm">Historial y progresión de cada ejercicio</p>
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

      {tab === 'log' && <LogList />}
      {tab === 'volume' && <WeeklyVolumeTable />}
    </div>
  );
}
