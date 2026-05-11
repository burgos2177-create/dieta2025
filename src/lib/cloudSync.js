/**
 * Helpers para sincronizar los stores de Zustand con Firestore.
 * - cloudLoadSafe(key)  → { ok, found, data } — distingue error vs no existe
 * - cloudLoad(key)      → legacy: devuelve data o null (back-compat)
 * - cloudSave(key, data) → escribe con debounce de 1.5 s
 */
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase.js';

const COL = 'dieta2025';
const timers = {};

/**
 * Lee el documento. Distingue tres casos:
 *  - { ok: true, found: true, data }   → existía y se cargó.
 *  - { ok: true, found: false }        → no existe (primera vez del usuario).
 *  - { ok: false, error }              → error de red/auth — el caller NO
 *    debe tomar esto como "no existe data" porque sobreescribiría la nube
 *    con el state seed local.
 */
export async function cloudLoadSafe(key) {
  try {
    const snap = await getDoc(doc(db, COL, key));
    return { ok: true, found: snap.exists(), data: snap.exists() ? snap.data() : null };
  } catch (e) {
    console.warn('[cloud] load error:', key, e.message);
    return { ok: false, error: e };
  }
}

/** Compat: devuelve la data o null. NO distingue error vs no-existe.
 *  Prefiere cloudLoadSafe para nuevos consumidores. */
export async function cloudLoad(key) {
  const r = await cloudLoadSafe(key);
  if (!r.ok) return null;
  return r.data;
}

export function cloudSave(key, data) {
  clearTimeout(timers[key]);
  timers[key] = setTimeout(async () => {
    try {
      await setDoc(doc(db, COL, key), data);
    } catch (e) {
      console.warn('[cloud] save error:', key, e.message);
    }
  }, 1500);
}
