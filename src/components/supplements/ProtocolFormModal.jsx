import { useEffect, useState } from 'react';
import Modal from '../ui/Modal.jsx';
import { SUPPLEMENT_UNITS, SUPPLEMENT_TIMING_PRESETS, SCHEDULE_PRESETS } from '../../lib/supplementsSeed.js';
import { DAYS } from '../../lib/constants.js';
import { ymd } from '../../lib/dates.js';

const EMPTY = {
  name: '',
  supplementId: '',
  doseAmount: 1,
  doseUnit: 'g',
  timing: 'mañana',
  daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
  startDate: ymd(new Date()),
  weeks: null,           // null = indefinido
  notes: '',
  active: true,
};

export default function ProtocolFormModal({ open, mode, initial, supplements, onClose, onSubmit }) {
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (open) {
      const base = { ...EMPTY, startDate: ymd(new Date()) };
      setForm(initial ? { ...base, ...initial, weeks: initial.weeks ?? null } : base);
    }
  }, [open, initial]);

  const upd = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  const toggleDay = (d) =>
    setForm((s) => {
      const cur = new Set(s.daysOfWeek || []);
      if (cur.has(d)) cur.delete(d);
      else cur.add(d);
      return { ...s, daysOfWeek: [...cur].sort((a, b) => a - b) };
    });

  const onSupplementChange = (id) => {
    setForm((s) => {
      const sup = supplements.find((x) => x.id === id);
      if (!sup) return { ...s, supplementId: id };
      // Auto-fill dose + timing + name from the supplement, if blank.
      return {
        ...s,
        supplementId: id,
        name: s.name || sup.name,
        doseAmount: sup.doseAmount || s.doseAmount,
        doseUnit: sup.doseUnit || s.doseUnit,
        timing: sup.timing || s.timing,
      };
    });
  };

  const submit = () => {
    if (!form.supplementId) return;
    onSubmit({
      ...form,
      name: (form.name || '').trim() || (supplements.find((x) => x.id === form.supplementId)?.name || 'Protocolo'),
      weeks: form.weeks == null || form.weeks === '' ? null : Number(form.weeks),
    });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={mode === 'edit' ? 'Editar protocolo' : 'Nuevo protocolo'} maxWidth="max-w-2xl">
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Nombre del protocolo">
            <input
              type="text"
              value={form.name}
              onChange={(e) => upd('name', e.target.value)}
              placeholder="ej. Carga creatina"
              autoFocus
            />
          </Field>
          <Field label="Suplemento *">
            <select value={form.supplementId} onChange={(e) => onSupplementChange(e.target.value)}>
              <option value="">— Selecciona —</option>
              {supplements.map((s) => (
                <option key={s.id} value={s.id}>{s.name}{s.brand ? ` · ${s.brand}` : ''}</option>
              ))}
            </select>
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
          <Field label="Horario de toma">
            <select value={form.timing} onChange={(e) => upd('timing', e.target.value)}>
              {SUPPLEMENT_TIMING_PRESETS.map((t) => (
                <option key={t.id} value={t.id}>{t.icon} {t.label}</option>
              ))}
            </select>
          </Field>
        </div>

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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Fecha de inicio">
            <input type="date" value={form.startDate} onChange={(e) => upd('startDate', e.target.value)} />
          </Field>
          <Field label="Duración">
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                value={form.weeks ?? ''}
                onChange={(e) => upd('weeks', e.target.value === '' ? null : Number(e.target.value))}
                placeholder="semanas"
                disabled={form.weeks == null}
                className="flex-1 disabled:opacity-50"
              />
              <span className="text-xs text-muted">sem.</span>
              <label className="flex items-center gap-1 text-xs text-muted cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.weeks == null}
                  onChange={(e) => upd('weeks', e.target.checked ? null : 4)}
                  className="!w-4 !h-4"
                />
                Indefinido
              </label>
            </div>
          </Field>
        </div>

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
          Activo (aparece en el checklist diario y cuenta para adherencia)
        </label>

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-border text-muted hover:text-white">
            Cancelar
          </button>
          <button
            onClick={submit}
            disabled={!form.supplementId}
            className="px-5 py-2 text-sm rounded-lg bg-accent text-black font-semibold hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {mode === 'edit' ? 'Actualizar' : 'Crear protocolo'}
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
