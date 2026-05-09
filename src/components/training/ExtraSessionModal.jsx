import { useEffect, useState } from 'react';
import Modal from '../ui/Modal.jsx';
import { DAYS, EXTRA_SESSION_TYPES } from '../../lib/constants.js';
import { weekDates, formatLongDate } from '../../lib/dates.js';

const EMPTY = {
  type: 'cardio',
  kcal: '',
  durationMin: '',
  notes: '',
  weekday: 0,
};

export default function ExtraSessionModal({
  open, mode, initial, onClose, onSubmit, weekKey, defaultWeekday,
}) {
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (open) {
      setForm(initial
        ? { ...EMPTY, ...initial, kcal: String(initial.kcal ?? ''), durationMin: String(initial.durationMin ?? '') }
        : { ...EMPTY, weekday: defaultWeekday ?? 0 });
    }
  }, [open, initial, defaultWeekday]);

  const upd = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  const submit = () => {
    onSubmit({
      weekday: Number(form.weekday) || 0,
      type: form.type,
      kcal: Number(form.kcal) || 0,
      durationMin: Number(form.durationMin) || 0,
      notes: form.notes,
    });
    onClose();
  };

  const dates = weekKey ? weekDates(weekKey) : null;

  return (
    <Modal open={open} onClose={onClose} title={mode === 'edit' ? 'Editar actividad' : 'Registrar otra actividad'} maxWidth="max-w-xl">
      <div className="space-y-4">
        {/* Day picker */}
        {!initial && (
          <Field label="Día">
            <div className="grid grid-cols-7 gap-1">
              {DAYS.map((d, i) => {
                const date = dates?.[i];
                const isOn = Number(form.weekday) === i;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => upd('weekday', i)}
                    className={`py-2 rounded-md border text-center transition ${
                      isOn
                        ? 'bg-accent/15 border-accent/40 text-accent'
                        : 'bg-card border-border text-muted hover:text-white hover:border-white/20'
                    }`}
                  >
                    <div className="font-display text-sm leading-none">{d.label}</div>
                    {date && <div className="text-[0.6rem] mt-0.5 opacity-70">{date.getDate()}</div>}
                  </button>
                );
              })}
            </div>
          </Field>
        )}
        {initial && (
          <div className="text-xs text-muted">
            {DAYS[Number(form.weekday) || 0]?.name}
            {dates && ` · ${formatLongDate(dates[Number(form.weekday) || 0])}`}
          </div>
        )}

        {/* Type picker */}
        <Field label="Tipo de actividad">
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-1">
            {EXTRA_SESSION_TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => upd('type', t.id)}
                className={`px-2 py-2 text-xs rounded border transition ${
                  form.type === t.id
                    ? 'border-accent bg-accent/10 text-white'
                    : 'border-border text-muted hover:text-white hover:border-white/20'
                }`}
              >
                <div className="text-base leading-none">{t.icon}</div>
                <div className="text-[0.65rem] mt-1">{t.label}</div>
              </button>
            ))}
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Duración (min)">
            <input
              type="number"
              min="0"
              value={form.durationMin}
              onChange={(e) => upd('durationMin', e.target.value)}
              placeholder="ej. 60"
            />
          </Field>
          <Field label="Kcal gastadas">
            <input
              type="number"
              min="0"
              value={form.kcal}
              onChange={(e) => upd('kcal', e.target.value)}
              placeholder="ej. 450"
            />
          </Field>
        </div>

        <Field label="Notas">
          <textarea value={form.notes} onChange={(e) => upd('notes', e.target.value)} rows={2} placeholder="Intensidad, lugar, etc." />
        </Field>

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-border text-muted hover:text-white">
            Cancelar
          </button>
          <button
            onClick={submit}
            className="px-5 py-2 text-sm rounded-lg bg-accent text-black font-semibold hover:brightness-110"
          >
            {mode === 'edit' ? 'Actualizar' : 'Registrar'}
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
