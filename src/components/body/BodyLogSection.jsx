import { useState } from 'react';
import Card from '../ui/Card.jsx';
import BodyLogForm from './BodyLogForm.jsx';
import BodyLogHistory from './BodyLogHistory.jsx';
import BodyLogCharts from './BodyLogCharts.jsx';
import { useBodyLogStore } from '../../store/useBodyLogStore.js';

const TABS = [
  { id: 'form',    label: 'Nuevo snapshot' },
  { id: 'history', label: 'Historial' },
  { id: 'charts',  label: 'Evolución' },
];

export default function BodyLogSection() {
  const [tab, setTab] = useState('form');
  const [editing, setEditing] = useState(null);
  const count = useBodyLogStore((s) => s.entries.length);

  const startEdit = (entry) => {
    setEditing(entry);
    setTab('form');
  };

  return (
    <Card
      title="Bitácora corporal"
      right={<span className="text-xs text-muted font-mono">{count} snapshot{count !== 1 ? 's' : ''}</span>}
    >
      <p className="text-xs text-muted mb-4 max-w-2xl leading-relaxed">
        Sube la imagen del reporte de tu báscula de composición corporal y registra los valores.
        Cada snapshot se almacena con fecha y alimenta las gráficas de progresión automáticamente.
      </p>

      <div className="flex gap-1 border-b border-border mb-4">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); if (t.id !== 'form') setEditing(null); }}
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

      {tab === 'form' && (
        <BodyLogForm editing={editing} onDone={() => { setEditing(null); setTab('history'); }} />
      )}
      {tab === 'history' && <BodyLogHistory onEdit={startEdit} />}
      {tab === 'charts'  && <BodyLogCharts />}
    </Card>
  );
}
