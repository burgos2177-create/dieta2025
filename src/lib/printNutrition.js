// Build a self-contained printable HTML for the day's nutrition plan.
// Output: a complete HTML string ready for window.document.write(...) + window.print().

import { computeFoodMacros, sumEntries } from './calculators.js';

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function fmtNum(n, decimals = 0) {
  if (!isFinite(n)) return '0';
  return decimals === 0
    ? Math.round(n).toString()
    : Number(n.toFixed(decimals)).toString();
}

/** Resolve display amount/unit for an entry (uses equivalence label if matches). */
function entryDisplay(entry, food) {
  if (!food) return { qty: '?', unit: '', canonical: '' };
  const canonical = `${fmtNum(entry.amount, entry.amount < 10 ? 1 : 0)} ${food.servingUnit}`;
  if (entry.unit && entry.unit !== food.servingUnit) {
    const eq = (food.equivalences || []).find((e) => e.label === entry.unit);
    if (eq && Number(eq.amount) > 0) {
      const n = entry.amount / Number(eq.amount);
      const qty = n < 10 ? Number(n.toFixed(2)).toString() : Math.round(n).toString();
      return { qty, unit: entry.unit, canonical };
    }
  }
  const qty = fmtNum(entry.amount, entry.amount < 10 ? 1 : 0);
  return { qty, unit: food.servingUnit, canonical: '' };
}

const DAY_TYPE_LABEL = {
  high: 'ALTO',
  low: 'BAJO',
  normo: 'NORMO',
};

/** Render meal sections for a single day plan. Returns HTML string. */
function renderMealSections(meals, dayPlan, foodsById) {
  return meals.map((meal) => {
    const entries = dayPlan[meal.id] || [];
    const t = sumEntries(entries, foodsById);
    const rows = entries.length === 0
      ? `<tr><td colspan="6" class="empty">— sin alimentos —</td></tr>`
      : entries.map((e) => {
          const f = foodsById[e.foodId];
          if (!f) return '';
          const m = computeFoodMacros(f, e.amount);
          const disp = entryDisplay(e, f);
          const qtyStr = disp.canonical
            ? `${disp.qty} ${escapeHtml(disp.unit)} <span class="canon">(${escapeHtml(disp.canonical)})</span>`
            : `${disp.qty} ${escapeHtml(disp.unit)}`;
          const name = f.brand
            ? `${escapeHtml(f.name)} <span class="brand">· ${escapeHtml(f.brand)}</span>`
            : escapeHtml(f.name);
          return `
            <tr class="entry">
              <td class="check"><span class="box"></span></td>
              <td class="name">${name}</td>
              <td class="qty">${qtyStr}</td>
              <td class="num right">${fmtNum(m.kcal)}</td>
              <td class="num right">${fmtNum(m.prot, 1)}g</td>
              <td class="num right">${fmtNum(m.carb, 1)}g</td>
              <td class="num right">${fmtNum(m.fat, 1)}g</td>
            </tr>`;
        }).join('');

    return `
      <section class="meal">
        <div class="meal-h">
          <div class="meal-name">${escapeHtml(meal.icon || '')} ${escapeHtml(meal.label)}</div>
          <div class="meal-kcal">${fmtNum(t.kcal)} kcal</div>
        </div>
        ${meal.sub ? `<div class="meal-sub">${escapeHtml(meal.sub)}</div>` : ''}
        <table>
          <thead>
            <tr>
              <th></th>
              <th>Alimento</th>
              <th>Cantidad</th>
              <th class="right">Kcal</th>
              <th class="right">P</th>
              <th class="right">CH</th>
              <th class="right">G</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="meal-totals">
          Subtotal: <strong>${fmtNum(t.kcal)} kcal</strong> ·
          P ${fmtNum(t.prot, 1)}g · CH ${fmtNum(t.carb, 1)}g · G ${fmtNum(t.fat, 1)}g
        </div>
      </section>`;
  }).join('');
}

function renderSummary(targets, totals, micros) {
  const microRow = (label, value, target, unit, type) => {
    const ok = type === 'goal' ? value >= target : value <= target;
    return `<span class="micro ${ok ? 'ok' : 'bad'}">${escapeHtml(label)}: <strong>${fmtNum(value, value < 10 ? 1 : 0)}${unit}</strong> ${type === 'goal' ? '/ ' : '/ <'}${target}${unit}</span>`;
  };
  return `
    <section class="summary">
      <h2>TOTAL DEL DÍA</h2>
      <div class="grid">
        <div class="stat"><div class="l">Kcal</div><div class="v">${fmtNum(totals.kcal)}<small> / ${targets.kcal}</small></div></div>
        <div class="stat"><div class="l">Proteína</div><div class="v">${fmtNum(totals.prot)}<small>g / ${targets.protG}g</small></div></div>
        <div class="stat"><div class="l">Carbs</div><div class="v">${fmtNum(totals.carb)}<small>g / ${targets.carbG}g</small></div></div>
        <div class="stat"><div class="l">Grasas</div><div class="v">${fmtNum(totals.fat)}<small>g / ${targets.lipG}g</small></div></div>
      </div>
      <div class="micros">
        ${microRow('Fibra',  totals.fiber,  micros.fiber.target,  micros.fiber.unit,  micros.fiber.type)}
        ${microRow('Azúcar', totals.sugar,  micros.sugar.target,  micros.sugar.unit,  micros.sugar.type)}
        ${microRow('Sodio',  totals.sodium, micros.sodium.target, micros.sodium.unit, micros.sodium.type)}
      </div>
    </section>`;
}

/**
 * Build the printable HTML.
 *
 * Modes:
 * - Single day: pass `day`, `date`, `dayType`, `targets`, `totals`, `dayPlan`.
 * - Multiple sections (week / grouped week): pass `sections` = [{
 *     title,        // e.g. "Lunes · Miércoles · Viernes"
 *     subtitle,     // e.g. "Día ALTO · 3,234 kcal"
 *     dayPlan,      // the meal plan to render
 *     targets,      // { kcal, protG, carbG, lipG }
 *     totals,       // sumEntries result
 *   }]
 */
export function buildNutritionPrintHTML(opts) {
  const {
    profile,
    meals,
    foodsById,
    micros,
    title: customTitle,
    subtitle: customSubtitle,
    sections,
    // Single-day fields (when sections not provided)
    day,
    date,
    dayType,
    targets,
    totals,
    dayPlan,
  } = opts;

  const printDate = date ? new Date(date) : new Date();
  const dateStr = printDate.toLocaleDateString('es-MX', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  });
  const genStr = new Date().toLocaleString('es-MX');

  // Build sections
  const list = sections && sections.length > 0
    ? sections
    : [{
        title: day?.name?.toUpperCase?.() || 'DÍA',
        subtitle: `Día ${DAY_TYPE_LABEL[dayType] || ''} · Objetivo ${targets.kcal} kcal`,
        dayPlan,
        targets,
        totals,
      }];

  const headerTitle = customTitle || (sections ? 'PLAN NUTRICIONAL · SEMANA' : `PLAN NUTRICIONAL · ${day?.name?.toUpperCase() || ''}`);
  const headerSubtitle = customSubtitle || (sections
    ? `${escapeHtml(profile?.nombre || 'Plan personal')}`
    : `${escapeHtml(profile?.nombre || 'Plan personal')} · ${escapeHtml(dateStr)}${day?.workout && day.workout !== 'Descanso' ? ` · Entreno: ${escapeHtml(day.workout)}` : ''}`);

  const sectionsHtml = list.map((sec, i) => `
    <section class="day-section ${i > 0 ? 'page-break-before' : ''}">
      <div class="section-h">
        <h2>${escapeHtml(sec.title)}</h2>
        <div class="section-sub">${escapeHtml(sec.subtitle || '')}</div>
      </div>
      ${renderMealSections(meals, sec.dayPlan || {}, foodsById)}
      ${renderSummary(sec.targets, sec.totals, micros)}
    </section>
  `).join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>${escapeHtml(headerTitle)}</title>
<style>
  @page { size: A4; margin: 12mm; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font: 10.5pt/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    color: #111;
    background: #fff;
    max-width: 190mm;
    margin: 0 auto;
    padding: 0;
  }
  header { border-bottom: 2pt solid #111; padding-bottom: 6pt; margin-bottom: 8pt; }
  h1 { font-size: 18pt; margin: 0 0 2pt; letter-spacing: 0.05em; font-weight: 800; }
  .meta { color: #555; font-size: 9.5pt; }
  .day-section { page-break-inside: avoid; }
  .day-section.page-break-before { page-break-before: always; }
  .section-h { margin: 12pt 0 6pt; padding-bottom: 4pt; border-bottom: 1.5pt solid #444; }
  .section-h h2 { font-size: 14pt; margin: 0; letter-spacing: 0.04em; font-weight: 700; }
  .section-sub { font-size: 10pt; color: #555; margin-top: 2pt; }
  .targets {
    font-size: 10pt;
    padding: 6pt 8pt;
    background: #f4f4f4;
    border-radius: 4pt;
    margin: 8pt 0 12pt;
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 4pt;
  }
  .pill {
    display: inline-block;
    padding: 1pt 6pt;
    background: #111;
    color: #fff;
    border-radius: 3pt;
    font-size: 9pt;
    letter-spacing: 0.05em;
    font-weight: 700;
  }
  .meal {
    margin-top: 10pt;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .meal:not(:first-of-type) { border-top: 1pt solid #ddd; padding-top: 8pt; }
  .meal-h { display: flex; justify-content: space-between; align-items: baseline; }
  .meal-name { font-size: 13pt; font-weight: 700; letter-spacing: 0.04em; }
  .meal-kcal { font-size: 12pt; font-weight: 700; }
  .meal-sub { font-size: 9pt; color: #777; margin-top: 1pt; }
  table { width: 100%; border-collapse: collapse; margin-top: 4pt; font-size: 10pt; }
  th, td { padding: 3pt 4pt; text-align: left; vertical-align: middle; }
  th {
    font-size: 8pt;
    text-transform: uppercase;
    color: #666;
    border-bottom: 0.5pt solid #999;
    font-weight: 600;
    letter-spacing: 0.04em;
  }
  tr.entry td { border-bottom: 0.3pt solid #eee; }
  td.right, th.right { text-align: right; }
  td.num { font-variant-numeric: tabular-nums; white-space: nowrap; }
  td.qty { font-variant-numeric: tabular-nums; white-space: nowrap; }
  td.canon, .canon { color: #999; font-size: 8.5pt; }
  td.brand, .brand { color: #888; font-weight: normal; }
  td.check { width: 10pt; }
  .box {
    display: inline-block;
    width: 8pt; height: 8pt;
    border: 0.7pt solid #333;
    border-radius: 1pt;
    vertical-align: middle;
  }
  td.empty { color: #999; font-style: italic; padding: 6pt 4pt; text-align: center; }
  .meal-totals { margin-top: 4pt; font-size: 9pt; color: #444; padding-left: 14pt; }
  .summary {
    margin-top: 14pt;
    border-top: 2pt solid #111;
    padding-top: 8pt;
    page-break-inside: avoid;
  }
  .summary h2 { font-size: 13pt; margin: 0 0 6pt; letter-spacing: 0.05em; }
  .grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 4pt;
    margin-bottom: 6pt;
  }
  .stat {
    border: 0.5pt solid #ddd;
    border-radius: 3pt;
    padding: 4pt 6pt;
  }
  .stat .l { font-size: 8pt; color: #777; text-transform: uppercase; letter-spacing: 0.05em; }
  .stat .v { font-size: 13pt; font-weight: 700; font-variant-numeric: tabular-nums; }
  .stat .v small { font-size: 9pt; color: #777; font-weight: 400; }
  .micros { font-size: 9.5pt; padding-top: 4pt; display: flex; gap: 8pt; flex-wrap: wrap; }
  .micro.ok { color: #166534; }
  .micro.bad { color: #991b1b; }
  .footer {
    margin-top: 16pt;
    font-size: 8pt;
    color: #aaa;
    text-align: center;
    border-top: 0.3pt solid #eee;
    padding-top: 6pt;
  }
  @media screen {
    body { padding: 16pt; max-width: 720pt; box-shadow: 0 0 20pt rgba(0,0,0,0.1); margin-top: 12pt; margin-bottom: 12pt; }
    .toolbar {
      position: fixed; top: 8pt; right: 8pt;
      background: #111; color: #fff; padding: 6pt 12pt; border-radius: 4pt;
      font-size: 11pt; cursor: pointer; box-shadow: 0 2pt 8pt rgba(0,0,0,0.2);
      border: none;
    }
  }
  @media print { .toolbar { display: none; } }
</style>
</head>
<body>
  <button class="toolbar" onclick="window.print()">🖨 Imprimir / Guardar PDF</button>
  <header>
    <h1>${escapeHtml(headerTitle)}</h1>
    <div class="meta">${headerSubtitle}</div>
  </header>

  ${sectionsHtml}

  <div class="footer">Generado por App Entrenamiento · ${escapeHtml(genStr)}</div>
</body>
</html>`;
}

/**
 * Compute a stable signature for a day plan to detect duplicates.
 * Two days are equivalent if they have the same meals with the same
 * (foodId, amount, unit) entries.
 */
export function dayPlanSignature(meals, dayPlan) {
  return meals.map((m) => {
    const entries = (dayPlan?.[m.id] || []).map((e) => `${e.foodId}:${Number(e.amount) || 0}:${e.unit || ''}`).sort();
    return `${m.id}{${entries.join(',')}}`;
  }).join('|');
}

/** Returns true if the day plan has at least one entry. */
export function dayPlanHasEntries(meals, dayPlan) {
  for (const m of meals) {
    if ((dayPlan?.[m.id] || []).length > 0) return true;
  }
  return false;
}
