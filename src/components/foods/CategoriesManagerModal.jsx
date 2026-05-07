import { useMemo, useState } from 'react';
import Modal from '../ui/Modal.jsx';

export default function CategoriesManagerModal({
  open, onClose,
  categories, foods,
  onAdd, onRename, onRemove,
}) {
  const [newLabel, setNewLabel] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState('');
  const [reassignFor, setReassignFor] = useState(null); // {id, label, count}
  const [reassignTo, setReassignTo] = useState('');

  const counts = useMemo(() => {
    const map = {};
    for (const f of foods) map[f.category] = (map[f.category] || 0) + 1;
    return map;
  }, [foods]);

  const submitAdd = () => {
    const t = newLabel.trim();
    if (!t) return;
    if (categories.some((c) => c.label.toLowerCase() === t.toLowerCase())) {
      return;
    }
    onAdd({ label: t });
    setNewLabel('');
  };

  const startEdit = (c) => {
    setEditingId(c.id);
    setDraft(c.label);
  };

  const commitEdit = () => {
    if (editingId && draft.trim()) onRename(editingId, draft);
    setEditingId(null);
    setDraft('');
  };

  const askDelete = (c) => {
    const count = counts[c.id] || 0;
    if (count === 0) {
      if (confirm(`¿Eliminar la categoría "${c.label}"?`)) onRemove(c.id);
      return;
    }
    setReassignFor({ id: c.id, label: c.label, count });
    const others = categories.filter((x) => x.id !== c.id);
    setReassignTo(others.find((x) => x.id === 'otro')?.id || others[0]?.id || '');
  };

  const confirmReassign = () => {
    if (!reassignFor || !reassignTo) return;
    onRemove(reassignFor.id, reassignTo);
    setReassignFor(null);
    setReassignTo('');
  };

  const close = () => {
    setEditingId(null);
    setDraft('');
    setReassignFor(null);
    setReassignTo('');
    setNewLabel('');
    onClose();
  };

  return (
    <Modal open={open} onClose={close} title="Gestionar categorías">
      <div className="space-y-4">
        {/* Add new */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submitAdd()}
            placeholder="Nueva categoría… ej. Bebidas, Postres"
            className="flex-1"
          />
          <button
            onClick={submitAdd}
            disabled={!newLabel.trim()}
            className="px-4 py-2 text-sm rounded-lg bg-accent text-black font-semibold hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ＋ Añadir
          </button>
        </div>

        {/* List */}
        <div className="divide-y divide-border rounded-lg border border-border max-h-[55vh] overflow-auto">
          {categories.map((c) => {
            const count = counts[c.id] || 0;
            const editing = editingId === c.id;
            return (
              <div key={c.id} className="px-3 py-2.5 flex items-center gap-2">
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
                    <div className="text-sm text-white truncate">{c.label}</div>
                  )}
                  <div className="text-[0.65rem] text-muted mt-0.5">
                    {count} alimento{count !== 1 ? 's' : ''} · id: <span className="font-mono">{c.id}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {editing ? (
                    <>
                      <button onClick={commitEdit} className="px-2 py-1 text-xs rounded bg-accent text-black font-semibold">OK</button>
                      <button onClick={() => { setEditingId(null); setDraft(''); }} className="px-2 py-1 text-xs rounded border border-border text-muted">✕</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => startEdit(c)} className="text-muted hover:text-accent px-2 py-1" title="Renombrar">✎</button>
                      <button
                        onClick={() => askDelete(c)}
                        disabled={categories.length <= 1}
                        className="text-muted hover:text-bad px-2 py-1 disabled:opacity-30 disabled:cursor-not-allowed"
                        title={categories.length <= 1 ? 'Debe quedar al menos una categoría' : 'Eliminar'}
                      >🗑</button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Reassign dialog (inline) */}
        {reassignFor && (
          <div className="bg-warn/10 border border-warn/40 rounded-lg p-3 space-y-3">
            <div className="text-sm text-white">
              <span className="text-warn">⚠</span>{' '}
              <strong>{reassignFor.label}</strong> tiene {reassignFor.count} alimento{reassignFor.count !== 1 ? 's' : ''}.
              Reasigna a otra categoría antes de eliminar:
            </div>
            <select
              value={reassignTo}
              onChange={(e) => setReassignTo(e.target.value)}
              className="w-full"
            >
              {categories.filter((c) => c.id !== reassignFor.id).map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setReassignFor(null); setReassignTo(''); }}
                className="px-3 py-1.5 text-sm rounded-lg border border-border text-muted hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={confirmReassign}
                disabled={!reassignTo}
                className="px-3 py-1.5 text-sm rounded-lg bg-bad text-white font-semibold hover:brightness-110 disabled:opacity-40"
              >
                Reasignar y eliminar
              </button>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            onClick={close}
            className="px-4 py-2 text-sm rounded-lg border border-border text-muted hover:text-white"
          >
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
}
