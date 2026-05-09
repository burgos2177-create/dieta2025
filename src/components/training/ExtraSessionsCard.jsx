import { useMemo, useState } from 'react';
import Card from '../ui/Card.jsx';
import ExtraSessionModal from './ExtraSessionModal.jsx';
import { useTrainingStore } from '../../store/useTrainingStore.js';
import { DAYS, extraSessionTypeMeta } from '../../lib/constants.js';
import { weekDates } from '../../lib/dates.js';
import { showToast } from '../ui/Toast.jsx';

export default function ExtraSessionsCard({ weekKey }) {
  const extraSessions = useTrainingStore((s) => s.extraSessions);
  const addExtraSession = useTrainingStore((s) => s.addExtraSession);
  const updateExtraSession = useTrainingStore((s) => s.updateExtraSession);
  const removeExtraSession = useTrainingStore((s) => s.removeExtraSession);

  const [editing, setEditing] = useState(null); // {mode, weekday, session?}

  const weekData = extraSessions?.[weekKey] || {};
  // List of [weekday, sessions[]] sorted Mon→Sun, only days with sessions
  const grouped = useMemo(() => {
    return Object.keys(weekData)
      .map((k) => ({ weekday: Number(k), sessions: weekData[k] || [] }))
      .filter((g) => g.sessions.length > 0)
      .sort((a, b) => a.weekday - b.weekday);
  }, [weekData]);

  const totals = useMemo(() => {
    let kcal = 0, count = 0, duration = 0;
    for (const g of grouped) {
      for (const s of g.sessions) {
        kcal += Number(s.kcal) || 0;
        duration += Number(s.durationMin) || 0;
        count++;
      }
    }
    return { kcal, count, duration };
  }, [grouped]);

  const dates = weekDates(weekKey);

  return (
    <Card pad={false}>
      <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-3">
        <div>
          <div className="font-display text-base text-white tracking-wide">OTRAS ACTIVIDADES</div>
          <div className="text-xs text-muted">
            {totals.count === 0
              ? 'Cardio, boxeo, anaeróbico, etc.'
              : <>
                  {totals.count} sesion{totals.count !== 1 ? 'es' : ''}
                  {totals.duration > 0 && <span> · {totals.duration} min</span>}
                  {totals.kcal > 0 && <span className="text-accent"> · {totals.kcal} kcal</span>}
                </>}
          </div>
        </div>
        <button
          onClick={() => setEditing({ mode: 'add' })}
          className="px-3 py-1.5 text-xs rounded-md bg-accent text-black font-semibold hover:brightness-110 whitespace-nowrap"
        >
          ＋ Registrar
        </button>
      </div>

      {grouped.length === 0 ? (
        <div className="px-4 py-6 text-center text-xs text-muted">
          Aún no hay actividades extra para esta semana.
        </div>
      ) : (
        <div className="divide-y divide-border">
          {grouped.map(({ weekday, sessions }) => {
            const date = dates[weekday];
            return (
              <div key={weekday} className="px-4 py-3">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="font-display text-sm text-white">{DAYS[weekday]?.name}</span>
                  <span className="text-[0.65rem] text-muted">{date.getDate()} {date.toLocaleDateString('es-MX', { month: 'short' })}</span>
                </div>
                <div className="space-y-1">
                  {sessions.map((s) => {
                    const meta = extraSessionTypeMeta(s.type);
                    return (
                      <div
                        key={s.id}
                        className="flex items-center gap-2 bg-white/[0.02] border border-border rounded-lg px-3 py-2"
                      >
                        <span className="text-lg">{meta.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-white">
                            {meta.label}
                            {s.durationMin > 0 && <span className="text-muted ml-2">· {s.durationMin} min</span>}
                            {s.kcal > 0 && <span className="text-accent ml-2 font-mono">· {s.kcal} kcal</span>}
                          </div>
                          {s.notes && <div className="text-[0.65rem] text-muted/80 mt-0.5">{s.notes}</div>}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => setEditing({ mode: 'edit', weekday, session: s })}
                            className="text-muted hover:text-accent px-2 py-1 text-xs"
                            title="Editar"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`¿Eliminar este ${meta.label.toLowerCase()}?`)) {
                                removeExtraSession(weekKey, weekday, s.id);
                                showToast('Actividad eliminada');
                              }
                            }}
                            className="text-muted hover:text-bad px-2 py-1 text-xs"
                            title="Eliminar"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ExtraSessionModal
        open={!!editing}
        mode={editing?.mode}
        initial={editing?.session ? { ...editing.session, weekday: editing.weekday } : null}
        weekKey={weekKey}
        defaultWeekday={editing?.weekday}
        onClose={() => setEditing(null)}
        onSubmit={(data) => {
          if (editing?.mode === 'edit') {
            updateExtraSession(weekKey, editing.weekday, editing.session.id, data);
            // If weekday changed, move the session
            if (data.weekday !== editing.weekday) {
              removeExtraSession(weekKey, editing.weekday, editing.session.id);
              addExtraSession(weekKey, data.weekday, data);
            }
            showToast('Actividad actualizada', 'ok');
          } else {
            addExtraSession(weekKey, data.weekday, data);
            showToast('Actividad registrada', 'ok');
          }
        }}
      />
    </Card>
  );
}
