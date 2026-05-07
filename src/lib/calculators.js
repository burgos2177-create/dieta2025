// ==============================
// METABOLIC CALCULATIONS
// Harris-Benedict + Lyle McDonald cycling
// ==============================

/** Harris-Benedict BMR */
export function calcTMB(sexo, peso, altura, edad) {
  if (sexo === 'm') {
    return 66 + 13.7 * peso + 5 * altura - 6.75 * edad;
  }
  return 655 + 9.6 * peso + 1.8 * altura - 4.7 * edad;
}

/** Total Daily Energy Expenditure */
export function calcTDEE(tmb, act) {
  return tmb * act;
}

/** BMI */
export function calcIMC(peso, altura) {
  return peso / Math.pow(altura / 100, 2);
}

/**
 * Lyle McDonald weekly cycling
 * dayIdx 0-6 → L, M, Mi, J, V, S, D
 * D1,3,5 (idx 0,2,4) = alto  →  tdee × highPct/100
 * D2,4,6 (idx 1,3,5) = bajo  →  tdee × lowPct/100
 * D7     (idx 6)     = normo →  tdee
 */
export function kcalForDay(dayIdx, tdee, highPct, lowPct) {
  if (dayIdx === 6) return tdee;
  return dayIdx % 2 === 0 ? tdee * (highPct / 100) : tdee * (lowPct / 100);
}

/** Weekly average (3 high + 3 low + 1 normo) / 7 */
export function weeklyAvg(tdee, highPct, lowPct) {
  const high  = tdee * (highPct / 100);
  const low   = tdee * (lowPct  / 100);
  return (high * 3 + low * 3 + tdee) / 7;
}

/** Day type classification */
export function dayType(dayIdx) {
  if (dayIdx === 6) return 'normo';
  return dayIdx % 2 === 0 ? 'high' : 'low';
}

/**
 * Macros for a given kcal target and ratio (%)
 * carb & prot = 4 kcal/g · lip = 9 kcal/g
 */
export function macrosForKcal(kcal, carbPct, protPct, lipPct) {
  return {
    carbG:    Math.round((kcal * carbPct / 100) / 4),
    protG:    Math.round((kcal * protPct / 100) / 4),
    lipG:     Math.round((kcal * lipPct  / 100) / 9),
    carbKcal: Math.round(kcal * carbPct / 100),
    protKcal: Math.round(kcal * protPct / 100),
    lipKcal:  Math.round(kcal * lipPct  / 100),
  };
}

/** Recommended daily water intake (L) — ~35 ml/kg */
export function recommendedWater(peso) {
  return (peso * 35) / 1000;
}

/** Brzycki 1RM estimator */
export function estimate1RM(weight, reps) {
  if (reps <= 0) return 0;
  return weight / (1.0278 - 0.0278 * reps);
}

/** kg ↔ lb */
export const kgToLb = (kg) => kg * 2.20462;
export const lbToKg = (lb) => lb / 2.20462;

/** Compute macros for a given food at a given amount.
 *  Foods store nutrients per `servingSize` of the food. */
export function computeFoodMacros(food, amount) {
  if (!food || !amount) return { kcal: 0, prot: 0, carb: 0, fat: 0 };
  const ratio = amount / food.servingSize;
  return {
    kcal: food.kcal * ratio,
    prot: food.prot * ratio,
    carb: food.carb * ratio,
    fat:  food.fat  * ratio,
  };
}

/** All units available for a food: canonical first, then user-defined equivalences. */
export function getFoodUnits(food) {
  if (!food) return [];
  const units = [{ label: food.servingUnit, factor: 1, isCanonical: true }];
  for (const e of food.equivalences || []) {
    if (!e || !e.label) continue;
    units.push({ label: e.label, factor: Number(e.amount) || 0, isCanonical: false });
  }
  return units;
}

/** Resolve an equivalence (canonical or label) to canonical food units. */
export function toCanonicalAmount(food, amount, unit) {
  const a = Number(amount) || 0;
  if (!food || !a) return 0;
  if (!unit || unit === food.servingUnit) return a;
  const eq = (food.equivalences || []).find((e) => e.label === unit);
  if (!eq) return a;
  return a * (Number(eq.amount) || 0);
}

/** Sum an array of entries (foodId/amount) against the food DB */
export function sumEntries(entries, foodsById) {
  return entries.reduce(
    (acc, e) => {
      const f = foodsById[e.foodId];
      if (!f) return acc;
      const m = computeFoodMacros(f, e.amount);
      acc.kcal += m.kcal;
      acc.prot += m.prot;
      acc.carb += m.carb;
      acc.fat  += m.fat;
      return acc;
    },
    { kcal: 0, prot: 0, carb: 0, fat: 0 }
  );
}
