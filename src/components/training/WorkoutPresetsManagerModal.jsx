import { useMemo, useState } from 'react';
import Modal from '../ui/Modal.jsx';

export default function WorkoutPresetsManagerModal({ open, onClose, presets, onRename, onRemove, onUpdate, onDuplicate, defaultMesoWeeks = 5 }) {
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({ name: '', gym: '', mesoWeek: '', bodyWeightKg: '' });
  const [duplicatingId, setDuplicatingId] = useState(null);
  const [dupDraft, setDupDraft] = useState({ name: '', mesoWeek: '' });
  const [filterGym, setFilterGym] = useState('');
  const [filterWeek, setFilterWeek] = useState('');

  const knownGyms = useMemo(
    () => [...new Set(presets.map((p) => (p.gym || '').trim()).filter(Boolean))].sort(),
    [presets]
  );
  const knownWeeks = useMemo(
    () => [...new Set(presets.map((p) => p.mesoWeek).filter((w) => w != null))].sort((a, b) => a - b),
    [presets]
  );

  const filtered = useMemo(() => {
    return presets.filter((p) => {
      if (filterGym && (p.gym || '').toLowerCase() !== filterGym.toLowerCase()) return false;
      if (filterWeek !== '' && Number(p.mesoWeek) !== Number(filterWeek)) return false;
      return true;
    });
  }, [presets, filterGym, filterWeek]);

  const startEdit = (p) => {
    setEditingId(p.id);
    setDraft({
      name: p.name,
      gym: p.gym || '',
      mesoWeek: p.mesoWeek != null ? String(p.mesoWeek) : '',
      bodyWeightKg: p.bodyWeightKg != null ? String(p.bodyWeightKg) : '',
    });
  };
  const cancelEdit = () => {
    setEditingId(null);
    setDraft({ name: '', gym: '', mesoWeek: '', bodyWeightKg: '' });
  };
  const commit = () => {
    if (!editingId) return;
    if (draft.name.trim()) onRename(editingId, draft.name);
    onUpdate(editingId, {
      gym: draft.gym.trim(),
      mesoWeek: draft.mesoWeek === '' ? null : Number(draft.mesoWeek),
      bodyWeightKg: draft.bodyWeightKg === '' ? null : Number(draft.bodyWeightKg),
    });
    cancelEdit();
  };

  const startDuplicate = (p) => {
    setDuplicatingId(p.id);
    const nextWeek = p.mesoWeek != null ? p.mesoWeek + 1 : 1;
    // Strip a trailing " S<n>" from name if present, then append the new one
    const baseName = p.name.replace(/\s*S\d+\s*$/i, '').trim();
    setDupDraft({ name: `${baseName} S${nextWeek}`, mesoWeek: String(nextWeek) });
  };
  const cancelDuplicate = () => { setDuplicatingId(null); setDupDraft({ name: '', mesoWeek: '' }); };
  const commitDuplicate = () => {
    if (!duplicatingId) return;
    onDuplicate(duplicatingId, {
      name: dupDraft.name.trim(),
      mesoWeek: dupDraft.mesoWeek === '' ? null : Number(dupDraft.mesoWeek),
    });
    cancelDuplicate();
  };

  return (
    <Modal open={open} onClose={onClose} title="Gestionar presets de rutina" maxWidth="max-w-2xl">
      <div className="space-y-4">
        {/* Filters */}
        {presets.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <div className="text-[0.65rem] uppercase tracking-wider text-muted mb-1 font-display">Gimnasio</div>
              <select value={filterGym} onChange={(e) => setFilterGym(e.target.value)} className="!py-1.5 text-sm">
                <option value="">Todos</option>
                {knownGyms.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <div className="text-[0.65rem] uppercase tracking-wider text-muted mb-1 font-display">Semana</div>
              <select value={filterWeek} onChange={(e) => setFilterWeek(e.target.value)} className="!py-1.5 text-sm">
                <option value="">Todas</option>
                {knownWeeks.map((w) => <option key={w} value={w}>Semana {w}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => { setFilterGym(''); setFilterWeek(''); }}
                className="text-xs px-2 py-1.5 rounded-md border border-border text-muted hover:text-white hover:border-white/20"
              >
                Limpiar
              </button>
            </div>
          </div>
        )}

        {/* List */}
        {presets.length === 0 ? (
          <div className="text-sm text-muted bg-white/[0.03] border border-border rounded-lg p-4 text-center">
            No hay presets de rutina guardados.
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-sm text-muted bg-white/[0.03] border border-border rounded-lg p-4 text-center">
            Ningún preset coincide con los filtros.
          </div>
        ) : (
          <div className="divide-y divide-border rounded-lg border border-border max-h-[55vh] overflow-auto">
            {filtered.map((p) => {
              const totalVol = p.exercises.reduce(
                (a, e) => a + (Number(e.reps) || 0) * (Number(e.sets) || 0) * (Number(e.weight) || 0), 0
              );
              const editing = editingId === p.id;
              return (
                <div key={p.id} className="px-3 py-2.5">
                  {editing ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={draft.name}
                        onChange={(e) => setDraft((s) => ({ ...s, name: e.target.value }))}
                        className="!py-1 !px-2 text-sm"
                        placeholder="Nombre"
                        autoFocus
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          value={draft.gym}
                          onChange={(e) => setDraft((s) => ({ ...s, gym: e.target.value }))}
                          className="!py-1 !px-2 text-xs"
                          placeholder="Gym"
                        />
                        <input
                          type="number"
                          value={draft.mesoWeek}
                          onChange={(e) => setDraft((s) => ({ ...s, mesoWeek: e.target.value }))}
                          className="!py-1 !px-2 text-xs"
                          placeholder="Semana"
                        />
                        <input
                          type="number"
                          step="0.1"
                          value={draft.bodyWeightKg}
                          onChange={(e) => setDraft((s) => ({ ...s, bodyWeightKg: e.target.value }))}
                          className="!py-1 !px-2 text-xs"
                          placeholder="kg corp."
                        />
                      </div>
                      <div className="flex justify-end gap-1">
                        <button onClick={cancelEdit} className="px-2 py-1 text-xs rounded border border-border text-muted">Cancelar</button>
                        <button onClick={commit} className="px-2 py-1 text-xs rounded bg-accent text-black font-semibold">Guardar</button>
                      </div>
                    </div>
                  ) : duplicatingId === p.id ? (
                    <div className="space-y-2">
                      <div className="text-[0.65rem] text-muted">
                        Duplicar <span className="text-white">{p.name}</span> manteniendo ejercicios, gym y peso corporal.
                      </div>
                      <div className="grid grid-cols-12 gap-2">
                        <input
                          type="text"
                          value={dupDraft.name}
                          onChange={(e) => setDupDraft((s) => ({ ...s, name: e.target.value }))}
                          className="col-span-8 !py-1 !px-2 text-sm"
                          placeholder="Nombre del preset copiado"
                          autoFocus
                        />
                        <select
                          value={dupDraft.mesoWeek}
                          onChange={(e) => setDupDraft((s) => ({ ...s, mesoWeek: e.target.value }))}
                          className="col-span-4 !py-1 !px-2 text-xs"
                        >
                          <option value="">Sin semana</option>
                          {Array.from({ length: defaultMesoWeeks }, (_, i) => (
                            <option key={i + 1} value={i + 1}>Semana {i + 1}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex justify-end gap-1">
                        <button onClick={cancelDuplicate} className="px-2 py-1 text-xs rounded border border-border text-muted">Cancelar</button>
                        <button
                          onClick={commitDuplicate}
                          disabled={!dupDraft.name.trim()}
                          className="px-2 py-1 text-xs rounded bg-accent text-black font-semibold disabled:opacity-40"
                        >
                          Crear copia
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-white truncate">{p.name}</div>
                        <div className="text-[0.65rem] text-muted mt-0.5 flex flex-wrap gap-x-2">
                          <span>{p.exercises.length} ej · {totalVol.toFixed(0)} kg vol</span>
                          {p.gym && <span>· 🏋 {p.gym}</span>}
                          {p.mesoWeek != null && <span>· S{p.mesoWeek}</span>}
                          {p.bodyWeightKg != null && <span>· {p.bodyWeightKg}kg corp.</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => startDuplicate(p)} className="text-muted hover:text-accent px-2 py-1" title="Copiar a otra semana">📋</button>
                        <button onClick={() => startEdit(p)} className="text-muted hover:text-accent px-2 py-1" title="Editar">✎</button>
                        <button
                          onClick={() => { if (confirm(`¿Eliminar preset "${p.name}"?`)) onRemove(p.id); }}
                          className="text-muted hover:text-bad px-2 py-1"
                          title="Eliminar"
                        >🗑</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-border text-muted hover:text-white">
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
}
