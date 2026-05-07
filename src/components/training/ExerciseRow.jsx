import { useMemo, useState, useEffect } from 'react';
import { MUSCLE_COLORS, MUSCLE_LABELS } from '../../lib/constants.js';
import { useTrainingStore } from '../../store/useTrainingStore.js';
import EquipmentWeightInput from './EquipmentWeightInput.jsx';

export default function ExerciseRow({ weekday, exIdx, ex, onEdit, onOpenLog, isFirst, isLast }) {
  const updateExerciseFields = useTrainingStore((s) => s.updateExerciseFields);
  const deleteExercise = useTrainingStore((s) => s.deleteExercise);
  const reorderExercise = useTrainingStore((s) => s.reorderExercise);
  const appendLog = useTrainingStore((s) => s.appendLog);
  const log = useTrainingStore((s) => s.log[ex.id] || []);

  const [local, setLocal] = useState({
    reps: ex.reps,
    sets: ex.sets,
    weight: Number(ex.weight) || 0,
    equipment: ex.equipment || 'manual',
    equipmentData: ex.equipmentData || { kg: Number(ex.weight) || 0 },
  });
  const [dirty, setDirty] = useState(false);

  // Sync from props if exercise changes (e.g. preset applied or week changed)
  useEffect(() => {
    setLocal({
      reps: ex.reps,
      sets: ex.sets,
      weight: Number(ex.weight) || 0,
      equipment: ex.equipment || 'manual',
      equipmentData: ex.equipmentData || { kg: Number(ex.weight) || 0 },
    });
    setDirty(false);
  }, [ex]);

  const vol = (Number(local.reps) || 0) * (Number(local.sets) || 0) * (Number(local.weight) || 0);

  const lastOther = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const prior = [...log].reverse().find((l) => l.date !== today);
    return prior || null;
  }, [log]);

  const storedVol = (Number(ex.reps) || 0) * (Number(ex.sets) || 0) * (Number(ex.weight) || 0);
  const delta = lastOther ? storedVol - lastOther.vol : 0;
  const deltaStr = delta === 0 ? '—' : (delta > 0 ? '+' : '') + delta.toFixed(1);
  const deltaTone = delta > 0 ? 'text-ok' : delta < 0 ? 'text-bad' : 'text-muted';
  const color = MUSCLE_COLORS[ex.muscle] || '#94a3b8';

  const upd = (field, value) => {
    setLocal((s) => ({ ...s, [field]: value }));
    setDirty(true);
  };

  const onWeightChange = (next) => {
    setLocal((s) => ({
      ...s,
      equipment: next.equipment,
      equipmentData: next.equipmentData,
      weight: next.weight,
    }));
    setDirty(true);
  };

  const register = () => {
    const reps = Number(local.reps) || 0;
    const sets = Number(local.sets) || 0;
    const kg = Number(local.weight) || 0;
    const newVol = reps * sets * kg;
    const today = new Date().toISOString().slice(0, 10);
    updateExerciseFields(weekday, exIdx, {
      reps, sets, weight: kg,
      equipment: local.equipment,
      equipmentData: local.equipmentData,
    });
    appendLog(ex.id, { date: today, reps, sets, weight: kg, vol: newVol });
    setDirty(false);
  };

  return (
    <tr className="border-t border-border hover:bg-white/[0.02]">
      <td className="py-2 pr-2 align-top">
        <div className="text-sm text-white leading-tight">{ex.name}</div>
        <div className="text-[0.65rem] text-muted mt-0.5">{ex.tech}</div>
      </td>
      <td className="py-2 px-1 align-top">
        <span
          className="inline-block px-2 py-0.5 rounded text-[0.65rem] font-medium"
          style={{ background: color + '22', color, border: `1px solid ${color}44` }}
        >
          {MUSCLE_LABELS[ex.muscle] || ex.muscle}
        </span>
      </td>
      <td className="py-2 px-1 w-16 align-top">
        <input
          type="number"
          value={local.reps}
          onChange={(e) => upd('reps', e.target.value)}
          className="!py-1 !px-1.5 text-sm text-center"
        />
      </td>
      <td className="py-2 px-1 w-16 align-top">
        <input
          type="number"
          value={local.sets}
          onChange={(e) => upd('sets', e.target.value)}
          className="!py-1 !px-1.5 text-sm text-center"
        />
      </td>
      <td className="py-2 px-1 align-top">
        <EquipmentWeightInput
          value={{ equipment: local.equipment, equipmentData: local.equipmentData, weight: local.weight }}
          onChange={onWeightChange}
        />
      </td>
      <td className="py-2 px-2 font-mono text-sm text-accent text-right w-20 align-top">{vol.toFixed(1)}</td>
      <td className={`py-2 px-2 font-mono text-xs text-right w-16 align-top ${deltaTone}`}>{deltaStr}</td>
      <td className="py-2 px-1 text-right whitespace-nowrap align-top">
        <button
          onClick={() => !isFirst && reorderExercise(weekday, exIdx, exIdx - 1)}
          disabled={isFirst}
          className="text-muted hover:text-accent px-1 disabled:opacity-20 disabled:cursor-default"
          title="Subir"
        >↑</button>
        <button
          onClick={() => !isLast && reorderExercise(weekday, exIdx, exIdx + 1)}
          disabled={isLast}
          className="text-muted hover:text-accent px-1 disabled:opacity-20 disabled:cursor-default"
          title="Bajar"
        >↓</button>
        <button
          onClick={register}
          title="Registrar en bitácora"
          className={`px-1 text-xs font-bold transition ${dirty ? 'text-accent hover:brightness-110' : 'text-muted hover:text-accent'}`}
        >✓</button>
        <button onClick={() => onOpenLog?.(ex)} className="text-muted hover:text-accent px-1" title="Bitácora">📈</button>
        <button onClick={() => onEdit?.(ex, exIdx)} className="text-muted hover:text-accent px-1" title="Editar">✏️</button>
        <button
          onClick={() => {
            if (confirm(`¿Quitar "${ex.name}" de esta sesión?\n\nSu historial en la bitácora se conserva.`))
              deleteExercise(weekday, exIdx);
          }}
          className="text-muted hover:text-bad px-1"
          title="Quitar de esta sesión"
        >✕</button>
      </td>
    </tr>
  );
}
