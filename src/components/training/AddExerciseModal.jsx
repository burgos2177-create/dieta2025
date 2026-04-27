import { useEffect, useState } from 'react';
import Modal from '../ui/Modal.jsx';
import { MUSCLE_LABELS, TR_DAYS_CONFIG } from '../../lib/constants.js';
import { useTrainingStore } from '../../store/useTrainingStore.js';

const EMPTY = { name: '', tech: '', muscle: 'CUAD', reps: 10, sets: 3, weight: 0 };

export default function AddExerciseModal({ open, onClose, onSave, dayIdx, initial }) {
  const library = useTrainingStore((s) => s.library);
  const addToLibrary = useTrainingStore((s) => s.addToLibrary);

  const [form, setForm] = useState(EMPTY);
  const [day, setDay] = useState(dayIdx ?? 0);
  const [libSearch, setLibSearch] = useState('');
  const [askLib, setAskLib] = useState(false); // mostrar prompt "¿agregar a biblioteca?"

  useEffect(() => {
    if (open) {
      setForm(initial ? { ...initial } : { ...EMPTY });
      setDay(dayIdx ?? 0);
      setLibSearch('');
      setAskLib(false);
    }
  }, [open, initial, dayIdx]);

  const upd = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  // Ejercicios de biblioteca para el músculo seleccionado
  const muscleLib = library.filter((e) => e.muscle === form.muscle);
  const filteredLib = libSearch
    ? muscleLib.filter((e) => e.name.toLowerCase().includes(libSearch.toLowerCase()))
    : muscleLib;

  const nameInLib = library.some(
    (e) => e.name.trim().toLowerCase() === form.name.trim().toLowerCase() && e.muscle === form.muscle
  );

  const selectFromLib = (ex) => {
    setForm((s) => ({ ...s, name: ex.name, tech: ex.tech || '' }));
    setLibSearch('');
  };

  const submit = () => {
    if (!form.name.trim()) return;
    // Nuevo ejercicio cuyo nombre no está en la biblioteca → preguntar
    if (!initial && !nameInLib) {
      setAskLib(true);
      return;
    }
    doSave();
  };

  const doSave = () => {
    onSave(day, { ...form, reps: Number(form.reps), sets: Number(form.sets), weight: Number(form.weight) });
    onClose();
  };

  const handleAskLib = (addIt) => {
    if (addIt) addToLibrary({ name: form.name.trim(), tech: form.tech.trim(), muscle: form.muscle });
    doSave();
  };

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Editar ejercicio' : 'Agregar ejercicio'}>
      {askLib ? (
        /* ── Prompt: ¿agregar a biblioteca? ── */
        <div className="space-y-4 py-1">
          <p className="text-sm text-muted leading-relaxed">
            <span className="text-white font-semibold">"{form.name}"</span> no está en tu biblioteca de ejercicios.
            ¿Quieres guardarlo para poder reutilizarlo en el futuro?
          </p>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => handleAskLib(false)}
              className="px-4 py-2 text-sm rounded-lg border border-border text-muted hover:text-white transition"
            >
              Solo esta vez
            </button>
            <button
              onClick={() => handleAskLib(true)}
              className="px-5 py-2 text-sm rounded-lg bg-accent text-black font-semibold hover:brightness-110 transition"
            >
              Guardar en biblioteca
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Día */}
          <Field label="Día">
            <select value={day} onChange={(e) => setDay(Number(e.target.value))} disabled={!!initial}>
              {TR_DAYS_CONFIG.map((d, i) => (
                <option key={i} value={i}>{d.label} · {d.focus}</option>
              ))}
            </select>
          </Field>

          {/* Músculo — va primero para filtrar la biblioteca */}
          <Field label="Músculo">
            <select
              value={form.muscle}
              onChange={(e) => { upd('muscle', e.target.value); setLibSearch(''); }}
            >
              {Object.keys(MUSCLE_LABELS).map((k) => (
                <option key={k} value={k}>{MUSCLE_LABELS[k]}</option>
              ))}
            </select>
          </Field>

          {/* Lista de biblioteca filtrada por músculo (solo al agregar) */}
          {!initial && muscleLib.length > 0 && (
            <div>
              <div className="text-[0.7rem] uppercase tracking-wider text-muted mb-1.5 flex items-center justify-between">
                <span>Biblioteca · {MUSCLE_LABELS[form.muscle]}</span>
                <span className="text-[0.65rem] normal-case">{muscleLib.length} ejercicios</span>
              </div>
              {muscleLib.length > 4 && (
                <input
                  type="text"
                  value={libSearch}
                  onChange={(e) => setLibSearch(e.target.value)}
                  placeholder="Filtrar biblioteca…"
                  className="mb-2 !py-1.5 text-sm"
                />
              )}
              <div className="max-h-40 overflow-y-auto space-y-1 pr-0.5">
                {filteredLib.map((ex) => (
                  <button
                    key={ex.id}
                    type="button"
                    onClick={() => selectFromLib(ex)}
                    className={`w-full text-left px-3 py-2 rounded-lg border text-sm transition ${
                      form.name === ex.name
                        ? 'border-accent/60 bg-accent/10 text-accent'
                        : 'border-border hover:border-accent/30 hover:bg-white/[0.04] text-white'
                    }`}
                  >
                    <span className="font-medium">{ex.name}</span>
                    {ex.tech && <span className="ml-2 text-[0.65rem] text-muted">{ex.tech}</span>}
                  </button>
                ))}
                {filteredLib.length === 0 && (
                  <p className="text-xs text-muted text-center py-2">Sin coincidencias</p>
                )}
              </div>
            </div>
          )}

          {/* Nombre */}
          <Field label="Nombre">
            <input
              type="text"
              value={form.name}
              onChange={(e) => upd('name', e.target.value)}
              placeholder="Nombre del ejercicio"
            />
          </Field>

          {/* Técnica */}
          <Field label="Técnica">
            <input
              type="text"
              value={form.tech}
              onChange={(e) => upd('tech', e.target.value)}
              placeholder="Ej: Rest Pause, Cluster, Tempo 4-1-1…"
            />
          </Field>

          {/* Reps / Sets / Peso */}
          <div className="grid grid-cols-3 gap-3">
            <Field label="Reps">
              <input type="number" min="1" value={form.reps} onChange={(e) => upd('reps', e.target.value)} />
            </Field>
            <Field label="Sets">
              <input type="number" min="1" value={form.sets} onChange={(e) => upd('sets', e.target.value)} />
            </Field>
            <Field label="Peso (kg)">
              <input type="number" step="0.1" min="0" value={form.weight} onChange={(e) => upd('weight', e.target.value)} />
            </Field>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg border border-border text-muted hover:text-white transition"
            >
              Cancelar
            </button>
            <button
              onClick={submit}
              className="px-5 py-2 text-sm rounded-lg bg-accent text-black font-semibold hover:brightness-110 transition"
            >
              {initial ? 'Actualizar' : 'Agregar'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <div className="text-[0.7rem] uppercase tracking-wider text-muted mb-1">{label}</div>
      {children}
    </label>
  );
}
