// Seed library of common supplements as starting examples.
export const SEED_SUPPLEMENTS = [
  {
    id: 'sup_creatina',
    name: 'Creatina monohidrato',
    brand: '',
    doseAmount: 5, doseUnit: 'g',
    timing: 'mañana',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    kcalPerDose: 0,
    notes: 'Disolver en agua. Diaria, sin descanso.',
    active: true,
  },
  {
    id: 'sup_whey',
    name: 'Proteína whey',
    brand: '',
    doseAmount: 1, doseUnit: 'scoop',
    timing: 'post-entreno',
    daysOfWeek: [0, 2, 4],
    kcalPerDose: 110,
    notes: '',
    active: true,
  },
  {
    id: 'sup_omega3',
    name: 'Omega 3',
    brand: '',
    doseAmount: 1, doseUnit: 'cápsula',
    timing: 'comida',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    kcalPerDose: 0,
    notes: '',
    active: true,
  },
];

export const SUPPLEMENT_UNITS = ['g', 'mg', 'mcg', 'ml', 'scoop', 'cápsula', 'gota', 'tableta', 'sobre'];

export const SUPPLEMENT_TIMING_PRESETS = [
  { id: 'mañana',       label: 'Mañana',       icon: '☀️', order: 1 },
  { id: 'pre-entreno',  label: 'Pre-entreno',  icon: '⚡', order: 2 },
  { id: 'intra-entreno',label: 'Intra-entreno',icon: '🥤', order: 3 },
  { id: 'post-entreno', label: 'Post-entreno', icon: '💪', order: 4 },
  { id: 'comida',       label: 'Con comida',   icon: '🍽',  order: 5 },
  { id: 'tarde',        label: 'Tarde',        icon: '🌤', order: 6 },
  { id: 'noche',        label: 'Antes de dormir', icon: '🌙', order: 7 },
  { id: 'otro',         label: 'Otro',         icon: '•',  order: 99 },
];

export function timingMeta(id) {
  return SUPPLEMENT_TIMING_PRESETS.find((t) => t.id === id) || { id, label: id, icon: '•', order: 50 };
}

export const SCHEDULE_PRESETS = {
  daily: { label: 'Diario', days: [0, 1, 2, 3, 4, 5, 6] },
  training: { label: 'Días de entreno', days: [0, 2, 4] },
  rest: { label: 'Días de descanso', days: [1, 3, 5, 6] },
};
