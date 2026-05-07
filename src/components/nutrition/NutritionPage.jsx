import { useMemo, useState } from 'react';
import Card from '../ui/Card.jsx';
import MacroBar from '../ui/MacroBar.jsx';
import DaySelector from '../dashboard/DaySelector.jsx';
import AddFoodModal from './AddFoodModal.jsx';
import MealFormModal from './MealFormModal.jsx';
import SavePresetModal from './SavePresetModal.jsx';
import ApplyPresetModal from './ApplyPresetModal.jsx';
import PresetsManagerModal from './PresetsManagerModal.jsx';
import { useNutritionStore } from '../../store/useNutritionStore.js';
import { useFoodStore } from '../../store/useFoodStore.js';
import { useProfileStore } from '../../store/useProfileStore.js';
import { DAYS } from '../../lib/constants.js';
import {
  calcTMB, calcTDEE, kcalForDay, macrosForKcal,
  sumEntries, computeFoodMacros,
} from '../../lib/calculators.js';
import { showToast } from '../ui/Toast.jsx';

export default function NutritionPage() {
  const {
    plan, meals, presets, activeDay,
    setActiveDay, addEntry, updateEntry, removeEntry,
    addMeal, updateMeal, removeMeal, moveMeal,
    savePreset, removePreset, renamePreset, applyPreset,
  } = useNutritionStore();
  const foods = useFoodStore((s) => s.foods);
  const p = useProfileStore();

  const [modalMeal, setModalMeal] = useState(null);
  const [openMeals, setOpenMeals] = useState({});
  const [mealForm, setMealForm] = useState(null);          // {mode, meal?}
  const [savePresetFor, setSavePresetFor] = useState(null); // {mealId, mealLabel, entries}
  const [applyPresetFor, setApplyPresetFor] = useState(null); // {mealId, mealLabel}
  const [presetsOpen, setPresetsOpen] = useState(false);

  const foodsById = useMemo(() => Object.fromEntries(foods.map((f) => [f.id, f])), [foods]);

  const targets = useMemo(() => {
    const tmb = calcTMB(p.sexo, p.peso, p.altura, p.edad);
    const tdee = calcTDEE(tmb, p.act);
    const kcal = Math.round(kcalForDay(activeDay, tdee, p.highPct, p.lowPct));
    const m = macrosForKcal(kcal, p.carb, p.prot, p.lip);
    return { kcal, ...m };
  }, [p, activeDay]);

  const dayPlan = plan[activeDay] || {};
  const totals = useMemo(() => {
    const all = meals.flatMap((m) => dayPlan[m.id] || []);
    return sumEntries(all, foodsById);
  }, [dayPlan, meals, foodsById]);

  const gap = {
    kcal: targets.kcal - totals.kcal,
    prot: targets.protG - totals.prot,
    carb: targets.carbG - totals.carb,
    fat:  targets.lipG  - totals.fat,
  };

  const isOpen = (id) => openMeals[id] !== false;
  const toggleMeal = (id) =>
    setOpenMeals((s) => ({ ...s, [id]: s[id] === false ? true : false }));

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="font-display text-3xl tracking-wider">NUTRICIÓN</h1>
          <p className="text-muted text-sm">Plan diario por tiempos de comida · {DAYS[activeDay].name}</p>
        </div>
      </div>

      <DaySelector active={activeDay} onChange={setActiveDay} />

      {/* Macro header */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <div className="flex items-baseline justify-between mb-2">
              <span className="font-display text-sm tracking-wider text-muted">KCAL DEL DÍA</span>
              <span className="font-mono text-xl">
                <span className="text-white">{totals.kcal.toFixed(0)}</span>
                <span className="text-muted"> / {targets.kcal}</span>
              </span>
            </div>
            <MacroBar label="Consumo total" value={totals.kcal} target={targets.kcal} color="#00e5ff" unit="kcal" />
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <DevLabel label="kcal" diff={-gap.kcal} target={targets.kcal} />
              <DevLabel label="P"   diff={-gap.prot} target={targets.protG} unit="g" />
              <DevLabel label="CH"  diff={-gap.carb} target={targets.carbG} unit="g" />
              <DevLabel label="G"   diff={-gap.fat}  target={targets.lipG}  unit="g" />
            </div>
          </div>
          <div className="space-y-3">
            <MacroBar label="Proteína"      value={totals.prot} target={targets.protG} color="#22c55e" />
            <MacroBar label="Carbohidratos" value={totals.carb} target={targets.carbG} color="#00e5ff" />
            <MacroBar label="Grasas"        value={totals.fat}  target={targets.lipG}  color="#f59e0b" />
          </div>
        </div>
      </Card>

      {/* Meals */}
      <div className="grid grid-cols-1 gap-4">
        {meals.map((meal, mi) => {
          const entries = dayPlan[meal.id] || [];
          const mt = sumEntries(entries, foodsById);
          const open = isOpen(meal.id);
          return (
            <Card key={meal.id} pad={false}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => toggleMeal(meal.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleMeal(meal.id);
                  }
                }}
                className="w-full flex items-center justify-between gap-3 px-5 py-4 hover:bg-white/[0.02] transition cursor-pointer outline-none focus:ring-1 focus:ring-accent/40 rounded-card"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl">{meal.icon}</span>
                  <div className="text-left min-w-0">
                    <div className="font-display text-lg text-white tracking-wide truncate">{meal.label}</div>
                    <div className="text-xs text-muted truncate">
                      {meal.sub ? `${meal.sub} · ` : ''}{entries.length} alimento{entries.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="font-mono text-base text-accent">{mt.kcal.toFixed(0)} kcal</div>
                    <div className="text-[0.65rem] text-muted">
                      P {mt.prot.toFixed(0)}g · CH {mt.carb.toFixed(0)}g · G {mt.fat.toFixed(0)}g
                    </div>
                  </div>
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="hidden sm:flex flex-col gap-0.5"
                  >
                    <button
                      onClick={() => moveMeal(meal.id, 'up')}
                      disabled={mi === 0}
                      className="text-muted hover:text-accent text-xs px-1 disabled:opacity-20"
                      title="Subir"
                      aria-label="Subir"
                    >▲</button>
                    <button
                      onClick={() => moveMeal(meal.id, 'down')}
                      disabled={mi === meals.length - 1}
                      className="text-muted hover:text-accent text-xs px-1 disabled:opacity-20"
                      title="Bajar"
                      aria-label="Bajar"
                    >▼</button>
                  </div>
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1"
                  >
                    <button
                      onClick={() => setMealForm({ mode: 'edit', meal })}
                      className="text-muted hover:text-accent px-2 py-1"
                      title="Editar comida"
                      aria-label="Editar comida"
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => {
                        if (meals.length <= 1) {
                          showToast('Debe quedar al menos una comida', 'error');
                          return;
                        }
                        if (confirm(`¿Eliminar "${meal.label}"? Se borrará en todos los días.`)) {
                          removeMeal(meal.id);
                          showToast('Comida eliminada');
                        }
                      }}
                      className="text-muted hover:text-bad px-2 py-1"
                      title="Eliminar comida"
                      aria-label="Eliminar comida"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              </div>

              {open && (
                <div className="border-t border-border px-5 py-4 space-y-2">
                  {entries.length === 0 && (
                    <div className="text-sm text-muted text-center py-3">Sin alimentos</div>
                  )}
                  {entries.map((e, ei) => {
                    const f = foodsById[e.foodId];
                    if (!f) return null;
                    const m = computeFoodMacros(f, e.amount);
                    return (
                      <div
                        key={ei}
                        className="flex flex-col sm:flex-row sm:items-center gap-2 bg-white/[0.02] border border-border rounded-lg px-3 py-2"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-white truncate">{f.name}</div>
                          <div className="text-[0.65rem] text-muted">
                            P {m.prot.toFixed(1)}g · CH {m.carb.toFixed(1)}g · G {m.fat.toFixed(1)}g
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={e.amount}
                            onChange={(ev) => updateEntry(activeDay, meal.id, ei, Number(ev.target.value) || 0)}
                            className="!w-20 !py-1 !px-2 text-sm text-right"
                          />
                          <span className="text-xs text-muted w-10">{f.servingUnit}</span>
                          <div className="font-mono text-sm text-accent w-16 text-right">
                            {m.kcal.toFixed(0)}
                          </div>
                          <button
                            onClick={() => {
                              removeEntry(activeDay, meal.id, ei);
                              showToast('Alimento eliminado');
                            }}
                            className="text-muted hover:text-bad px-2"
                            aria-label="Eliminar"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                    <button
                      onClick={() => setModalMeal(meal.id)}
                      className="border border-dashed border-border rounded-lg py-2 text-sm text-muted hover:text-accent hover:border-accent/40 transition"
                    >
                      ＋ Agregar alimento
                    </button>
                    <button
                      onClick={() => setApplyPresetFor({ mealId: meal.id, mealLabel: meal.label })}
                      className="border border-dashed border-border rounded-lg py-2 text-sm text-muted hover:text-accent hover:border-accent/40 transition"
                    >
                      📋 Aplicar preset
                    </button>
                    <button
                      onClick={() => setSavePresetFor({ mealId: meal.id, mealLabel: meal.label, entries })}
                      disabled={entries.length === 0}
                      className="border border-dashed border-border rounded-lg py-2 text-sm text-muted hover:text-accent hover:border-accent/40 transition disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-muted disabled:hover:border-border"
                    >
                      💾 Guardar preset
                    </button>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Footer actions */}
      <div className="flex flex-col sm:flex-row gap-2">
        <button
          onClick={() => setMealForm({ mode: 'add' })}
          className="flex-1 border border-border bg-white/[0.02] hover:bg-white/[0.05] rounded-lg py-3 text-sm text-white transition"
        >
          ＋ Añadir comida
        </button>
        <button
          onClick={() => setPresetsOpen(true)}
          className="flex-1 border border-border bg-white/[0.02] hover:bg-white/[0.05] rounded-lg py-3 text-sm text-white transition"
        >
          📋 Gestionar presets ({presets.length})
        </button>
      </div>

      {/* Modals */}
      <AddFoodModal
        open={!!modalMeal}
        onClose={() => setModalMeal(null)}
        gap={gap}
        onAdd={(entry) => {
          addEntry(activeDay, modalMeal, entry);
          showToast('✅ Alimento agregado', 'ok');
        }}
      />

      <MealFormModal
        open={!!mealForm}
        mode={mealForm?.mode}
        initial={mealForm?.meal}
        onClose={() => setMealForm(null)}
        onSubmit={(data) => {
          if (mealForm?.mode === 'edit') {
            updateMeal(mealForm.meal.id, data);
            showToast('Comida actualizada', 'ok');
          } else {
            addMeal(data);
            showToast('Comida añadida', 'ok');
          }
        }}
      />

      <SavePresetModal
        open={!!savePresetFor}
        onClose={() => setSavePresetFor(null)}
        entries={savePresetFor?.entries}
        foodsById={foodsById}
        mealLabel={savePresetFor?.mealLabel}
        onSubmit={({ name, entries }) => {
          savePreset({ name, entries });
          showToast('Preset guardado', 'ok');
        }}
      />

      <ApplyPresetModal
        open={!!applyPresetFor}
        onClose={() => setApplyPresetFor(null)}
        presets={presets}
        foodsById={foodsById}
        mealLabel={applyPresetFor?.mealLabel}
        onApply={(presetId, mode) => {
          applyPreset(activeDay, applyPresetFor.mealId, presetId, mode);
          showToast(mode === 'replace' ? 'Preset aplicado (reemplazado)' : 'Preset aplicado', 'ok');
        }}
      />

      <PresetsManagerModal
        open={presetsOpen}
        onClose={() => setPresetsOpen(false)}
        presets={presets}
        foodsById={foodsById}
        onRename={(id, name) => {
          renamePreset(id, name);
          showToast('Preset renombrado');
        }}
        onRemove={(id) => {
          removePreset(id);
          showToast('Preset eliminado');
        }}
      />
    </div>
  );
}

function DevLabel({ label, diff, target, unit = 'kcal' }) {
  const pct = target > 0 ? Math.abs(diff) / target : 0;
  const ok = pct <= 0.05;
  const sign = diff >= 0 ? '+' : '';
  const tone = ok ? 'bg-ok/15 text-ok border-ok/30' : diff > 0 ? 'bg-bad/15 text-bad border-bad/30' : 'bg-warn/15 text-warn border-warn/30';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border text-[0.7rem] font-mono ${tone}`}>
      <span className="opacity-70">{label}</span> {sign}{diff.toFixed(1)}{unit === 'g' ? 'g' : ''}
    </span>
  );
}
