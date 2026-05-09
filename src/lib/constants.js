// ==============================
// DAYS — week layout (Lyle cycling)
// D1,3,5 = alto · D2,4,6 = bajo · D7 = normo
// ==============================
export const DAYS = [
  { label: 'L',  name: 'Lunes',     type: 'train', workout: 'Pierna' },
  { label: 'M',  name: 'Martes',    type: 'rest',  workout: 'Descanso' },
  { label: 'Mi', name: 'Miércoles', type: 'train', workout: 'Jalón / Bícep' },
  { label: 'J',  name: 'Jueves',    type: 'rest',  workout: 'Descanso' },
  { label: 'V',  name: 'Viernes',   type: 'train', workout: 'Empuje' },
  { label: 'S',  name: 'Sábado',    type: 'rest',  workout: 'Descanso' },
  { label: 'D',  name: 'Domingo',   type: 'normo', workout: 'Descanso' },
];

export const MEALS_CONFIG = [
  { id: 'desayuno', icon: '☀️', label: 'Desayuno', sub: 'Mañana' },
  { id: 'almuerzo', icon: '🌤', label: 'Almuerzo', sub: 'Media mañana' },
  { id: 'comida',   icon: '🍽', label: 'Comida',   sub: 'Mediodía' },
  { id: 'cena',     icon: '🌙', label: 'Cena',     sub: 'Noche' },
];

// ==============================
// MUSCLE LABELS & COLORS
// ==============================
export const MUSCLE_LABELS = {
  CUAD: 'Cuádriceps',
  ISQUIOS: 'Isquiotibiales',
  GLUTEOS: 'Glúteos',
  PECHO: 'Pectoral',
  ESPALDA: 'Espalda',
  DELTOIDES: 'Deltoides',
  BICEP: 'Bíceps',
  TRICEP: 'Tríceps',
  TRAPECIO: 'Trapecio',
  PANTORRILLA: 'Gemelos/Sóleo',
  CORE: 'Core',
};

export const MUSCLE_COLORS = {
  CUAD: '#a78bfa',
  ISQUIOS: '#f87171',
  GLUTEOS: '#fb923c',
  PECHO: '#f472b6',
  ESPALDA: '#4ade80',
  DELTOIDES: '#38bdf8',
  BICEP: '#60a5fa',
  TRICEP: '#fbbf24',
  TRAPECIO: '#94a3b8',
  PANTORRILLA: '#a3e635',
  CORE: '#c084fc',
};

// ==============================
// TRAINING DAYS CONFIG
// ==============================
export const TR_DAYS_CONFIG = [
  { weekday: 0, label: 'LUNES',     focus: 'Pierna',                              color: 'cyan'   },
  { weekday: 2, label: 'MIÉRCOLES', focus: 'Jalón / Espalda + Bícep',             color: 'green'  },
  { weekday: 4, label: 'VIERNES',   focus: 'Empuje: Pecho + Hombro + Trícep',     color: 'yellow' },
];

/** Map: weekday index (0=Mon..6=Sun) → TR_DAYS_CONFIG entry, or null if not a training day. */
export function trCfgByWeekday(weekday) {
  return TR_DAYS_CONFIG.find((c) => c.weekday === weekday) || null;
}

/** Tipos de entrenamiento extra (cardio, boxeo, etc.) que no son la rutina de fuerza. */
export const EXTRA_SESSION_TYPES = [
  { id: 'boxeo',     label: 'Boxeo',           icon: '🥊' },
  { id: 'cardio',    label: 'Cardio',          icon: '🏃' },
  { id: 'hiit',      label: 'HIIT',            icon: '⚡' },
  { id: 'bici',      label: 'Bici',            icon: '🚴' },
  { id: 'natacion',  label: 'Natación',        icon: '🏊' },
  { id: 'caminata',  label: 'Caminata',        icon: '🚶' },
  { id: 'futbol',    label: 'Fútbol',          icon: '⚽' },
  { id: 'yoga',      label: 'Yoga / Movilidad',icon: '🧘' },
  { id: 'anaerobico',label: 'Anaeróbico',      icon: '💢' },
  { id: 'otro',      label: 'Otro',            icon: '·'  },
];

export function extraSessionTypeMeta(id) {
  return EXTRA_SESSION_TYPES.find((t) => t.id === id) || { id, label: id, icon: '·' };
}

// ==============================
// SEED — EXERCISE LIBRARY (todos los ejercicios conocidos)
// ==============================
export const SEED_LIBRARY = [
  // Originales (rotados fuera de los días de entreno pero disponibles en bitácora)
  { id: 'e001', name: 'Sentadilla Hack',          tech: 'Cluster Set 3+3+2-3 · 20seg',  muscle: 'CUAD'        },
  { id: 'e003', name: 'Extensión cuadrícep',      tech: 'Drop Set + Iso 2-3 seg',        muscle: 'CUAD'        },
  { id: 'e004', name: 'Peso muerto rumano',       tech: 'Negativas 4-5 seg',             muscle: 'ISQUIOS'     },
  { id: 'e005', name: 'Curl femoral sentado',     tech: 'Myo-reps 12 + 4×3-4 · 15seg',  muscle: 'ISQUIOS'     },
  { id: 'e007', name: 'Elevación talón sentado',  tech: 'Parciales + Drop Set',          muscle: 'PANTORRILLA' },
  { id: 'e009', name: 'Remo con barra en T',      tech: 'Tempo 3-1 seg negativa',        muscle: 'ESPALDA'     },
  { id: 'e010', name: 'Jalón en polea',           tech: 'Drop Set + Parciales últ',      muscle: 'ESPALDA'     },
  { id: 'e012', name: 'Curl barra EZ',            tech: 'Negativas 3-4 seg',             muscle: 'BICEP'       },
  { id: 'e014', name: 'Curl predicador máquina',  tech: 'Drop Set + Parciales última',   muscle: 'BICEP'       },
  { id: 'e020', name: 'Fondos trícep',            tech: 'Negativas 3-4 seg',             muscle: 'TRICEP'      },
  { id: 'e1777071499004', name: 'Desplante en Smith', tech: 'Tempo Controlado',          muscle: 'CUAD'        },
  // Activos en días de entreno
  { id: 'e1777070932882', name: 'Sentadilla Smith',        tech: 'Pesado',                      muscle: 'CUAD'        },
  { id: 'e002',           name: 'Sentadilla Búlgara Manc.',tech: 'Controlado',                  muscle: 'CUAD'        },
  { id: 'e1777314327126', name: 'Sentadilla Mancuerna',    tech: 'FST-7',                       muscle: 'CUAD'        },
  { id: 'e1777071649527', name: 'Peso muerto Smith',       tech: 'Pesado',                      muscle: 'ISQUIOS'     },
  { id: 'e1777071756881', name: 'Peso muerto Manc.',       tech: 'FST-7',                       muscle: 'ISQUIOS'     },
  { id: 'e006',           name: 'Elevación de talón',      tech: 'Rest Pause 12,5,3 · 15seg',   muscle: 'PANTORRILLA' },
  { id: 'e008',           name: 'Dominadas',               tech: 'Rest Pause (6,3,2 · 15seg)',  muscle: 'ESPALDA'     },
  { id: 'e1777071973929', name: 'Remo con Manc.',          tech: 'Tempo 3-2-3',                 muscle: 'ESPALDA'     },
  { id: 'e011',           name: 'Pullover en polea',       tech: 'FST-7',                       muscle: 'ESPALDA'     },
  { id: 'e013',           name: 'Curl inclinado 45° manc.',tech: 'Rest Pause (8,5,3 · 15seg)',  muscle: 'BICEP'       },
  { id: 'e1777072257011', name: 'Curl Martillo Manc',      tech: 'Tempo 2-1-2',                 muscle: 'BICEP'       },
  { id: 'e1777072291882', name: 'Curl Bícep Polea baja',   tech: 'FST-7',                       muscle: 'BICEP'       },
  { id: 'e1777072392558', name: 'Encogimientos Manc',      tech: 'Tempo 2-1-2',                 muscle: 'TRAPECIO'    },
  { id: 'e1777073784798', name: 'Face Pull',               tech: 'Biserie',                     muscle: 'TRAPECIO'    },
  { id: 'e1777072465337', name: 'Lado a Lado Pelota',      tech: 'Controlado',                  muscle: 'CORE'        },
  { id: 'e1777073812783', name: 'Ab Crunch con cuerda',    tech: 'Biserie',                     muscle: 'CORE'        },
  { id: 'e016',           name: 'Press plano Smith',       tech: 'Cluster Set 3+3+3 · 20seg',   muscle: 'PECHO'       },
  { id: 'e015',           name: 'Press inclinado manc.',   tech: 'Rest Pause (6,3,2 · 15seg)',  muscle: 'PECHO'       },
  { id: 'e017',           name: 'Pec Fly máquina',         tech: 'FST-7',                       muscle: 'PECHO'       },
  { id: 'e018',           name: 'Press militar manc.',     tech: 'Cluster Set 3+3+3 · 20seg',   muscle: 'DELTOIDES'   },
  { id: 'e019',           name: 'Elev. laterales máquina', tech: 'Drop Set + Parciales última', muscle: 'DELTOIDES'   },
  { id: 'e022',           name: 'Copa mancuerna',          tech: 'Drop Set última',             muscle: 'TRICEP'      },
  { id: 'e021',           name: 'Extensión polea alta',    tech: 'Myo-reps 12 + 4×3-4 · 15seg', muscle: 'TRICEP'     },
];

// ==============================
// SEED — TRAINING (rutina actual)
// ==============================
export const SEED_TRAINING = [
  { label: 'LUNES', focus: 'Pierna', exercises: [
    { id: 'e1777070932882', name: 'Sentadilla Smith',        tech: 'Pesado',                      muscle: 'CUAD',        reps: 8,  sets: 3, weight: 69.8  },
    { id: 'e002',           name: 'Sentadilla Búlgara Manc.',tech: 'Controlado',                  muscle: 'CUAD',        reps: 12, sets: 3, weight: 11.3  },
    { id: 'e1777314327126', name: 'Sentadilla Mancuerna',    tech: 'FST-7',                       muscle: 'CUAD',        reps: 12, sets: 7, weight: 13.61 },
    { id: 'e1777071649527', name: 'Peso muerto Smith',       tech: 'Pesado',                      muscle: 'ISQUIOS',     reps: 10, sets: 3, weight: 56.81 },
    { id: 'e1777071756881', name: 'Peso muerto Manc.',       tech: 'FST-7',                       muscle: 'ISQUIOS',     reps: 12, sets: 7, weight: 22.72 },
    { id: 'e006',           name: 'Elevación de talón',      tech: 'Rest Pause 12,5,3 · 15seg',   muscle: 'PANTORRILLA', reps: 12, sets: 6, weight: 28.63 },
  ]},
  { label: 'MIÉRCOLES', focus: 'Jalón / Espalda + Bícep', exercises: [
    { id: 'e008',           name: 'Dominadas',               tech: 'Rest Pause (6,3,2 · 15seg)',  muscle: 'ESPALDA',  reps: 8,  sets: 3, weight: 65    },
    { id: 'e1777071973929', name: 'Remo con Manc.',          tech: 'Tempo 3-2-3',                 muscle: 'ESPALDA',  reps: 12, sets: 4, weight: 18.14 },
    { id: 'e011',           name: 'Pullover en polea',       tech: 'FST-7',                       muscle: 'ESPALDA',  reps: 12, sets: 7, weight: 23    },
    { id: 'e013',           name: 'Curl inclinado 45° manc.',tech: 'Rest Pause (8,5,3 · 15seg)',  muscle: 'BICEP',    reps: 10, sets: 3, weight: 9     },
    { id: 'e1777072257011', name: 'Curl Martillo Manc',      tech: 'Tempo 2-1-2',                 muscle: 'BICEP',    reps: 10, sets: 4, weight: 11.34 },
    { id: 'e1777072291882', name: 'Curl Bícep Polea baja',   tech: 'FST-7',                       muscle: 'BICEP',    reps: 12, sets: 7, weight: 45    },
    { id: 'e1777072392558', name: 'Encogimientos Manc',      tech: 'Tempo 2-1-2',                 muscle: 'TRAPECIO', reps: 12, sets: 4, weight: 0     },
    { id: 'e1777072465337', name: 'Lado a Lado Pelota',      tech: 'Controlado',                  muscle: 'CORE',     reps: 12, sets: 4, weight: 8     },
  ]},
  { label: 'VIERNES', focus: 'Empuje: Pecho + Hombro + Trícep', exercises: [
    { id: 'e016',           name: 'Press plano Smith',       tech: 'Cluster Set 3+3+3 · 20seg',   muscle: 'PECHO',     reps: 9,  sets: 3, weight: 55.79 },
    { id: 'e015',           name: 'Press inclinado manc.',   tech: 'Rest Pause (6,3,2 · 15seg)',  muscle: 'PECHO',     reps: 12, sets: 3, weight: 36.28 },
    { id: 'e017',           name: 'Pec Fly máquina',         tech: 'FST-7',                       muscle: 'PECHO',     reps: 12, sets: 7, weight: 6.4   },
    { id: 'e018',           name: 'Press militar manc.',     tech: 'Cluster Set 3+3+3 · 20seg',   muscle: 'DELTOIDES', reps: 8,  sets: 3, weight: 13.6  },
    { id: 'e019',           name: 'Elev. laterales máquina', tech: 'Drop Set + Parciales última', muscle: 'DELTOIDES', reps: 12, sets: 7, weight: 12.5  },
    { id: 'e022',           name: 'Copa mancuerna',          tech: 'Drop Set última',             muscle: 'TRICEP',    reps: 8,  sets: 3, weight: 27.2  },
    { id: 'e021',           name: 'Extensión polea alta',    tech: 'Myo-reps 12 + 4×3-4 · 15seg', muscle: 'TRICEP',   reps: 12, sets: 7, weight: 20    },
    { id: 'e1777073784798', name: 'Face Pull',               tech: 'Biserie',                     muscle: 'TRAPECIO',  reps: 12, sets: 3, weight: 25    },
    { id: 'e1777073812783', name: 'Ab Crunch con cuerda',    tech: 'Biserie',                     muscle: 'CORE',      reps: 11, sets: 3, weight: 45    },
  ]},
];

// ==============================
// SEED — FOODS (15 del prototipo)
// ==============================
export const SEED_FOODS = [
  { id: 'f001', name: 'Alpura PRO',           brand: 'Alpura',       category: 'lacteos',    servingSize: 310, servingUnit: 'ml',    kcal: 146, prot: 16.74, carb: 15.81, fat: 1.55, fiber: 0,    sugar: 15.81, sodium: 186, notes: 'Alta en proteína, baja en grasa' },
  { id: 'f002', name: 'Pechuga de pollo',     brand: '',             category: 'proteina',   servingSize: 100, servingUnit: 'g',     kcal: 165, prot: 31,    carb: 0,     fat: 3.6,  fiber: 0,    sugar: 0,     sodium: 74,  notes: 'Asada, sin piel' },
  { id: 'f003', name: 'Huevo entero',         brand: '',             category: 'proteina',   servingSize: 50,  servingUnit: 'g',     kcal: 72,  prot: 6.3,   carb: 0.4,   fat: 4.8,  fiber: 0,    sugar: 0.2,   sodium: 71,  notes: '~1 huevo mediano' },
  { id: 'f004', name: 'Clara de huevo',       brand: '',             category: 'proteina',   servingSize: 30,  servingUnit: 'g',     kcal: 16,  prot: 3.3,   carb: 0.2,   fat: 0.1,  fiber: 0,    sugar: 0.2,   sodium: 55,  notes: '~1 clara mediana' },
  { id: 'f005', name: 'Avena en hojuelas',    brand: '',             category: 'cereal',     servingSize: 100, servingUnit: 'g',     kcal: 389, prot: 16.9,  carb: 66.3,  fat: 6.9,  fiber: 10.6, sugar: 0,     sodium: 2,   notes: 'Cruda / sin cocinar' },
  { id: 'f006', name: 'Arroz integral cocido',brand: '',             category: 'cereal',     servingSize: 100, servingUnit: 'g',     kcal: 111, prot: 2.6,   carb: 23,    fat: 0.9,  fiber: 1.8,  sugar: 0,     sodium: 5,   notes: 'Cocido' },
  { id: 'f007', name: 'Plátano tabasco',      brand: '',             category: 'fruta',      servingSize: 100, servingUnit: 'g',     kcal: 89,  prot: 1.1,   carb: 22.8,  fat: 0.3,  fiber: 2.6,  sugar: 12.2,  sodium: 1,   notes: '~½ plátano grande' },
  { id: 'f008', name: 'Aguacate hass',        brand: '',             category: 'grasa',      servingSize: 100, servingUnit: 'g',     kcal: 160, prot: 2,     carb: 8.5,   fat: 14.7, fiber: 6.7,  sugar: 0.7,   sodium: 7,   notes: 'Fruta entera' },
  { id: 'f009', name: 'Nuez de Castilla',     brand: '',             category: 'grasa',      servingSize: 30,  servingUnit: 'g',     kcal: 196, prot: 4.6,   carb: 4.1,   fat: 19.6, fiber: 2,    sugar: 0.7,   sodium: 1,   notes: '~1 puño pequeño' },
  { id: 'f010', name: 'Pan integral',         brand: 'Bimbo',        category: 'cereal',     servingSize: 30,  servingUnit: 'g',     kcal: 80,  prot: 3.5,   carb: 13,    fat: 1.5,  fiber: 2,    sugar: 1.5,   sodium: 130, notes: '~1 rebanada' },
  { id: 'f011', name: 'Mantequilla',          brand: '',             category: 'grasa',      servingSize: 5,   servingUnit: 'g',     kcal: 36,  prot: 0,     carb: 0,     fat: 4,    fiber: 0,    sugar: 0,     sodium: 30,  notes: '1 cdita rasa' },
  { id: 'f012', name: 'Mermelada',            brand: '',             category: 'otro',       servingSize: 20,  servingUnit: 'g',     kcal: 56,  prot: 0.1,   carb: 14,    fat: 0,    fiber: 0.2,  sugar: 12,    sodium: 2,   notes: '~1 cda generosa' },
  { id: 'f013', name: 'Proteína whey isolate',brand: '',             category: 'suplemento', servingSize: 30,  servingUnit: 'scoop', kcal: 110, prot: 25,    carb: 2,     fat: 0.5,  fiber: 0,    sugar: 1,     sodium: 80,  notes: '1 scoop promedio' },
  { id: 'f014', name: 'Atún en agua',         brand: 'Marina Azul',  category: 'proteina',   servingSize: 140, servingUnit: 'g',     kcal: 120, prot: 26,    carb: 0,     fat: 1,    fiber: 0,    sugar: 0,     sodium: 250, notes: '1 lata escurrida, bajo sodio' },
  { id: 'f015', name: 'Arroz blanco cocido',  brand: '',             category: 'cereal',     servingSize: 100, servingUnit: 'g',     kcal: 130, prot: 2.7,   carb: 28.2,  fat: 0.3,  fiber: 0.4,  sugar: 0,     sodium: 1,   notes: 'Cocido' },
];

export const FOOD_CATEGORIES = [
  { id: 'lacteos',    label: 'Lácteos' },
  { id: 'proteina',   label: 'Proteína' },
  { id: 'cereal',     label: 'Cereal' },
  { id: 'fruta',      label: 'Fruta' },
  { id: 'verdura',    label: 'Verdura' },
  { id: 'grasa',      label: 'Grasa' },
  { id: 'suplemento', label: 'Suplemento' },
  { id: 'otro',       label: 'Otro' },
];

export const SERVING_UNITS = ['g', 'ml', 'pieza', 'scoop', 'taza', 'cda', 'cdita'];

// ==============================
// SEED — NUTRITION PLAN
// ==============================
export function buildSeedNutPlan() {
  const base = {};
  for (let d = 0; d < 7; d++) {
    const extrasEntreno = d % 2 === 0 && d !== 6;
    base[d] = {
      desayuno: [
        { foodId: 'f007', amount: 200, unit: 'g'     },
        { foodId: 'f013', amount: 30,  unit: 'scoop' },
        { foodId: 'f001', amount: 312, unit: 'ml'    },
        { foodId: 'f005', amount: 30,  unit: 'g'     },
        { foodId: 'f009', amount: 15,  unit: 'g'     },
      ],
      almuerzo: [
        { foodId: 'f003', amount: 150, unit: 'g' },
        { foodId: 'f004', amount: 150, unit: 'g' },
        { foodId: 'f011', amount: 5,   unit: 'g' },
        { foodId: 'f005', amount: 50,  unit: 'g' },
        { foodId: 'f010', amount: 60,  unit: 'g' },
        { foodId: 'f008', amount: 50,  unit: 'g' },
      ],
      comida: [
        { foodId: 'f002', amount: 150, unit: 'g' },
        { foodId: 'f006', amount: 200, unit: 'g' },
        ...(extrasEntreno ? [
          { foodId: 'f005', amount: 130, unit: 'g' },
          { foodId: 'f011', amount: 5,   unit: 'g' },
          { foodId: 'f010', amount: 60,  unit: 'g' },
          { foodId: 'f012', amount: 30,  unit: 'g' },
        ] : []),
      ],
      cena: [
        { foodId: 'f014', amount: 280, unit: 'g' },
        { foodId: 'f006', amount: 150, unit: 'g' },
        { foodId: 'f005', amount: 50,  unit: 'g' },
        { foodId: 'f007', amount: 200, unit: 'g' },
      ],
    };
  }
  return base;
}

// Activity multipliers (Harris-Benedict) — combinados (NEAT + ejercicio típico).
// Solo se usan para calcular el OBJETIVO de Lyle (planificación de la
// ingesta semanal). Para el GASTO REAL del día usar TMB + NEAT_KCAL +
// entreno registrado (ver NEAT_LEVELS abajo).
export const ACTIVITY_LEVELS = [
  { id: 1.2,   label: 'Sedentario'                  },
  { id: 1.375, label: 'Ligero (1-3 d/sem)'          },
  { id: 1.55,  label: 'Moderado (3-5 d/sem)'        },
  { id: 1.725, label: 'Alto (6-7 d/sem)'            },
  { id: 1.9,   label: 'Atleta (2×/día)'             },
];

// NEAT (Non-Exercise Activity Thermogenesis) en kcal/día. Es lo que gastas
// fuera del entrenamiento estructurado: caminar, estar de pie, gestos, etc.
// Esta cifra se SUMA al TMB para tener un baseline de gasto antes de añadir
// el entreno real registrado del día.
export const NEAT_LEVELS = [
  { id: 200,  label: 'Mínimo',    sub: 'oficina sedentario, casi sin pasos' },
  { id: 400,  label: 'Bajo',      sub: 'oficina + algunas caminatas' },
  { id: 600,  label: 'Medio',     sub: 'movimiento moderado (4-7k pasos)' },
  { id: 800,  label: 'Alto',      sub: 'activo en el día (7-10k pasos)' },
  { id: 1000, label: 'Muy alto',  sub: 'trabajo activo / labor física' },
];

// Macro presets
export const MACRO_PRESETS = [
  { id: 'recomp',    label: 'Recomposición Lyle', carb: 40, prot: 40, lip: 20 },
  { id: 'cut',       label: 'Definición Lyle',    carb: 35, prot: 45, lip: 20 },
  { id: 'zone',      label: 'Zona',               carb: 40, prot: 30, lip: 30 },
  { id: 'highcarb',  label: 'Alto carbohidrato',  carb: 60, prot: 25, lip: 15 },
  { id: 'highprot',  label: 'Alto proteína',      carb: 30, prot: 50, lip: 20 },
];
