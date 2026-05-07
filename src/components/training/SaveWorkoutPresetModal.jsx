import { useEffect, useState } from 'react';
import Modal from '../ui/Modal.jsx';

export default function SaveWorkoutPresetModal({
  open, onClose, onSubmit, onOverwrite,
  exercises, dayLabel,
  existingPresets = [],
  matchingPresetId = null,    // preset that the day currently matches (prefill name)
}) {
  const [name, setName] = useState('');

  useEffect(() => {
    if (!open) return;
    const matched = existingPresets.find((p) => p.id === matchingPresetId);
    setName(matched ? matched.name : (dayLabel || ''));
  }, [open, dayLabel, matchingPresetId, existingPresets]);

  const empty = !exercises || exercises.length === 0;
  const totalVol = (exercises || []).reduce(
    (a, e) => a + (Number(e.reps) || 0) * (Number(e.sets) || 0) * (Number(e.weight) || 0), 0
  );

  // Find a preset whose name matches case-insensitively
  const trimmed = name.trim();
  const overwriteTarget = trimmed
    ? existingPresets.find((p) => p.name.toLowerCase() === trimmed.toLowerCase())
    : null;

  const submit = () => {
    if (!trimmed || empty) return;
    if (overwriteTarget) {
      onOverwrite(overwriteTarget.id, { name: trimmed, exercises });
    } else {
      onSubmit({ name: trimmed, exercises });
    }
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Guardar rutina como preset">
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
              <label className="text-xs uppercase tracking-wider text-muted font-display">Nombre del preset</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
                placeholder="ej. Pierna pesado, Pull volumen"
                autoFocus
                className="mt-1"
              />
              {overwriteTarget ? (
                <div className="text-[0.7rem] text-warn mt-1">
                  ⚠ Existe un preset con este nombre. Al guardar, se sobrescribirá con la rutina actual.
                </div>
              ) : (
                <div className="text-[0.7rem] text-muted/70 mt-1">
                  Se creará un preset nuevo con este nombre.
                </div>
              )}
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
                      <span className="text-white">{p.name}</span>
                      <span className="text-muted ml-2">
                        · {p.exercises.length} ejercicios
                      </span>
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
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-border text-muted hover:text-white"
          >
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
            title={overwriteTarget ? `Sobrescribir "${overwriteTarget.name}"` : 'Crear nuevo preset'}
          >
            {overwriteTarget ? `Sobrescribir "${overwriteTarget.name}"` : 'Crear preset'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
