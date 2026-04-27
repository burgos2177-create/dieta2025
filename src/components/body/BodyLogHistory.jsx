import { useState } from 'react';
import Modal from '../ui/Modal.jsx';
import { useBodyLogStore } from '../../store/useBodyLogStore.js';
import { ALL_BODY_FIELDS } from '../../lib/bodyFields.js';
import { showToast } from '../ui/Toast.jsx';

export default function BodyLogHistory({ onEdit }) {
  const entries = useBodyLogStore((s) => s.entries);
  const deleteEntry = useBodyLogStore((s) => s.deleteEntry);
  const [viewing, setViewing] = useState(null);

  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));

  if (entries.length === 0) {
    return (
      <div className="text-sm text-muted text-center py-6 border border-dashed border-border rounded-lg">
        Aún no hay snapshots. Guarda el primero con el formulario.
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {sorted.map((e) => {
          const filledCount = ALL_BODY_FIELDS.filter((f) => e[f.key] != null).length;
          return (
            <div key={e.id} className="bg-white/[0.02] border border-border rounded-lg overflow-hidden flex flex-col">
              <div
                className="h-32 bg-white/[0.02] flex items-center justify-center cursor-pointer overflow-hidden"
                onClick={() => setViewing(e)}
              >
                {e.imageDataUrl ? (
                  <img src={e.imageDataUrl} alt={e.date} className="w-full h-full object-cover hover:scale-105 transition" />
                ) : (
                  <span className="text-4xl opacity-30">📄</span>
                )}
              </div>
              <div className="p-3 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-mono text-sm text-white">{e.date}</div>
                    <div className="text-[0.65rem] text-muted">{filledCount} métricas</div>
                  </div>
                  {e.peso != null && (
                    <div className="font-mono text-lg text-accent">{e.peso}<span className="text-xs text-muted">kg</span></div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 mt-2 text-[0.65rem] font-mono">
                  {e.grasaPct   != null && <Mini label="Grasa"     value={e.grasaPct + '%'} color="text-warn" />}
                  {e.masaMuscular != null && <Mini label="Músculo" value={e.masaMuscular + 'kg'} color="text-ok" />}
                  {e.imc        != null && <Mini label="IMC"       value={e.imc} color="text-accent" />}
                  {e.tmb        != null && <Mini label="TMB"       value={e.tmb} color="text-muted" />}
                </div>
                <div className="flex gap-1 mt-3 pt-2 border-t border-border/60 text-xs">
                  <button onClick={() => setViewing(e)} className="flex-1 py-1 text-muted hover:text-accent">👁 Ver</button>
                  <button onClick={() => onEdit?.(e)} className="flex-1 py-1 text-muted hover:text-accent">✏️ Editar</button>
                  <button
                    onClick={() => {
                      if (confirm('¿Eliminar este snapshot?')) {
                        deleteEntry(e.id);
                        showToast('🗑 Snapshot eliminado');
                      }
                    }}
                    className="flex-1 py-1 text-muted hover:text-bad"
                  >
                    🗑 Borrar
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Modal open={!!viewing} onClose={() => setViewing(null)} title={viewing ? 'Snapshot ' + viewing.date : ''} maxWidth="max-w-4xl">
        {viewing && <SnapshotDetail entry={viewing} />}
      </Modal>
    </>
  );
}

function Mini({ label, value, color }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted">{label}</span>
      <span className={color}>{value}</span>
    </div>
  );
}

function SnapshotDetail({ entry }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {entry.imageDataUrl ? (
        <img src={entry.imageDataUrl} alt="" className="w-full rounded-lg border border-border" />
      ) : (
        <div className="bg-white/[0.02] border border-border rounded-lg flex items-center justify-center p-12 text-4xl opacity-30">📄</div>
      )}
      <div className="space-y-3 text-sm max-h-[70vh] overflow-auto">
        {ALL_BODY_FIELDS.filter((f) => entry[f.key] != null).map((f) => (
          <div key={f.key} className="flex justify-between border-b border-border/40 pb-1">
            <span className="text-muted">{f.label}</span>
            <span className="font-mono text-white">
              {entry[f.key]}<span className="text-muted text-xs ml-1">{f.unit}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
