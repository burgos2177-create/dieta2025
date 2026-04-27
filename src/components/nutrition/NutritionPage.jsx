import { useMemo, useState } from 'react';
import Card from '../ui/Card.jsx';
import Pill from '../ui/Pill.jsx';
import MacroBar from '../ui/MacroBar.jsx';
import { DevDelta } from '../ui/DevBadge.jsx';
import DaySelector from '../dashboard/DaySelector.jsx';
import AddFoodModal from './AddFoodModal.jsx';
import { useNutritionStore } from '../../store/useNutritionStore.js';
import { useFoodStore } from '../../store/useFoodStore.js';
import { useProfileStore } from '../../store/useProfileStore.js';
import { DAYS, MEALS_CONFIG } from '../../lib/constants.js';
import {
  calcTMB, calcTDEE, kcalForDay, macrosForKcal,
  sumEntries, computeFoodMacros,
} from '../../lib/calculators.js';
import { showToast } from '../ui/Toast.jsx';

export default function NutritionPage() {
  const { plan, activeDay, setActiveDay, addEntry, updateEntry, removeEntry } = useNutritionStore();
  const foods = useFoodStore((s) => s.foods);
  const p = useProfileStore();
  const [modalMeal, setModalMeal] = useState(null); // mealId or null
  const [openMeals, setOpenMeals] = useState({ desayuno: true, almuerzo: true, comida: true, cena: true });

  const foodsById = useMemo(() => Object.fromEntries(foods.map((f) => [f.id, f])), [foods]);

  // Targets
  const targets = useMemo(() => {
    const tmb = calcTMB(p.sexo, p.peso, p.altura, p.edad);
    const tdee = calcTDEE(tmb, p.act);
    const kcal = Math.round(kcalForDay(activeDay, tdee, p.highPct, p.lowPct));
    const m = macrosForKcal(kcal, p.carb, p.prot, p.lip);
    return { kcal, ...m };
  }, [p, activeDay]);

  // Totals consumed today across all meals
  const dayPlan = plan[activeDay] || { desayuno: [], almuerzo: [], comida: [], cena: [] };
  const totals = useMemo(() => {
    const all = [
      ...dayPlan.desayuno,
      ...dayPlan.almuerzo,
      ...dayPlan.comida,
      ...dayPlan.cena,
    ];
    return sumEntries(all, foodsById);
  }, [dayPlan, foodsById]);

  const gap = {
    kcal: targets.kcal - totals.kcal,
    prot: targets.protG - totals.prot,
    carb: targets.carbG - totals.carb,
    fat:  targets.lipG  - totals.fat,
  };

  const toggleMeal = (id) => setOpenMeals((s) => ({ ...s, [id]: !s[id] }));

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="font-display text-3xl tracking-wider">NUTRICIÓN</h1>
          <p className="text-muted text-sm">Plan diario por tiempos de comida · {DAYS[activeDay].name}</p>
        </div>
      </div>

      <DaySelector active={activeDay} onChange={setActiveDay} />

      {/* Macro header with targets vs consumed */}
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
        {MEALS_CONFIG.map((meal) => {
          const entries = dayPlan[meal.id] || [];
          const mt = sumEntries(entries, foodsById);
          const isOpen = openMeals[meal.id];
          return (
            <Card key={meal.id} pad={false}>
              <button
                onClick={() => toggleMeal(meal.id)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{meal.icon}</span>
                  <div className="text-left">
                    <div className="font-display text-lg text-white tracking-wide">{meal.label}</div>
                    <div className="text-xs text-muted">{meal.sub} · {entries.length} alimentos</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-base text-accent">{mt.kcal.toFixed(0)} kcal</div>
                  <div className="text-[0.65rem] text-muted">
                    P {mt.prot.toFixed(0)}g · CH {mt.carb.toFixed(0)}g · G {mt.fat.toFixed(0)}g
                  </div>
                </div>
              </button>

              {isOpen && (
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
                  <button
                    onClick={() => setModalMeal(meal.id)}
                    className="w-full mt-2 border border-dashed border-border rounded-lg py-2 text-sm text-muted hover:text-accent hover:border-accent/40 transition"
                  >
                    ＋ Agregar alimento
                  </button>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <AddFoodModal
        open={!!modalMeal}
        onClose={() => setModalMeal(null)}
        gap={gap}
        onAdd={(entry) => {
          addEntry(activeDay, modalMeal, entry);
          showToast('✅ Alimento agregado', 'ok');
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
