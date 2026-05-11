/**
 * Backup completo: serializa los 6 stores de Zustand a un archivo JSON
 * descargable, y permite restaurarlos. Útil ante caída de cloud sync o
 * para mover datos entre dispositivos manualmente.
 */
import { useProfileStore } from '../store/useProfileStore.js';
import { useNutritionStore } from '../store/useNutritionStore.js';
import { useFoodStore } from '../store/useFoodStore.js';
import { useTrainingStore } from '../store/useTrainingStore.js';
import { useBodyLogStore } from '../store/useBodyLogStore.js';
import { useSupplementStore } from '../store/useSupplementStore.js';

const APP_VERSION = 1;

/** Lee el state actual (vía localStorage para evitar circular imports). */
function readStore(key) {
  try {
    const raw = localStorage.getItem(`dieta2025_${key}`);
    return raw ? JSON.parse(raw)?.state || {} : {};
  } catch {
    return {};
  }
}

export function buildBackup() {
  return {
    app: 'app-entrenamiento',
    version: APP_VERSION,
    exportedAt: new Date().toISOString(),
    stores: {
      profile:     readStore('profile'),
      nutrition:   readStore('nutrition'),
      foods:       readStore('foods'),
      training:    readStore('training'),
      bodylog:     readStore('bodylog'),
      supplements: readStore('supplements'),
    },
  };
}

export function downloadBackup() {
  const data = buildBackup();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const ts = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
  a.href = url;
  a.download = `app-entrenamiento-backup-${ts}.json`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

/**
 * Restaura un backup en TODOS los stores. Esto REEMPLAZA cualquier dato actual.
 * Para preservar fotos del bodyLog y no romper sincronización, recargamos
 * la página después.
 */
export function restoreBackup(payload) {
  if (!payload || typeof payload !== 'object') throw new Error('Backup vacío o malformado.');
  if (!payload.stores) throw new Error('El archivo no tiene el campo "stores".');

  const apply = (key, store) => {
    const data = payload.stores[key];
    if (!data || typeof data !== 'object') return;
    try {
      store.setState(data, true /* replace */);
    } catch (e) {
      console.warn(`[backup] no se pudo restaurar ${key}:`, e.message);
    }
  };

  apply('profile',     useProfileStore);
  apply('nutrition',   useNutritionStore);
  apply('foods',       useFoodStore);
  apply('training',    useTrainingStore);
  apply('bodylog',     useBodyLogStore);
  apply('supplements', useSupplementStore);
}

export async function restoreFromFile(file) {
  const text = await file.text();
  const data = JSON.parse(text);
  restoreBackup(data);
  return data;
}
