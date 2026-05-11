import { useState } from 'react';
import Card from '../ui/Card.jsx';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase.js';
import { useFoodStore } from '../../store/useFoodStore.js';
import { useNutritionStore } from '../../store/useNutritionStore.js';
import { useTrainingStore } from '../../store/useTrainingStore.js';
import { useSupplementStore } from '../../store/useSupplementStore.js';
import { useProfileStore } from '../../store/useProfileStore.js';
import { useBodyLogStore } from '../../store/useBodyLogStore.js';
import { showToast } from '../ui/Toast.jsx';

const SEED_FOOD_IDS = new Set([
  'f001','f002','f003','f004','f005','f006','f007','f008','f009','f010',
  'f011','f012','f013','f014','f015',
]);

function countFoodIdsInNutrition(d) {
  const ids = new Set();
  Object.values(d?.template || {}).forEach((day) =>
    Object.values(day || {}).forEach((meal) =>
      (meal || []).forEach((e) => ids.add(e.foodId))
    )
  );
  Object.values(d?.weeks || {}).forEach((wk) =>
    Object.values(wk || {}).forEach((day) =>
      Object.values(day || {}).forEach((meal) =>
        (meal || []).forEach((e) => ids.add(e.foodId))
      )
    )
  );
  return ids;
}

export default function DiagnosticCard() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const inspect = async () => {
    setLoading(true);
    const local = {};
    const cloud = {};
    const keys = ['foods', 'nutrition', 'training', 'supplements', 'profile', 'bodylog'];

    // Local in-memory state (the live React stores)
    local.foods = useFoodStore.getState().foods;
    local.nutrition = {
      template: useNutritionStore.getState().template,
      weeks: useNutritionStore.getState().weeks,
      mesocycles: useNutritionStore.getState().mesocycles,
      presets: useNutritionStore.getState().presets,
    };
    local.training = useTrainingStore.getState();
    local.supplements = useSupplementStore.getState();
    local.profile = useProfileStore.getState();
    local.bodylog = useBodyLogStore.getState();

    // Cloud (Firestore)
    for (const k of keys) {
      try {
        const snap = await getDoc(doc(db, 'dieta2025', k));
        cloud[k] = snap.exists() ? snap.data() : null;
      } catch (e) {
        cloud[k] = { __error: e.message };
      }
    }

    // Summary
    const customLocal = (local.foods || []).filter((f) => !SEED_FOOD_IDS.has(f.id));
    const customCloud = (cloud.foods?.foods || []).filter((f) => !SEED_FOOD_IDS.has(f.id));
    const nutLocalIds = countFoodIdsInNutrition(local.nutrition);
    const nutCloudIds = countFoodIdsInNutrition(cloud.nutrition);

    setResult({
      local: {
        foodsTotal: local.foods?.length || 0,
        foodsCustom: customLocal.length,
        foodsCustomNames: customLocal.map((f) => f.name),
        nutritionTemplateDays: Object.keys(local.nutrition.template || {}).length,
        nutritionWeeks: Object.keys(local.nutrition.weeks || {}).length,
        nutritionMesocycles: local.nutrition.mesocycles?.length || 0,
        nutritionPresets: local.nutrition.presets?.length || 0,
        nutritionFoodIds: nutLocalIds.size,
        trainingMesocycles: local.training.mesocycles?.length || 0,
        trainingPresets: local.training.workoutPresets?.length || 0,
        trainingWeeks: Object.keys(local.training.weeks || {}).length,
        supplementsLibrary: local.supplements.library?.length || 0,
        supplementsProtocols: local.supplements.protocols?.length || 0,
        bodylogEntries: local.bodylog.entries?.length || 0,
      },
      cloud: {
        foodsTotal: cloud.foods?.foods?.length ?? '— (no doc)',
        foodsCustom: customCloud.length,
        foodsCustomNames: customCloud.map((f) => f.name),
        nutritionTemplateDays: Object.keys(cloud.nutrition?.template || {}).length,
        nutritionWeeks: Object.keys(cloud.nutrition?.weeks || {}).length,
        nutritionMesocycles: cloud.nutrition?.mesocycles?.length ?? 0,
        nutritionPresets: cloud.nutrition?.presets?.length ?? 0,
        nutritionFoodIds: nutCloudIds.size,
        trainingMesocycles: cloud.training?.mesocycles?.length ?? 0,
        trainingPresets: cloud.training?.workoutPresets?.length ?? 0,
        trainingWeeks: Object.keys(cloud.training?.weeks || {}).length,
        supplementsLibrary: cloud.supplements?.library?.length ?? 0,
        supplementsProtocols: cloud.supplements?.protocols?.length ?? 0,
        bodylogEntries: cloud.bodylog?.entries?.length ?? 0,
        errors: keys.filter((k) => cloud[k]?.__error).map((k) => `${k}: ${cloud[k].__error}`),
      },
      rawCloud: cloud,
      rawLocal: local,
    });
    setLoading(false);
  };

  const pushLocalToCloud = async () => {
    if (!confirm('¿SOBRESCRIBIR la nube con tu estado local actual?\n\nÚsalo solo si tu local tiene más data que la nube. No se puede deshacer.')) return;
    try {
      const s = {
        foods: { foods: useFoodStore.getState().foods, categories: useFoodStore.getState().categories },
        nutrition: {
          template: useNutritionStore.getState().template,
          weeks: useNutritionStore.getState().weeks,
          meals: useNutritionStore.getState().meals,
          presets: useNutritionStore.getState().presets,
          mesocycles: useNutritionStore.getState().mesocycles,
          activeMesocycleId: useNutritionStore.getState().activeMesocycleId,
        },
        training: (() => {
          const t = useTrainingStore.getState();
          return {
            template: t.template, weeks: t.weeks, log: t.log, library: t.library,
            workoutPresets: t.workoutPresets, mesocycles: t.mesocycles,
            activeMesocycleId: t.activeMesocycleId, extraSessions: t.extraSessions,
          };
        })(),
        supplements: (() => {
          const x = useSupplementStore.getState();
          return { library: x.library, intake: x.intake, protocols: x.protocols };
        })(),
        profile: (() => {
          const { setField, setMacros, _initCloud, ...rest } = useProfileStore.getState();
          return rest;
        })(),
        bodylog: { entries: useBodyLogStore.getState().entries.map(({ photo, ...e }) => e) },
      };
      for (const [k, v] of Object.entries(s)) {
        await setDoc(doc(db, 'dieta2025', k), v);
      }
      showToast('Estado local subido a la nube', 'ok');
    } catch (e) {
      showToast('Error subiendo a la nube', 'error');
      console.error(e);
    }
  };

  return (
    <Card title="Diagnóstico (debug)">
      <div className="text-xs text-muted mb-3">
        Compara tu state local con lo que hay en Firebase ahora mismo. Útil cuando algo no cuadra
        entre dispositivos o sospechas pérdida de datos.
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={inspect}
          disabled={loading}
          className="px-4 py-2 text-sm rounded-lg bg-accent text-black font-semibold hover:brightness-110 disabled:opacity-50"
        >
          {loading ? '…' : '🔍 Inspeccionar local + Firebase'}
        </button>
        <button
          onClick={pushLocalToCloud}
          className="px-4 py-2 text-sm rounded-lg border border-warn/40 text-warn hover:bg-warn/10"
        >
          ⬆ Forzar push local → Firebase
        </button>
      </div>

      {result && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <Section title="📱 Local (este navegador)" data={result.local} />
          <Section title="☁️ Firebase" data={result.cloud} />
        </div>
      )}
    </Card>
  );
}

function Section({ title, data }) {
  return (
    <div className="bg-white/[0.02] border border-border rounded-lg p-3">
      <div className="font-display text-xs uppercase tracking-wider text-white mb-2">{title}</div>
      <div className="space-y-1 font-mono text-[0.7rem]">
        {Object.entries(data).map(([k, v]) => (
          <div key={k} className="flex justify-between items-baseline gap-2">
            <span className="text-muted">{k}</span>
            <span className="text-white text-right truncate max-w-[60%]" title={Array.isArray(v) ? v.join(', ') : String(v)}>
              {Array.isArray(v) ? `[${v.length}] ${v.slice(0, 3).join(', ')}${v.length > 3 ? '…' : ''}` : String(v)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
