// Equipment definitions for training. Each type has a set of input fields and
// a `compute(data)` that returns canonical kg.
//
// Stored on each exercise:
//   - `equipment`: id of equipment type
//   - `equipmentData`: { [input.key]: number } raw inputs the user typed
//   - `weight`: derived canonical kg (computed via compute() — kept on the
//     exercise so volume calculations stay simple).

export const LB_TO_KG = 0.453592;
const round2 = (n) => Math.round(n * 100) / 100;

export const EQUIPMENT_TYPES = [
  {
    id: 'manual',
    label: 'Manual (kg directo)',
    short: 'Manual',
    inputs: [{ key: 'kg', label: 'kg', unit: 'kg', step: 0.1 }],
    compute: (d) => Number(d.kg) || 0,
  },
  {
    id: 'smith',
    label: 'Smith — lb × lado (barra +20 lb)',
    short: 'Smith',
    barLb: 20,
    inputs: [{ key: 'lbPorLado', label: 'lb × lado', unit: 'lb', step: 0.5 }],
    compute: (d) => ((Number(d.lbPorLado) || 0) * 2 + 20) * LB_TO_KG,
  },
  {
    id: 'olympic_bar',
    label: 'Barra olímpica — lb × lado (barra +45 lb)',
    short: 'Olímpica',
    barLb: 45,
    inputs: [{ key: 'lbPorLado', label: 'lb × lado', unit: 'lb', step: 0.5 }],
    compute: (d) => ((Number(d.lbPorLado) || 0) * 2 + 45) * LB_TO_KG,
  },
  {
    id: 'straight_bar',
    label: 'Barra recta — lb total',
    short: 'Barra',
    inputs: [{ key: 'lb', label: 'lb total', unit: 'lb', step: 0.5 }],
    compute: (d) => (Number(d.lb) || 0) * LB_TO_KG,
  },
  {
    id: 'dumbbell_kg',
    label: 'Mancuerna (kg) — × 1 o 2',
    short: 'Mc kg',
    inputs: [
      { key: 'kgPerDb', label: 'kg / unidad', unit: 'kg', step: 0.1 },
      { key: 'multiplier', label: '× unidades', type: 'multiplier', options: [1, 2] },
    ],
    compute: (d) => (Number(d.kgPerDb) || 0) * (Number(d.multiplier) || 1),
  },
  {
    id: 'dumbbell_lb',
    label: 'Mancuerna (lb) — × 1 o 2',
    short: 'Mc lb',
    inputs: [
      { key: 'lbPerDb', label: 'lb / unidad', unit: 'lb', step: 0.5 },
      { key: 'multiplier', label: '× unidades', type: 'multiplier', options: [1, 2] },
    ],
    compute: (d) => (Number(d.lbPerDb) || 0) * LB_TO_KG * (Number(d.multiplier) || 1),
  },
  {
    id: 'pulley_kg',
    label: 'Polea (kg) — × 1 o 2',
    short: 'Polea kg',
    inputs: [
      { key: 'kg', label: 'kg', unit: 'kg', step: 0.5 },
      { key: 'multiplier', label: '× lados', type: 'multiplier', options: [1, 2] },
    ],
    compute: (d) => (Number(d.kg) || 0) * (Number(d.multiplier) || 1),
  },
  {
    id: 'pulley_lb',
    label: 'Polea (lb) — × 1 o 2',
    short: 'Polea lb',
    inputs: [
      { key: 'lb', label: 'lb', unit: 'lb', step: 0.5 },
      { key: 'multiplier', label: '× lados', type: 'multiplier', options: [1, 2] },
    ],
    compute: (d) => (Number(d.lb) || 0) * LB_TO_KG * (Number(d.multiplier) || 1),
  },
  {
    id: 'machine_kg',
    label: 'Máquina (kg)',
    short: 'Máq kg',
    inputs: [{ key: 'kg', label: 'kg', unit: 'kg', step: 1 }],
    compute: (d) => Number(d.kg) || 0,
  },
  {
    id: 'machine_lb',
    label: 'Máquina (lb)',
    short: 'Máq lb',
    inputs: [{ key: 'lb', label: 'lb', unit: 'lb', step: 1 }],
    compute: (d) => (Number(d.lb) || 0) * LB_TO_KG,
  },
  {
    id: 'medicine_ball',
    label: 'Pelota medicinal (kg)',
    short: 'Pelota',
    inputs: [{ key: 'kg', label: 'kg', unit: 'kg', step: 0.5 }],
    compute: (d) => Number(d.kg) || 0,
  },
  {
    id: 'bodyweight',
    label: 'Peso corporal (peso del perfil + extra kg opcional)',
    short: 'Corporal',
    inputs: [{ key: 'extraKg', label: '+/- extra kg', unit: 'kg', step: 0.5 }],
    needsBodyweight: true,
    compute: (d, ctx) => (Number(ctx?.bodyweight) || 0) + (Number(d.extraKg) || 0),
  },
];

export const EQUIPMENT_BY_ID = Object.fromEntries(EQUIPMENT_TYPES.map((e) => [e.id, e]));

export function getEquipment(id) {
  return EQUIPMENT_BY_ID[id] || EQUIPMENT_BY_ID.manual;
}

export function computeWeightKg(equipmentId, equipmentData, ctx) {
  const eq = getEquipment(equipmentId);
  return round2(eq.compute(equipmentData || {}, ctx || {}));
}

/** Build sensible defaults for the inputs of an equipment type, optionally
 *  trying to preserve the current canonical kg (only when feasible).
 *  `ctx.bodyweight` is needed to back-compute extraKg for bodyweight equipment. */
export function defaultEquipmentData(equipmentId, currentKg = 0, ctx) {
  const eq = getEquipment(equipmentId);
  const data = {};
  for (const input of eq.inputs) {
    if (input.type === 'multiplier') data[input.key] = 1;
    else data[input.key] = 0;
  }
  // Where possible, preserve the canonical kg so switching equipment doesn't
  // erase the user's number.
  switch (equipmentId) {
    case 'manual':
    case 'machine_kg':
    case 'medicine_ball':
      data.kg = currentKg;
      break;
    case 'machine_lb':
      data.lb = round2(currentKg / LB_TO_KG);
      break;
    case 'straight_bar':
      data.lb = round2(currentKg / LB_TO_KG);
      break;
    case 'smith':
      data.lbPorLado = round2(((currentKg / LB_TO_KG) - 20) / 2);
      if (data.lbPorLado < 0) data.lbPorLado = 0;
      break;
    case 'olympic_bar':
      data.lbPorLado = round2(((currentKg / LB_TO_KG) - 45) / 2);
      if (data.lbPorLado < 0) data.lbPorLado = 0;
      break;
    case 'dumbbell_kg':
      data.kgPerDb = round2(currentKg / 2);
      data.multiplier = 2;
      break;
    case 'dumbbell_lb':
      data.lbPerDb = round2((currentKg / LB_TO_KG) / 2);
      data.multiplier = 2;
      break;
    case 'pulley_kg':
      data.kg = currentKg;
      data.multiplier = 1;
      break;
    case 'pulley_lb':
      data.lb = round2(currentKg / LB_TO_KG);
      data.multiplier = 1;
      break;
    case 'bodyweight': {
      // When switching to bodyweight, default to using just the profile weight
      // (extra = 0). The user can later add or subtract for weighted/assisted variants.
      data.extraKg = 0;
      break;
    }
  }
  return data;
}

/** Pretty input summary, e.g. "70 lb · ×1" for use in tooltips/PDF. */
export function formatEquipmentInput(equipmentId, data) {
  const eq = getEquipment(equipmentId);
  return eq.inputs.map((i) => {
    const v = data?.[i.key];
    if (i.type === 'multiplier') return `×${v ?? 1}`;
    return `${v ?? 0} ${i.unit}`;
  }).join(' · ');
}

/** Colloquial usage description telling the user *how* to load the equipment.
 *  Examples:
 *    smith → "60 lb por lado"
 *    dumbbell_lb (×2) → "30 lb × 2 mancuernas"
 *    bodyweight (+5) → "peso corporal + 5 kg" */
export function formatEquipmentUsage(equipmentId, data) {
  const d = data || {};
  switch (equipmentId) {
    case 'manual':
      return `${d.kg ?? 0} kg`;
    case 'smith':
      return `${d.lbPorLado ?? 0} lb por lado`;
    case 'olympic_bar':
      return `${d.lbPorLado ?? 0} lb por lado`;
    case 'straight_bar':
      return `${d.lb ?? 0} lb total`;
    case 'dumbbell_kg': {
      const m = Number(d.multiplier) || 1;
      return `${d.kgPerDb ?? 0} kg × ${m} mancuerna${m !== 1 ? 's' : ''}`;
    }
    case 'dumbbell_lb': {
      const m = Number(d.multiplier) || 1;
      return `${d.lbPerDb ?? 0} lb × ${m} mancuerna${m !== 1 ? 's' : ''}`;
    }
    case 'pulley_kg': {
      const m = Number(d.multiplier) || 1;
      return `${d.kg ?? 0} kg${m > 1 ? ` × ${m} poleas` : ' en polea'}`;
    }
    case 'pulley_lb': {
      const m = Number(d.multiplier) || 1;
      return `${d.lb ?? 0} lb${m > 1 ? ` × ${m} poleas` : ' en polea'}`;
    }
    case 'machine_kg':
      return `${d.kg ?? 0} kg en máquina`;
    case 'machine_lb':
      return `${d.lb ?? 0} lb en máquina`;
    case 'medicine_ball':
      return `pelota ${d.kg ?? 0} kg`;
    case 'bodyweight': {
      const e = Number(d.extraKg) || 0;
      if (e > 0) return `peso corporal + ${e} kg`;
      if (e < 0) return `peso corporal − ${Math.abs(e)} kg`;
      return `peso corporal`;
    }
    default:
      return formatEquipmentInput(equipmentId, data);
  }
}
