import { useEffect, useMemo, useState } from 'react';
import Modal from '../ui/Modal.jsx';

export default function ApplyWorkoutPresetModal({
  open, onClose, onApply,
  presets, dayLabel,
  defaultGym = '',
  defaultMesoWeek = null,
}) {
  const [selectedId, setSelectedId] = useState(null);
  const [mode, setMode] = useState('append');
  const [filterGym, setFilterGym] = useState('');
  const [filterWeek, setFilterWeek] = useState('');

  // When the modal opens, prime filters with current context
  useEffect(() => {
    if (open) {
      setFilterGym(defaultGym || '');
      setFilterWeek(defaultMesoWeek != null ? String(defaultMesoWeek) : '');
      setSelectedId(null);
      setMode('append');
    }
  }, [open, defaultGym, defaultMesoWeek]);

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

  const close = () => {
    setSelectedId(null);
    setMode('append');
    onClose();
  };

  const apply = () => {
    if (!selectedId) return;
    onApply(selectedId, mode);
    close();
  };

  return (
    <Modal open={open} onClose={close} title={`Aplicar rutina${dayLabel ? ` · ${dayLabel}` : ''}`} maxWidth="max-w-2xl">
      <div className="space-y-4">
        {presets.length === 0 ? (
          <div className="text-sm text-muted bg-white/[0.03] border border-border rounded-lg p-4 text-center">
            Aún no tienes presets de rutina guardados.
          </div>
        ) : (
          <>
            {/* Filters */}
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
                  Limpiar filtros
                </button>
              </div>
            </div>

            {/* List */}
            <div className="max-h-72 overflow-auto divide-y divide-border rounded-lg border border-border">
              {filtered.length === 0 && (
                <div className="text-sm text-muted text-center py-4">
                  Ningún preset coincide con los filtros.
                </div>
              )}
              {filtered.map((p) => {
                const totalVol = p.exercises.reduce(
                  (a, e) => a + (Number(e.reps) || 0) * (Number(e.sets) || 0) * (Number(e.weight) || 0), 0
                );
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedId(p.id)}
                    className={`w-full text-left px-3 py-2 hover:bg-white/5 transition ${
                      selectedId === p.id ? 'bg-accent/10' : ''
                    }`}
                  >
                    <div className="flex justify-between items-baseline gap-2">
                      <span className="text-sm text-white truncate">{p.name}</span>
                      <span className="font-mono text-xs text-accent shrink-0">{totalVol.toFixed(0)} kg vol</span>
                    </div>
                    <div className="text-[0.65rem] text-muted mt-0.5 flex flex-wrap gap-x-2">
                      <span>{p.exercises.length} ejercicio{p.exercises.length !== 1 ? 's' : ''}</span>
                      {p.gym && <span>· 🏋 {p.gym}</span>}
                      {p.mesoWeek != null && <span>· S{p.mesoWeek}</span>}
                      {p.bodyWeightKg != null && <span>· {p.bodyWeightKg}kg corp.</span>}
                    </div>
                  </button>
                );
              })}
            </div>

            <div>
              <div className="text-xs uppercase tracking-wider text-muted font-display mb-2">Modo</div>
              <div className="grid grid-cols-2 gap-2">
                <ModeBtn active={mode === 'append'} onClick={() => setMode('append')} label="Añadir" sub="Agrega al final" />
                <ModeBtn active={mode === 'replace'} onClick={() => setMode('replace')} label="Reemplazar" sub="Borra y pone solo el preset" />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={close} className="px-4 py-2 text-sm rounded-lg border border-border text-muted hover:text-white">
                Cancelar
              </button>
              <button
                onClick={apply}
                disabled={!selectedId}
                className="px-4 py-2 text-sm rounded-lg bg-accent text-black font-semibold hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Aplicar
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

function ModeBtn({ active, onClick, label, sub }) {
  return (
    <button
      onClick={onClick}
      className={`text-left px-3 py-2 rounded-lg border transition ${
        active
          ? 'border-accent bg-accent/10 text-white'
          : 'border-border text-muted hover:text-white hover:border-white/20'
      }`}
    >
      <div className="text-sm font-semibold">{label}</div>
      <div className="text-[0.65rem] opacity-80">{sub}</div>
    </button>
  );
}
