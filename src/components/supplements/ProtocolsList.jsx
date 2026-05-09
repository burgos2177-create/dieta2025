import { useMemo, useState } from 'react';
import Card from '../ui/Card.jsx';
import ProtocolFormModal from './ProtocolFormModal.jsx';
import {
  useSupplementStore,
  getProtocolAdherence,
  getProtocolWeekInfo,
  isProtocolActiveOn,
} from '../../store/useSupplementStore.js';
import { ymd } from '../../lib/dates.js';
import { timingMeta } from '../../lib/supplementsSeed.js';
import { DAYS } from '../../lib/constants.js';
import { showToast } from '../ui/Toast.jsx';

export default function ProtocolsList() {
  const protocols = useSupplementStore((s) => s.protocols);
  const library = useSupplementStore((s) => s.library);
  const intake = useSupplementStore((s) => s.intake);
  const addProtocol = useSupplementStore((s) => s.addProtocol);
  const updateProtocol = useSupplementStore((s) => s.updateProtocol);
  const removeProtocol = useSupplementStore((s) => s.removeProtocol);

  const [editing, setEditing] = useState(null); // null | { mode, protocol? }

  const today = ymd(new Date());

  // Sort: active first, then by start date desc
  const sorted = useMemo(
    () =>
      [...protocols].sort((a, b) => {
        const aActive = a.active ? 1 : 0;
        const bActive = b.active ? 1 : 0;
        if (bActive !== aActive) return bActive - aActive;
        return (b.startDate || '').localeCompare(a.startDate || '');
      }),
    [protocols]
  );

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted">
            Cada protocolo combina un suplemento con su programación temporal:
            días, horario, dosis y duración. La adherencia muestra qué tan
            consistente has sido vs lo programado.
          </div>
          <button
            onClick={() => setEditing({ mode: 'add' })}
            className="px-4 py-2 text-sm rounded-lg bg-accent text-black font-semibold hover:brightness-110 ml-3 whitespace-nowrap"
          >
            ＋ Nuevo protocolo
          </button>
        </div>
      </Card>

      {sorted.length === 0 ? (
        <Card>
          <div className="text-sm text-muted text-center py-6">
            No tienes protocolos.
            <div className="text-xs mt-1 opacity-80">
              Crea uno para programar la toma de un suplemento por un periodo (semanas o indefinido).
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {sorted.map((p) => {
            const sup = library.find((s) => s.id === p.supplementId);
            const adherence = getProtocolAdherence(p, intake);
            const weekInfo = getProtocolWeekInfo(p, today);
            const meta = timingMeta(p.timing);
            const dayLabels = (p.daysOfWeek || []).map((d) => DAYS[d]?.label).join(' ');
            const activeToday = isProtocolActiveOn(p, today);
            const periodEnded =
              p.weeks != null && weekInfo && weekInfo.current > p.weeks;

            return (
              <Card key={p.id} pad={false} className={!p.active ? 'opacity-60' : ''}>
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-display text-base text-white truncate">{p.name}</div>
                      <div className="text-xs text-muted truncate">
                        {sup ? sup.name : <span className="text-bad">Suplemento eliminado</span>}
                        {sup?.brand && <span> · {sup.brand}</span>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono text-sm text-accent">{p.doseAmount} {p.doseUnit}</div>
                      <div className="text-[0.65rem] text-muted">{meta.icon} {meta.label}</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 text-[0.65rem]">
                    <span className="bg-white/[0.03] border border-border rounded px-1.5 py-0.5 text-muted">
                      {dayLabels || '—'}
                    </span>
                    <span className="bg-white/[0.03] border border-border rounded px-1.5 py-0.5 text-muted">
                      {p.startDate}
                    </span>
                    {p.weeks == null ? (
                      <span className="bg-white/[0.03] border border-border rounded px-1.5 py-0.5 text-muted">
                        ∞ indefinido
                      </span>
                    ) : (
                      <span className="bg-white/[0.03] border border-border rounded px-1.5 py-0.5 text-muted">
                        {p.weeks} semana{p.weeks !== 1 ? 's' : ''}
                      </span>
                    )}
                    {!p.active && (
                      <span className="bg-white/[0.03] border border-warn/40 rounded px-1.5 py-0.5 text-warn">
                        pausado
                      </span>
                    )}
                    {p.active && periodEnded && (
                      <span className="bg-white/[0.03] border border-bad/40 rounded px-1.5 py-0.5 text-bad">
                        finalizado
                      </span>
                    )}
                    {p.active && !periodEnded && weekInfo && (
                      <span className="bg-accent/[0.05] border border-accent/40 rounded px-1.5 py-0.5 text-accent">
                        {weekInfo.indefinite ? `Sem ${weekInfo.current}` : `Sem ${weekInfo.current}/${weekInfo.total}`}
                      </span>
                    )}
                    {activeToday && p.active && (
                      <span className="bg-ok/[0.05] border border-ok/40 rounded px-1.5 py-0.5 text-ok">
                        ● hoy
                      </span>
                    )}
                  </div>

                  {p.notes && <div className="text-[0.7rem] text-muted/80 italic">{p.notes}</div>}

                  {/* Adherence */}
                  <div className="pt-2 border-t border-border space-y-1">
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="text-[0.65rem] uppercase tracking-wider text-muted font-display">
                        Adherencia
                      </span>
                      <span className="font-mono">
                        <span className={adherence.ratio >= 0.9 ? 'text-ok' : adherence.ratio >= 0.6 ? 'text-warn' : 'text-bad'}>
                          {(adherence.ratio * 100).toFixed(0)}%
                        </span>
                        <span className="text-muted/70 ml-1">
                          ({adherence.taken}/{adherence.scheduled})
                        </span>
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          adherence.ratio >= 0.9 ? 'bg-ok' : adherence.ratio >= 0.6 ? 'bg-warn' : 'bg-bad'
                        }`}
                        style={{ width: `${Math.min(100, adherence.ratio * 100)}%` }}
                      />
                    </div>
                    {adherence.missed > 0 && (
                      <div className="text-[0.6rem] text-muted/70">
                        {adherence.missed} día{adherence.missed !== 1 ? 's' : ''} no registrado{adherence.missed !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-border px-4 py-2 flex justify-end gap-3 text-xs">
                  <button
                    onClick={() => updateProtocol(p.id, { active: !p.active })}
                    className="text-muted hover:text-accent"
                  >
                    {p.active ? '⏸ Pausar' : '▶ Activar'}
                  </button>
                  <button
                    onClick={() => setEditing({ mode: 'edit', protocol: p })}
                    className="text-muted hover:text-accent"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`¿Eliminar protocolo "${p.name}"?\n\nLos registros de toma se conservan.`)) {
                        removeProtocol(p.id);
                        showToast('Protocolo eliminado');
                      }
                    }}
                    className="text-muted hover:text-bad"
                  >
                    🗑 Eliminar
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <ProtocolFormModal
        open={!!editing}
        mode={editing?.mode}
        initial={editing?.protocol}
        supplements={library}
        onClose={() => setEditing(null)}
        onSubmit={(data) => {
          if (editing?.mode === 'edit') {
            updateProtocol(editing.protocol.id, data);
            showToast('Protocolo actualizado', 'ok');
          } else {
            addProtocol(data);
            showToast('Protocolo creado', 'ok');
          }
        }}
      />
    </div>
  );
}
