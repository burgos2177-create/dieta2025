// Build a printable HTML for a mesocycle's training log.
// Iterates each week of the mesocycle, each training day's workout (snapshot or template).

import { addWeeks, formatWeekRange } from './dates.js';
import { mesoPhaseLabel } from './mesocycle.js';

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function fmtNum(n, decimals = 0) {
  if (!isFinite(n)) return '0';
  return decimals === 0 ? Math.round(n).toString() : Number(n.toFixed(decimals)).toString();
}

export function buildMesocyclePrintHTML({
  profile,
  meso,           // { name, startWeek, weeks, startWeight }
  trCfgs,         // TR_DAYS_CONFIG
  selectDay,      // (weekKey, weekday) => day | null  (curried with state)
  muscleLabels,   // MUSCLE_LABELS map
}) {
  const today = new Date();
  const genStr = today.toLocaleString('es-MX');
  const weeks = Array.from({ length: meso.weeks }, (_, i) => ({
    n: i + 1,
    weekKey: addWeeks(meso.startWeek, i),
    phase: mesoPhaseLabel(i + 1, meso.weeks),
  }));

  const weekSections = weeks.map((wk) => {
    const days = trCfgs.map((cfg) => {
      const day = selectDay(wk.weekKey, cfg.weekday);
      const exercises = day?.exercises || [];
      const totalVol = exercises.reduce(
        (a, e) => a + (Number(e.reps) || 0) * (Number(e.sets) || 0) * (Number(e.weight) || 0), 0
      );
      const rows = exercises.length === 0
        ? `<tr><td colspan="6" class="empty">— sin ejercicios —</td></tr>`
        : exercises.map((ex) => {
            const reps = Number(ex.reps) || 0;
            const sets = Number(ex.sets) || 0;
            const weight = Number(ex.weight) || 0;
            const vol = reps * sets * weight;
            return `
              <tr class="entry">
                <td class="check"><span class="box"></span></td>
                <td class="name">${escapeHtml(ex.name)}<br><span class="muscle">${escapeHtml(muscleLabels[ex.muscle] || ex.muscle)}</span></td>
                <td class="num right">${reps}</td>
                <td class="num right">${sets}</td>
                <td class="num right">${weight}</td>
                <td class="num right">${fmtNum(vol)}</td>
              </tr>`;
          }).join('');

      return `
        <section class="day">
          <div class="day-h">
            <div class="day-name">${escapeHtml(cfg.label)} · ${escapeHtml(cfg.focus)}</div>
            <div class="day-vol">${fmtNum(totalVol)} kg vol</div>
          </div>
          <table>
            <thead>
              <tr>
                <th></th>
                <th>Ejercicio</th>
                <th class="right">Reps</th>
                <th class="right">Sets</th>
                <th class="right">Peso (kg)</th>
                <th class="right">Vol</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </section>`;
    }).join('');

    return `
      <section class="week">
        <div class="week-h">
          <div>
            <span class="pill">SEM ${wk.n}/${meso.weeks}</span>
            <span class="phase">${escapeHtml(wk.phase)}</span>
          </div>
          <div class="week-range">${escapeHtml(formatWeekRange(wk.weekKey))}</div>
        </div>
        ${days}
      </section>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Mesociclo · ${escapeHtml(meso.name)}</title>
<style>
  @page { size: A4; margin: 12mm; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font: 10pt/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    color: #111; background: #fff; max-width: 190mm; margin: 0 auto;
  }
  header { border-bottom: 2pt solid #111; padding-bottom: 6pt; margin-bottom: 8pt; }
  h1 { font-size: 18pt; margin: 0 0 2pt; letter-spacing: 0.05em; font-weight: 800; }
  .meta { color: #555; font-size: 9.5pt; }
  .week {
    margin-top: 14pt;
    page-break-inside: avoid;
    page-break-before: auto;
  }
  .week:not(:first-of-type) { padding-top: 8pt; border-top: 1.5pt solid #444; }
  .week-h {
    display: flex; justify-content: space-between; align-items: baseline;
    margin-bottom: 6pt;
  }
  .pill {
    display: inline-block; padding: 1pt 6pt; background: #111; color: #fff;
    border-radius: 3pt; font-size: 9pt; letter-spacing: 0.05em; font-weight: 700;
  }
  .phase { margin-left: 6pt; font-size: 11pt; font-weight: 600; color: #444; }
  .week-range { font-family: "SF Mono", Menlo, monospace; color: #666; font-size: 9.5pt; }
  .day {
    margin-top: 8pt;
    page-break-inside: avoid;
  }
  .day-h {
    display: flex; justify-content: space-between; align-items: baseline;
    border-bottom: 0.5pt solid #ccc; padding-bottom: 3pt; margin-bottom: 3pt;
  }
  .day-name { font-size: 11pt; font-weight: 700; }
  .day-vol { font-size: 10pt; font-weight: 600; color: #444; }
  table { width: 100%; border-collapse: collapse; font-size: 9.5pt; }
  th, td { padding: 2.5pt 4pt; text-align: left; vertical-align: middle; }
  th {
    font-size: 7.5pt; text-transform: uppercase; color: #666;
    border-bottom: 0.5pt solid #aaa; font-weight: 600; letter-spacing: 0.04em;
  }
  tr.entry td { border-bottom: 0.3pt solid #eee; }
  td.right, th.right { text-align: right; }
  td.num { font-variant-numeric: tabular-nums; white-space: nowrap; }
  td.muscle, .muscle { color: #888; font-size: 7.5pt; font-weight: normal; }
  td.check { width: 10pt; }
  .box {
    display: inline-block; width: 8pt; height: 8pt;
    border: 0.7pt solid #333; border-radius: 1pt; vertical-align: middle;
  }
  td.empty { color: #999; font-style: italic; padding: 4pt; text-align: center; }
  .footer { margin-top: 14pt; font-size: 8pt; color: #aaa; text-align: center;
    border-top: 0.3pt solid #eee; padding-top: 6pt; }
  @media screen {
    body { padding: 16pt; max-width: 720pt; box-shadow: 0 0 20pt rgba(0,0,0,0.1); margin: 12pt auto; }
    .toolbar {
      position: fixed; top: 8pt; right: 8pt;
      background: #111; color: #fff; padding: 6pt 12pt; border-radius: 4pt;
      font-size: 11pt; cursor: pointer; box-shadow: 0 2pt 8pt rgba(0,0,0,0.2); border: none;
    }
  }
  @media print { .toolbar { display: none; } }
</style>
</head>
<body>
  <button class="toolbar" onclick="window.print()">🖨 Imprimir / Guardar PDF</button>
  <header>
    <h1>MESOCICLO · ${escapeHtml(meso.name.toUpperCase())}</h1>
    <div class="meta">
      ${escapeHtml(profile?.nombre || 'Plan personal')}
      · ${meso.weeks} semanas
      ${meso.startWeight ? `· peso inicio ${meso.startWeight} kg` : ''}
      · inicio ${escapeHtml(formatWeekRange(meso.startWeek))}
    </div>
  </header>

  ${weekSections}

  <div class="footer">Generado por dieta2025 · ${escapeHtml(genStr)}</div>
</body>
</html>`;
}
