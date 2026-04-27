// ==============================
// Body composition report — field schema
// Derived from a typical 8-electrode body fat scale report.
// `ref` = healthy/reference range [min, max] if known
// `chart` = true → rendered in the evolution charts grid
// ==============================

export const BODY_FIELD_GROUPS = [
  {
    id: 'composition',
    label: 'Composición corporal',
    items: [
      { key: 'peso',         label: 'Peso',                    unit: 'kg', chart: true,  ref: [55, 75] },
      { key: 'grasaKg',      label: 'Grasa corporal',          unit: 'kg', chart: true },
      { key: 'grasaPct',     label: 'Porcentaje de grasa',     unit: '%',  chart: true,  ref: [8, 20] },
      { key: 'aguaPct',      label: 'Porcentaje de agua',      unit: '%',  chart: true,  ref: [55, 65] },
      { key: 'masaMuscular', label: 'Masa muscular',           unit: 'kg', chart: true },
      { key: 'masaOsea',     label: 'Masa ósea',               unit: 'kg', chart: true },
    ],
  },
  {
    id: 'control',
    label: 'Control de peso',
    items: [
      { key: 'pesoEstandar',     label: 'Peso estándar',       unit: 'kg' },
      { key: 'controlGrasa',     label: 'Control de grasa',    unit: 'kg' },
      { key: 'controlMuscular',  label: 'Control muscular',    unit: 'kg' },
      { key: 'controlPeso',      label: 'Control de peso',     unit: 'kg', chart: true },
    ],
  },
  {
    id: 'segFat',
    label: 'Grasa por segmento',
    items: [
      { key: 'grasaBrazoIzq',  label: 'Brazo izquierdo',  unit: 'kg', chart: true },
      { key: 'grasaBrazoDer',  label: 'Brazo derecho',    unit: 'kg', chart: true },
      { key: 'grasaTronco',    label: 'Tronco',           unit: 'kg', chart: true },
      { key: 'grasaPiernaIzq', label: 'Pierna izquierda', unit: 'kg', chart: true },
      { key: 'grasaPiernaDer', label: 'Pierna derecha',   unit: 'kg', chart: true },
    ],
  },
  {
    id: 'segMusc',
    label: 'Músculo por segmento',
    items: [
      { key: 'muscBrazoIzq',  label: 'Brazo izquierdo',  unit: 'kg', chart: true },
      { key: 'muscBrazoDer',  label: 'Brazo derecho',    unit: 'kg', chart: true },
      { key: 'muscTronco',    label: 'Tronco',           unit: 'kg', chart: true },
      { key: 'muscPiernaIzq', label: 'Pierna izquierda', unit: 'kg', chart: true },
      { key: 'muscPiernaDer', label: 'Pierna derecha',   unit: 'kg', chart: true },
    ],
  },
  {
    id: 'indicators',
    label: 'Otros indicadores',
    items: [
      { key: 'imc',            label: 'IMC',                   unit: '',    chart: true, ref: [18.5, 25] },
      { key: 'tmb',            label: 'TMB / IMB',             unit: 'kcal', chart: true },
      { key: 'grasaVisceral',  label: 'Índice grasa visceral', unit: '',    chart: true, ref: [0, 11] },
      { key: 'tasaMuscular',   label: 'Tasa muscular',         unit: '%',   chart: true, ref: [70, 85] },
      { key: 'indiceMuscular', label: 'Índice muscular',       unit: '',    chart: true, ref: [6.5, 7.5] },
      { key: 'proteinaPct',    label: 'Porcentaje de proteína',unit: '%',   chart: true, ref: [16, 18] },
    ],
  },
];

// Flat list for iteration helpers
export const ALL_BODY_FIELDS = BODY_FIELD_GROUPS.flatMap((g) => g.items);
export const CHART_BODY_FIELDS = ALL_BODY_FIELDS.filter((f) => f.chart);

// Empty entry skeleton with all numeric fields = null
export function emptyBodyEntry() {
  const out = {};
  ALL_BODY_FIELDS.forEach((f) => { out[f.key] = null; });
  return out;
}
