import { useEffect, useMemo, useState } from 'react';
import Modal from '../ui/Modal.jsx';

export default function SaveWorkoutPresetModal({
  open, onClose, onSubmit, onOverwrite,
  exercises, dayLabel,
  existingPresets = [],
  matchingPresetId = null,
  defaultGym = '',
  defaultMesoWeek = null,
  defaultBodyWeightKg = null,
  defaultMesoWeeks = 5, // length of active meso (used for week dropdown)
}) {
  const [name, setName] = useState('');
  const [gym, setGym] = useState('');
  const [mesoWeek, setMesoWeek] = useState(null);
  const [bw, setBw] = useState('');

  useEffect(() => {
    if (!open) return;
    const matched = existingPresets.find((p) => p.id === matchingPresetId);
    if (matched) {
      setName(matched.name);
      setGym(matched.gym || defaultGym || '');
      setMesoWeek(matched.mesoWeek ?? defaultMesoWeek);
      setBw(matched.bodyWeightKg != null ? String(matched.bodyWeightKg) : (defaultBodyWeightKg != null ? String(defaultBodyWeightKg) : ''));
    } else {
      setName(dayLabel || '');
      setGym(defaultGym || '');
      setMesoWeek(defaultMesoWeek);
      setBw(defaultBodyWeightKg != null ? String(defaultBodyWeightKg) : '');
    }
  }, [open, dayLabel, matchingPresetId, existingPresets, defaultGym, defaultMesoWeek, defaultBodyWeightKg]);

  const empty = !exercises || exercises.length === 0;
  const totalVol = (exercises || []).reduce(
    (a, e) => a + (Number(e.reps) || 0) * (Number(e.sets) || 0) * (Number(e.weight) || 0), 0
  );

  // List of unique gyms for the datalist autocomplete
  const knownGyms = useMemo(
    () => [...new Set(existingPresets.map((p) => (p.gym || '').trim()).filter(Boolean))].sort(),
    [existingPresets]
  );

  const trimmed = name.trim();
  const overwriteTarget = trimmed
    ? existingPresets.find((p) => p.name.toLowerCase() === trimmed.toLowerCase())
    : null;

  const submit = () => {
    if (!trimmed || empty) return;
    const payload = {
      name: trimmed,
      exercises,
      gym: gym.trim(),
      mesoWeek: mesoWeek == null || mesoWeek === '' ? null : Number(mesoWeek),
      bodyWeightKg: bw === '' ? null : Number(bw),
    };
    if (overwriteTarget) onOverwrite(overwriteTarget.id, payload);
    else onSubmit(payload);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Guardar rutina como preset" maxWidth="max-w-xl">
      <div className="space-y-4">
        {empty ? (
          <div className="text-sm text-muted bg-white/[0.03] border border-border rounded-lg p-3">
            Esta rutina no tiene ejercicios. Añade alguno antes de guardar como preset.
          </div>
        ) : (
          <>
            <div className="text-xs text-muted bg-white/[0.03] border border-border rounded-lg p-3">
              <div className="font-mono">
                <span className="text-accent">{totalVol.toFixed(0)} kg vol</span>
                {' · '}
                {exercises.length} ejercicio{exercises.length !== 1 ? 's' : ''}
              </div>
            </div>

            <div>
              <label className="text-xs uppercase tracking-wider text-muted font-display">Nombre</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
                placeholder="ej. Pierna pesado"
                autoFocus
                className="mt-1"
              />
              {overwriteTarget ? (
                <div className="text-[0.7rem] text-warn mt-1">
                  ⚠ Existe un preset con este nombre. Al guardar, se sobrescribirá.
                </div>
              ) : (
                <div className="text-[0.7rem] text-muted/70 mt-1">
                  Se creará un preset nuevo con este nombre.
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs uppercase tracking-wider text-muted font-display">Gimnasio</label>
                <input
                  type="text"
                  list="gym-list"
                  value={gym}
                  onChange={(e) => setGym(e.target.value)}
                  placeholder="ej. Sirioné"
                  className="mt-1"
                />
                <datalist id="gym-list">
                  {knownGyms.map((g) => <option key={g} value={g} />)}
                </datalist>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-muted font-display">
                  Semana del meso
                </label>
                <select
                  value={mesoWeek ?? ''}
                  onChange={(e) => setMesoWeek(e.target.value === '' ? null : Number(e.target.value))}
                  className="mt-1"
                >
                  <option value="">— Sin asignar —</option>
                  {Array.from({ length: defaultMesoWeeks }, (_, i) => (
                    <option key={i + 1} value={i + 1}>Semana {i + 1}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-muted font-display">
                  Peso corporal (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={bw}
                  onChange={(e) => setBw(e.target.value)}
                  placeholder="ej. 67.4"
                  className="mt-1"
                />
              </div>
            </div>

            {existingPresets.length > 0 && (
              <div>
                <div className="text-[0.7rem] uppercase tracking-wider text-muted mb-1.5">
                  Presets existentes
                </div>
                <div className="max-h-40 overflow-auto divide-y divide-border rounded-lg border border-border">
                  {existingPresets.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setName(p.name)}
                      className={`w-full text-left px-3 py-1.5 text-xs hover:bg-white/5 ${
                        overwriteTarget?.id === p.id ? 'bg-accent/10' : ''
                      }`}
                    >
                      <div className="text-white">{p.name}</div>
                      <div className="text-muted text-[0.6rem]">
                        {p.exercises.length} ej · {[
                          p.gym && `🏋 ${p.gym}`,
                          p.mesoWeek != null && `S${p.mesoWeek}`,
                          p.bodyWeightKg != null && `${p.bodyWeightKg}kg`,
                        ].filter(Boolean).join(' · ') || 'sin metadata'}
                      </div>
                    </button>
                  ))}
                </div>
                <div className="text-[0.65rem] text-muted/70 mt-1">
                  Click en un preset para autocompletar el nombre y sobrescribirlo.
                </div>
              </div>
            )}
          </>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-border text-muted hover:text-white">
            Cancelar
          </button>
          <button
            onClick={submit}
            disabled={empty || !trimmed}
            className={`px-4 py-2 text-sm rounded-lg font-semibold disabled:opacity-40 disabled:cursor-not-allowed ${
              overwriteTarget
                ? 'bg-warn text-black hover:brightness-110'
                : 'bg-accent text-black hover:brightness-110'
            }`}
          >
            {overwriteTarget ? `Sobrescribir "${overwriteTarget.name}"` : 'Crear preset'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
