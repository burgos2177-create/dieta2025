/**
 * Helpers para sincronizar los stores de Zustand con Firestore.
 * - cloudLoad(key)      → lee el documento dieta2025/{key}
 * - cloudSave(key, data) → escribe con debounce de 1.5 s
 */
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase.js';

const COL = 'dieta2025';
const timers = {};

export async function cloudLoad(key) {
  try {
    const snap = await getDoc(doc(db, COL, key));
    return snap.exists() ? snap.data() : null;
  } catch (e) {
    console.warn('[cloud] load error:', key, e.message);
    return null;
  }
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
