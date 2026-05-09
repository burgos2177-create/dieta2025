import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SEED_SUPPLEMENTS } from '../lib/supplementsSeed';
import { cloudLoad, cloudSave } from '../lib/cloudSync';
import { ymd, parseKey } from '../lib/dates';

const CLOUD_KEY = 'supplements';

function newId() {
  return `sup_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}
function newProtocolId() {
  return `pr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

function mergeSeed(library) {
  const out = [...(library || [])];
  for (const s of SEED_SUPPLEMENTS) {
    if (!out.find((x) => x.id === s.id)) out.push(s);
  }
  return out;
}

export const useSupplementStore = create(
  persist(
    (set, get) => ({
      library: [...SEED_SUPPLEMENTS],
      // intake[YYYY-MM-DD] = { [supplementId]: true }
      intake: {},
      // protocols: time-bound plans wrapping a supplement
      protocols: [],

      addSupplement: (data) =>
        set((s) => ({
          library: [...s.library, { id: newId(), active: true, daysOfWeek: [0,1,2,3,4,5,6], doseAmount: 1, doseUnit: 'g', kcalPerDose: 0, ...data }],
        })),
      updateSupplement: (id, patch) =>
        set((s) => ({
          library: s.library.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        })),
      removeSupplement: (id) =>
        set((s) => ({
          library: s.library.filter((x) => x.id !== id),
        })),

      /** Mark a supplement intake (taken=true|false) for a given date (YYYY-MM-DD). */
      markIntake: (dateKey, supplementId, taken) =>
        set((s) => {
          const day = { ...(s.intake[dateKey] || {}) };
          if (taken) day[supplementId] = true;
          else delete day[supplementId];
          const intake = { ...s.intake };
          if (Object.keys(day).length === 0) delete intake[dateKey];
          else intake[dateKey] = day;
          return { intake };
        }),

      /** Toggle a single supplement's intake state for the given date. */
      toggleIntake: (dateKey, supplementId) =>
        set((s) => {
          const day = { ...(s.intake[dateKey] || {}) };
          if (day[supplementId]) delete day[supplementId];
          else day[supplementId] = true;
          const intake = { ...s.intake };
          if (Object.keys(day).length === 0) delete intake[dateKey];
          else intake[dateKey] = day;
          return { intake };
        }),

      clearDay: (dateKey) =>
        set((s) => {
          const intake = { ...s.intake };
          delete intake[dateKey];
          return { intake };
        }),

      // ── Protocols ──
      addProtocol: (data) =>
        set((s) => ({
          protocols: [
            ...s.protocols,
            {
              id: newProtocolId(),
              name: '',
              supplementId: '',
              doseAmount: 1,
              doseUnit: 'g',
              timing: 'mañana',
              daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
              startDate: ymd(new Date()),
              weeks: null,
              notes: '',
              active: true,
              createdAt: Date.now(),
              ...data,
            },
          ],
        })),
      updateProtocol: (id, patch) =>
        set((s) => ({
          protocols: s.protocols.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),
      removeProtocol: (id) =>
        set((s) => ({ protocols: s.protocols.filter((p) => p.id !== id) })),

      // ── Cloud sync ──
      _initCloud: async () => {
        const data = await cloudLoad(CLOUD_KEY);
        if (data) {
          set({
            library: mergeSeed(data.library),
            intake: data.intake || {},
            protocols: Array.isArray(data.protocols) ? data.protocols : [],
          });
        } else {
          const s = get();
          cloudSave(CLOUD_KEY, { library: s.library, intake: s.intake, protocols: s.protocols });
        }
        useSupplementStore.subscribe((s) => {
          cloudSave(CLOUD_KEY, { library: s.library, intake: s.intake, protocols: s.protocols });
        });
      },
    }),
    {
      name: 'dieta2025_supplements',
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.library = mergeSeed(state.library || []);
        state.intake = state.intake || {};
        if (!Array.isArray(state.protocols)) state.protocols = [];
      },
    }
  )
);

/** Returns supplements scheduled for the given weekday (legacy, supplement-only). */
export function selectScheduledForWeekday(state, weekday) {
  return state.library.filter((s) => s.active && (s.daysOfWeek || []).includes(weekday));
}

/** Helper: today's date key in YYYY-MM-DD. */
export function todayKey() {
  return ymd(new Date());
}

/** True if a protocol is active on a given date (checks startDate, weeks window
 *  and day-of-week schedule). */
export function isProtocolActiveOn(protocol, dateKey) {
  if (!protocol?.active) return false;
  const date = parseKey(dateKey);
  const dow = (date.getDay() || 7) - 1;
  if (!(protocol.daysOfWeek || []).includes(dow)) return false;
  if (protocol.startDate) {
    const start = parseKey(protocol.startDate);
    if (date < start) return false;
    if (protocol.weeks != null) {
      const end = new Date(start);
      end.setDate(start.getDate() + protocol.weeks * 7);
      if (date >= end) return false;
    }
  }
  return true;
}

/** Get the week N/total for a protocol on a given date (or null if no period). */
export function getProtocolWeekInfo(protocol, dateKey) {
  if (!protocol?.startDate) return null;
  const start = parseKey(protocol.startDate);
  const date = parseKey(dateKey);
  const daysDiff = Math.floor((date - start) / 86400000);
  const weekN = Math.floor(daysDiff / 7) + 1;
  return {
    current: weekN,
    total: protocol.weeks ?? null,
    indefinite: protocol.weeks == null,
  };
}

/** Items to show in the daily checklist for a given date.
 *  Combines: protocol-driven items (active protocols matching today) +
 *  legacy supplement-only items (no protocol covers them). */
export function selectChecklistForDate(state, dateKey) {
  const date = parseKey(dateKey);
  const dow = (date.getDay() || 7) - 1;
  const items = [];
  const supplementsCoveredByProtocol = new Set();
  for (const p of state.protocols || []) {
    if (!isProtocolActiveOn(p, dateKey)) continue;
    const sup = (state.library || []).find((s) => s.id === p.supplementId);
    if (!sup) continue;
    supplementsCoveredByProtocol.add(sup.id);
    items.push({
      key: p.id,
      protocolId: p.id,
      supplementId: sup.id,
      name: p.name || sup.name,
      brand: sup.brand,
      doseAmount: p.doseAmount ?? sup.doseAmount,
      doseUnit: p.doseUnit ?? sup.doseUnit,
      timing: p.timing || sup.timing,
      notes: p.notes || sup.notes,
      weekInfo: getProtocolWeekInfo(p, dateKey),
    });
  }
  // Fall back to bare supplements (no protocol) if scheduled directly.
  for (const sup of state.library || []) {
    if (!sup.active) continue;
    if (supplementsCoveredByProtocol.has(sup.id)) continue;
    if (!(sup.daysOfWeek || []).includes(dow)) continue;
    items.push({
      key: sup.id,
      protocolId: null,
      supplementId: sup.id,
      name: sup.name,
      brand: sup.brand,
      doseAmount: sup.doseAmount,
      doseUnit: sup.doseUnit,
      timing: sup.timing,
      notes: sup.notes,
      weekInfo: null,
    });
  }
  return items;
}

/** Adherence stats for a protocol up to today (or its end date). */
export function getProtocolAdherence(protocol, intake) {
  if (!protocol?.startDate) return { taken: 0, scheduled: 0, ratio: 0, missed: 0 };
  const start = parseKey(protocol.startDate);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  let endDate = today;
  if (protocol.weeks != null) {
    const periodEnd = new Date(start);
    periodEnd.setDate(start.getDate() + protocol.weeks * 7);
    if (periodEnd < today) endDate = periodEnd;
  }
  let taken = 0;
  let scheduled = 0;
  for (let d = new Date(start); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dow = (d.getDay() || 7) - 1;
    if (!(protocol.daysOfWeek || []).includes(dow)) continue;
    scheduled++;
    const k = ymd(d);
    if (intake[k]?.[protocol.supplementId]) taken++;
  }
  return {
    taken,
    scheduled,
    missed: scheduled - taken,
    ratio: scheduled > 0 ? taken / scheduled : 0,
  };
}
