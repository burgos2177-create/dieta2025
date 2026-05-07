import { useState } from 'react';
import Modal from '../ui/Modal.jsx';
import { sumEntries } from '../../lib/calculators.js';

export default function PresetsManagerModal({ open, onClose, presets, foodsById, onRename, onRemove }) {
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState('');

  const startEdit = (p) => {
    setEditingId(p.id);
    setDraft(p.name);
  };

  const commitEdit = () => {
    if (editingId && draft.trim()) onRename(editingId, draft);
    setEditingId(null);
    setDraft('');
  };

  return (
    <Modal open={open} onClose={onClose} title="Gestionar presets">
      {presets.length === 0 ? (
        <div className="text-sm text-muted bg-white/[0.03] border border-border rounded-lg p-4 text-center">
          No hay presets guardados.
        </div>
      ) : (
        <div className="divide-y divide-border rounded-lg border border-border max-h-[60vh] overflow-auto">
          {presets.map((p) => {
            const t = sumEntries(p.entries, foodsById);
            const editing = editingId === p.id;
            return (
              <div key={p.id} className="px-3 py-2.5 flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  {editing ? (
                    <input
                      type="text"
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitEdit();
                        if (e.key === 'Escape') { setEditingId(null); setDraft(''); }
                      }}
                      autoFocus
                      className="!py-1 !px-2 text-sm"
                    />
                  ) : (
                    <div className="text-sm text-white truncate">{p.name}</div>
                  )}
                  <div className="text-[0.65rem] text-muted mt-0.5">
                    {p.entries.length} alimentos · {t.kcal.toFixed(0)} kcal · P {t.prot.toFixed(0)}g · CH{' '}
                    {t.carb.toFixed(0)}g · G {t.fat.toFixed(0)}g
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {editing ? (
                    <>
                      <button
                        onClick={commitEdit}
                        className="px-2 py-1 text-xs rounded bg-accent text-black font-semibold"
                      >
                        OK
                      </button>
                      <button
                        onClick={() => { setEditingId(null); setDraft(''); }}
                        className="px-2 py-1 text-xs rounded border border-border text-muted"
                      >
                        ✕
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEdit(p)}
                        className="text-muted hover:text-accent px-2 py-1"
                        aria-label="Renombrar"
                        title="Renombrar"
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`¿Eliminar preset "${p.name}"?`)) onRemove(p.id);
                        }}
                        className="text-muted hover:text-bad px-2 py-1"
                        aria-label="Eliminar"
                        title="Eliminar"
                      >
                        🗑
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex justify-end pt-4">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm rounded-lg border border-border text-muted hover:text-white"
        >
          Cerrar
        </button>
      </div>
    </Modal>
  );
}
