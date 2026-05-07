import {
  EQUIPMENT_TYPES, getEquipment, computeWeightKg, defaultEquipmentData,
} from '../../lib/equipment.js';
import { useProfileStore } from '../../store/useProfileStore.js';

/**
 * Compact column-friendly editor for an exercise's weight.
 * Shows: equipment selector + 1-2 raw inputs + computed kg.
 *
 * value  = { equipment, equipmentData, weight }
 * onChange(next) where next is the same shape with updated values.
 */
export default function EquipmentWeightInput({ value, onChange, compact = true }) {
  const equipmentId = value?.equipment || 'manual';
  const eq = getEquipment(equipmentId);
  const data = value?.equipmentData || {};
  const profileWeight = useProfileStore((s) => Number(s.peso) || 0);
  const ctx = { bodyweight: profileWeight };

  const switchEquipment = (newId) => {
    const newData = defaultEquipmentData(newId, value?.weight || 0, ctx);
    onChange({
      equipment: newId,
      equipmentData: newData,
      weight: computeWeightKg(newId, newData, ctx),
    });
  };

  const updateField = (key, raw) => {
    const num = raw === '' ? 0 : Number(raw);
    const newData = { ...data, [key]: isFinite(num) ? num : 0 };
    onChange({
      equipment: equipmentId,
      equipmentData: newData,
      weight: computeWeightKg(equipmentId, newData, ctx),
    });
  };

  return (
    <div className={`flex flex-col ${compact ? 'gap-0.5' : 'gap-1'}`}>
      <select
        value={equipmentId}
        onChange={(e) => switchEquipment(e.target.value)}
        className={`!py-0.5 !px-1 ${compact ? 'text-[0.65rem]' : 'text-xs'} bg-card border border-border rounded`}
        title={eq.label}
      >
        {EQUIPMENT_TYPES.map((e) => (
          <option key={e.id} value={e.id}>{e.short}</option>
        ))}
      </select>

      <div className="flex gap-1 items-center">
        {eq.inputs.map((input) => {
          if (input.type === 'multiplier') {
            return (
              <select
                key={input.key}
                value={data[input.key] ?? 1}
                onChange={(e) => updateField(input.key, e.target.value)}
                className="!py-0.5 !px-1 text-xs w-12"
                title={input.label}
              >
                {input.options.map((o) => (
                  <option key={o} value={o}>×{o}</option>
                ))}
              </select>
            );
          }
          return (
            <div key={input.key} className="flex flex-col">
              <input
                type="number"
                step={input.step ?? 0.1}
                value={data[input.key] ?? ''}
                onChange={(e) => updateField(input.key, e.target.value)}
                className={`!py-0.5 !px-1 ${compact ? 'text-xs' : 'text-sm'} text-center w-16`}
                title={input.label}
              />
              <span className="text-[0.55rem] text-muted/80 text-center">{input.unit}</span>
            </div>
          );
        })}
      </div>

      <div className="text-[0.6rem] text-accent/80 font-mono whitespace-nowrap">
        = {(value?.weight ?? 0).toFixed(2)} kg
        {eq.needsBodyweight && profileWeight > 0 && (
          <span className="text-muted/70 ml-1">
            (corp. {profileWeight}{(data.extraKg || 0) !== 0 ? ` ${data.extraKg > 0 ? '+' : ''}${data.extraKg}` : ''})
          </span>
        )}
      </div>
    </div>
  );
}
