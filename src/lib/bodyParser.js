// ==============================
// Body Composition Report — Auto Parser
// ==============================
//
// This module is the single entry point for automatically extracting body
// composition data from a report image (e.g. the Xiaomi / Huawei / Renpho
// 8-electrode smart scale PDF/PNG reports).
//
// The current `parseBodyReport` is a STUB: it returns an empty object and
// does NOT perform any real OCR. The whole UI is wired so that the moment
// a real implementation is plugged in here, everything starts working with
// zero UI changes.
//
// ------------------------------------------------------------------
// HOW TO PLUG A REAL IMPLEMENTATION LATER
// ------------------------------------------------------------------
// There are three realistic strategies. Pick one and replace the body of
// `parseBodyReport` keeping the same signature & return shape.
//
// 1) CLOUD AI (recommended, highest accuracy)
//    - Requires adding a tiny backend endpoint (Cloudflare Worker / Express
//      route / GitHub Pages Action proxy).
//    - Forward the image DataURL to Anthropic's Messages API with a vision
//      content block and a system prompt like the one in PROMPT_TEMPLATE
//      below. Ask the model to respond with strict JSON matching the keys
//      in lib/bodyFields.js.
//    - Example:
//        const res = await fetch('/api/parseBody', {
//          method: 'POST',
//          body: JSON.stringify({ imageDataUrl }),
//        });
//        const json = await res.json();
//        return json;  // partial entry, any missing keys stay untouched
//
// 2) TRAINED MODEL (on-device)
//    - Train a small model (YOLO / Donut / LayoutLM) on a few hundred of
//      YOUR specific reports — the layout is stable so this converges fast.
//    - Export to ONNX, run locally with onnxruntime-web. No backend.
//
// 3) TESSERACT.JS (cheap & immediate, lower accuracy)
//    - npm install tesseract.js
//    - import { createWorker } from 'tesseract.js'
//    - OCR the whole image, then regex-match each label + value using the
//      LABEL_PATTERNS table below. Handles Spanish labels well.
//
// ------------------------------------------------------------------
// RETURN SHAPE
// ------------------------------------------------------------------
// parseBodyReport(imageDataUrl) must return a Promise<Partial<Entry>>
// where keys match those defined in src/lib/bodyFields.js.
// Every field is optional — whatever the parser couldn't extract is
// simply omitted. The form merges the result with whatever the user
// has already typed, preserving manual edits.
//
// Example valid return:
//   {
//     peso: 64.3, grasaKg: 8.3, grasaPct: 12.8,
//     masaMuscular: 52.1, masaOsea: 2.7,
//     imc: 21.2, tmb: 1504, grasaVisceral: 5,
//     muscPiernaIzq: 8.6, muscPiernaDer: 9.0,
//     ...
//   }
//
// ==============================

/**
 * Label → field-key mapping used by the Tesseract-regex strategy.
 * Keep in sync with lib/bodyFields.js keys. When adding a new scale brand,
 * extend the right-hand arrays with the label wording it uses.
 */
export const LABEL_PATTERNS = {
  peso:           [/^peso$/i, /peso corporal/i],
  grasaKg:        [/grasa corporal/i],
  grasaPct:       [/porcentaje de grasa/i, /% grasa/i],
  aguaPct:        [/porcentaje de agua/i, /cantidad de agua/i, /% agua/i],
  masaMuscular:   [/masa muscular/i, /cantidad de m[uú]sculo/i],
  masaOsea:       [/masa [oó]sea/i],

  pesoEstandar:     [/peso est[aá]ndar/i],
  controlGrasa:     [/control de grasa/i, /cantidad de control de grasa/i],
  controlMuscular:  [/control muscular/i, /volumen de control muscular/i],
  controlPeso:      [/control de peso/i, /cantidad de control de peso/i],

  grasaBrazoIzq:  [/brazo izq.*grasa/i],
  grasaBrazoDer:  [/brazo der.*grasa/i],
  grasaTronco:    [/tronco.*grasa/i],
  grasaPiernaIzq: [/pierna izq.*grasa/i],
  grasaPiernaDer: [/pierna der.*grasa/i],

  muscBrazoIzq:  [/brazo izq.*m[uú]sculo/i],
  muscBrazoDer:  [/brazo der.*m[uú]sculo/i],
  muscTronco:    [/tronco.*m[uú]sculo/i],
  muscPiernaIzq: [/pierna izq.*m[uú]sculo/i],
  muscPiernaDer: [/pierna der.*m[uú]sculo/i],

  imc:            [/^imc$/i],
  tmb:            [/^tmb$/i, /^imb$/i, /metabolismo basal/i],
  grasaVisceral:  [/[íi]ndice de grasa visceral/i, /grasa visceral/i],
  tasaMuscular:   [/tasa muscular/i],
  indiceMuscular: [/[íi]ndice (de )?m[uú]sculo/i, /[íi]ndice muscular/i],
  proteinaPct:    [/porcentaje de prote[íi]na/i],
};

/**
 * Prompt template for the Cloud-AI strategy (Claude Vision / GPT-Vision).
 * Send the image + this system prompt; expect a JSON object in return.
 */
export const PROMPT_TEMPLATE = `Eres un extractor estricto de reportes de composición corporal
de básculas inteligentes (Xiaomi, Huawei, Renpho, etc.). Recibirás la
imagen de un reporte. Devuelve EXCLUSIVAMENTE un objeto JSON con las
siguientes llaves (todas opcionales — omite las que no encuentres):

peso, grasaKg, grasaPct, aguaPct, masaMuscular, masaOsea,
pesoEstandar, controlGrasa, controlMuscular, controlPeso,
grasaBrazoIzq, grasaBrazoDer, grasaTronco, grasaPiernaIzq, grasaPiernaDer,
muscBrazoIzq, muscBrazoDer, muscTronco, muscPiernaIzq, muscPiernaDer,
imc, tmb, grasaVisceral, tasaMuscular, indiceMuscular, proteinaPct.

Reglas:
- Todos los valores son numéricos (float). Sin unidades, sin texto.
- "kg" siempre en kilogramos, porcentajes como número (58.2 no 0.582).
- Si un campo no aparece en el reporte, NO lo incluyas.
- Responde únicamente con el JSON, sin prosa.`;

/**
 * Stub parser. Replace with real OCR / API call. See module header.
 * @param {string} imageDataUrl base64 DataURL of the report image
 * @returns {Promise<object>} partial entry keyed by lib/bodyFields.js keys
 */
// eslint-disable-next-line no-unused-vars
export async function parseBodyReport(imageDataUrl) {
  // TODO: implement real parsing. See module header for three strategies.
  // For now, returning empty object means the form stays unchanged and
  // the user fills values manually.
  return {};
}

/**
 * Feature flag: when the real parser is ready, flip this to true so the
 * UI can show the "Leer automáticamente" button as primary/enabled.
 * Keeping this in one place avoids hunting for toggles across components.
 */
export const AUTO_PARSE_ENABLED = false;
