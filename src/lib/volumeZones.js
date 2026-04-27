// ==============================
// WEEKLY VOLUME ZONES per muscle
// MV  = Maintenance Volume
// MEV = Minimum Effective Volume
// MAV = Maximum Adaptive Volume
// MRV = Maximum Recoverable Volume
// ==============================
export const VOLUME_ZONES = {
  CUAD:        { mv: [0, 6],  mev: [6, 12],  mav: [12, 18], mrv: 20 },
  ISQUIOS:     { mv: [0, 4],  mev: [4, 10],  mav: [10, 16], mrv: 20 },
  GLUTEOS:     { mv: [0, 0],  mev: [0, 4],   mav: [4, 12],  mrv: 16 },
  PECHO:       { mv: [0, 8],  mev: [8, 12],  mav: [12, 20], mrv: 22 },
  ESPALDA:     { mv: [0, 8],  mev: [8, 14],  mav: [14, 22], mrv: 25 },
  DELTOIDES:   { mv: [0, 6],  mev: [6, 8],   mav: [8, 22],  mrv: 26 },
  BICEP:       { mv: [0, 6],  mev: [6, 14],  mav: [14, 20], mrv: 26 },
  TRICEP:      { mv: [0, 4],  mev: [4, 10],  mav: [10, 14], mrv: 18 },
  TRAPECIO:    { mv: [0, 0],  mev: [0, 12],  mav: [12, 20], mrv: 26 },
  PANTORRILLA: { mv: [0, 6],  mev: [6, 12],  mav: [12, 16], mrv: 20 },
  CORE:        { mv: [0, 0],  mev: [0, 15],  mav: [15, 20], mrv: 25 },
};

/** Classify a weekly set count into a zone label */
export function getVolumeZone(muscle, sets) {
  const z = VOLUME_ZONES[muscle];
  if (!z) return { label: '—', cls: 'zone-none' };
  if (sets >= z.mrv)    return { label: 'MRV', cls: 'zone-mrv' };
  if (sets >= z.mav[0]) return { label: 'MAV', cls: 'zone-mav' };
  if (sets >= z.mev[0]) return { label: 'MEV', cls: 'zone-mev' };
  if (sets >= z.mv[0])  return { label: 'MV',  cls: 'zone-mv'  };
  return { label: '—', cls: 'zone-none' };
}

/** Aggregate weekly sets per muscle from training days */
export function getWeeklySetsByMuscle(days) {
  const totals = {};
  Object.keys(VOLUME_ZONES).forEach((m) => { totals[m] = 0; });
  days.forEach((day) => {
    day.exercises.forEach((ex) => {
      if (totals[ex.muscle] == null) totals[ex.muscle] = 0;
      totals[ex.muscle] += Number(ex.sets) || 0;
    });
  });
  return totals;
}

/** Zone color helpers (tailwind-compatible hex) */
export const ZONE_COLORS = {
  'zone-none': '#475569',
  'zone-mv':   '#64748b',
  'zone-mev':  '#22c55e',
  'zone-mav':  '#00e5ff',
  'zone-mrv':  '#ef4444',
};
