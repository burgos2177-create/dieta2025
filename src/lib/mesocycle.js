import { addWeeks, weeksBetween } from './dates.js';

export const DAY_TYPES = ['high', 'low', 'normo'];

export const DAY_TYPE_LABEL = {
  high: 'Alto',
  low: 'Bajo',
  normo: 'Normo',
};

/** Phase label for week N of an L-week mesocycle. */
export function mesoPhaseLabel(weekNumber, length) {
  if (weekNumber < 1 || weekNumber > length) return '';
  // Last week → deload; second-to-last → peak; first → introducción; else → progresión
  if (weekNumber === length) return 'Descarga';
  if (weekNumber === length - 1) return 'Pico de volumen';
  if (weekNumber === 1) return 'Introducción';
  if (length >= 5 && weekNumber === length - 2) return 'Intensificación';
  return 'Acumulación';
}

/** Returns { meso, weekNumber, phase } for the mesocycle covering weekKey, or null. */
export function getMesoInfoForWeek(mesocycles, activeId, weekKey) {
  const meso = (mesocycles || []).find((m) => m.id === activeId);
  if (!meso || !meso.startWeek) return null;
  const wn = weeksBetween(meso.startWeek, weekKey) + 1;
  if (wn < 1 || wn > meso.weeks) return null;
  return { meso, weekNumber: wn, phase: mesoPhaseLabel(wn, meso.weeks) };
}

/** Inclusive end-week key of a mesocycle (Monday of last week). */
export function mesoEndWeek(meso) {
  return addWeeks(meso.startWeek, meso.weeks - 1);
}

/** Materialize a day plan from mesocycle config: for each meal, expand its preset id into entries. */
export function materializeMesoDay(meso, dayTypeStr, meals, presetsById) {
  const out = {};
  const plans = meso.plans?.[dayTypeStr] || {};
  for (const m of meals) {
    const presetId = plans[m.id];
    const preset = presetId ? presetsById[presetId] : null;
    out[m.id] = preset ? preset.entries.map((e) => ({ ...e })) : [];
  }
  return out;
}

export function newMesocycle({ name = 'Mesociclo', startWeek, weeks = 5, startWeight = 0 } = {}) {
  return {
    id: `meso_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    name,
    startWeek,
    weeks,
    startWeight,
    plans: { high: {}, low: {}, normo: {} },
    createdAt: Date.now(),
  };
}
