import { useEffect, useState } from 'react';
import Modal from '../ui/Modal.jsx';
import { SUPPLEMENT_UNITS, SUPPLEMENT_TIMING_PRESETS, SCHEDULE_PRESETS } from '../../lib/supplementsSeed.js';
import { DAYS } from '../../lib/constants.js';

const EMPTY = {
  name: '',
  brand: '',
  doseAmount: 1,
  doseUnit: 'g',
  timing: 'mañana',
  daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
  kcalPerDose: 0,
  notes: '',
  active: true,
};

export default function SupplementFormModal({ open, mode, initial, onClose, onSubmit }) {
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (open) setForm(initial ? { ...EMPTY, ...initial } : EMPTY);
  }, [open, initial]);

  const upd = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  const toggleDay = (d) => {
    setForm((s) => {
      const cur = new Set(s.daysOfWeek || []);
      if (cur.has(d)) cur.delete(d);
      else cur.add(d);
      return { ...s, daysOfWeek: [...cur].sort((a, b) => a - b) };
    });
  };

  const submit = () => {
    if (!form.name.trim()) return;
    onSubmit(form);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={mode === 'edit' ? 'Editar suplemento' : 'Nuevo suplemento'} maxWidth="max-w-xl">
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Nombre *">
            <input type="text" value={form.name} onChange={(e) => upd('name', e.target.value)} autoFocus />
          </Field>
          <Field label="Marca">
            <input type="text" value={form.brand} onChange={(e) => upd('brand', e.target.value)} />
          </Field>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Field label="Dosis">
            <input type="number" step="0.1" value={form.doseAmount} onChange={(e) => upd('doseAmount', Number(e.target.value) || 0)} />
          </Field>
          <Field label="Unidad">
            <select value={form.doseUnit} onChange={(e) => upd('doseUnit', e.target.value)}>
              {SUPPLEMENT_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </Field>
          <Field label="Kcal por dosis">
            <input type="number" value={form.kcalPerDose} onChange={(e) => upd('kcalPerDose', Number(e.target.value) || 0)} />
          </Field>
        </div>

        <Field label="Timing">
          <div className="grid grid-cols-4 gap-1">
            {SUPPLEMENT_TIMING_PRESETS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => upd('timing', t.id)}
                className={`px-2 py-1.5 text-xs rounded border transition ${
                  form.timing === t.id
                    ? 'border-accent bg-accent/10 text-white'
                    : 'border-border text-muted hover:text-white hover:border-white/20'
                }`}
              >
                <span className="mr-1">{t.icon}</span>{t.label}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Días de la semana">
          <div className="space-y-2">
            <div className="flex gap-1 flex-wrap">
              {Object.entries(SCHEDULE_PRESETS).map(([id, p]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => upd('daysOfWeek', p.days)}
                  className="px-2 py-1 text-[0.65rem] rounded border border-border text-muted hover:text-white hover:border-white/20"
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {DAYS.map((d, i) => {
                const on = (form.daysOfWeek || []).includes(i);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleDay(i)}
                    className={`py-1.5 text-xs rounded border transition ${
                      on
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-border text-muted hover:text-white hover:border-white/20'
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>
        </Field>

        <Field label="Notas">
          <textarea value={form.notes} onChange={(e) => upd('notes', e.target.value)} rows={2} />
        </Field>

        <label className="flex items-center gap-2 text-sm text-muted cursor-pointer">
          <input
            type="checkbox"
            checked={!!form.active}
            onChange={(e) => upd('active', e.target.checked)}
            className="!w-4 !h-4"
          />
          Activo (aparece en el checklist diario)
        </label>

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-border text-muted hover:text-white">
            Cancelar
          </button>
          <button
            onClick={submit}
            disabled={!form.name.trim()}
            className="px-5 py-2 text-sm rounded-lg bg-accent text-black font-semibold hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {mode === 'edit' ? 'Actualizar' : 'Crear'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <div className="text-[0.7rem] uppercase tracking-wider text-muted mb-1 font-display">{label}</div>
      {children}
    </label>
  );
}
