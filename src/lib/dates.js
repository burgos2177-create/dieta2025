// Helpers for week-indexed journal storage.
// Week key = ISO date of the Monday of that week (YYYY-MM-DD).

const MS_DAY = 86400000;

function pad(n) { return String(n).padStart(2, '0'); }

/** YYYY-MM-DD of a Date (local time). */
export function ymd(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Get the Monday of the week containing `date`, returned as YYYY-MM-DD. */
export function getMondayKey(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const dow = d.getDay() || 7; // make Sunday = 7
  d.setDate(d.getDate() - (dow - 1));
  return ymd(d);
}

/** Parse a YYYY-MM-DD week key into a Date (local midnight). */
export function parseKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Shift a week key by `n` weeks (n can be negative). */
export function addWeeks(key, n) {
  const d = parseKey(key);
  d.setDate(d.getDate() + n * 7);
  return ymd(d);
}

/** Returns the 7 Date objects (Mon..Sun) for a week. */
export function weekDates(key) {
  const start = parseKey(key);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

const MONTH_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** Human-readable week range, e.g. "4 – 10 may 2026" or "30 abr – 6 may 2026". */
export function formatWeekRange(key) {
  const dates = weekDates(key);
  const a = dates[0], b = dates[6];
  if (a.getMonth() === b.getMonth()) {
    return `${a.getDate()} – ${b.getDate()} ${MONTH_SHORT[a.getMonth()]} ${a.getFullYear()}`;
  }
  return `${a.getDate()} ${MONTH_SHORT[a.getMonth()]} – ${b.getDate()} ${MONTH_SHORT[b.getMonth()]} ${b.getFullYear()}`;
}

/** True if `key` matches the Monday of today's week. */
export function isCurrentWeek(key) {
  return key === getMondayKey(new Date());
}

/** Day-of-week index (0=Mon..6=Sun) for today. */
export function todayDayIdx() {
  const dow = new Date().getDay() || 7;
  return dow - 1;
}

/** Format a Date as long Spanish date. */
export function formatLongDate(date) {
  return new Date(date).toLocaleDateString('es-MX', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  });
}

/** Whole number of weeks from week key A to week key B (B - A). */
export function weeksBetween(keyA, keyB) {
  const a = parseKey(keyA).getTime();
  const b = parseKey(keyB).getTime();
  return Math.round((b - a) / (7 * MS_DAY));
}
