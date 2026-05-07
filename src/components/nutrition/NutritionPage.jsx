import { useMemo, useState } from 'react';
import Card from '../ui/Card.jsx';
import MacroBar from '../ui/MacroBar.jsx';
import DaySelector from '../dashboard/DaySelector.jsx';
import WeekNavigator from './WeekNavigator.jsx';
import AddFoodModal from './AddFoodModal.jsx';
import MealFormModal from './MealFormModal.jsx';
import SavePresetModal from './SavePresetModal.jsx';
import ApplyPresetModal from './ApplyPresetModal.jsx';
import PresetsManagerModal from './PresetsManagerModal.jsx';
import MesocycleModal from './MesocycleModal.jsx';
import { useNutritionStore, selectDayPlan, isDaySnapshot } from '../../store/useNutritionStore.js';
import { getMesoInfoForWeek } from '../../lib/mesocycle.js';
import { useFoodStore } from '../../store/useFoodStore.js';
import { useProfileStore } from '../../store/useProfileStore.js';
import { DAYS } from '../../lib/constants.js';
import {
  calcTMB, calcTDEE, kcalForDay, macrosForKcal, dayType,
  sumEntries, computeFoodMacros, MICRO_TARGETS,
} from '../../lib/calculators.js';
import { weekDates } from '../../lib/dates.js';
import { buildNutritionPrintHTML } from '../../lib/printNutrition.js';
import { showToast } from '../ui/Toast.jsx';

export default function NutritionPage() {
  const {
    weeks, template, meals, presets, mesocycles, activeMesocycleId,
    activeWeek, activeDay,
    setActiveWeek, setActiveDay,
    addEntry, updateEntry, removeEntry,
    addMeal, updateMeal, removeMeal, moveMeal,
    savePreset, removePreset, renamePreset, applyPreset,
    resetDayToTemplate, saveDayAsTemplate,
    addMesocycle, updateMesocycle, removeMesocycle,
    setActiveMesocycleId, resetMesoStart, setMesoPlan,
  } = useNutritionStore();
  const foods = useFoodStore((s) => s.foods);
  const p = useProfileStore();

  const dayPlan = useNutritionStore((s) => selectDayPlan(s, s.activeWeek, s.activeDay));
  const isSnapshot = useNutritionStore((s) => isDaySnapshot(s, s.activeWeek, s.activeDay));
  const snapshotDays = useMemo(
    () => Object.keys(weeks?.[activeWeek] || {}).map(Number),
    [weeks, activeWeek]
  );
  const activeDate = useMemo(() => weekDates(activeWeek)[activeDay], [activeWeek, activeDay]);

  const [modalMeal, setModalMeal] = useState(null);
  const [openMeals, setOpenMeals] = useState({});
  const [mealForm, setMealForm] = useState(null);          // {mode, meal?}
  const [savePresetFor, setSavePresetFor] = useState(null); // {mealId, mealLabel, entries}
  const [applyPresetFor, setApplyPresetFor] = useState(null); // {mealId, mealLabel}
  const [presetsOpen, setPresetsOpen] = useState(false);
  const [mesoOpen, setMesoOpen] = useState(false);

  const mesoInfo = useMemo(
    () => getMesoInfoForWeek(mesocycles, activeMesocycleId, activeWeek),
    [mesocycles, activeMesocycleId, activeWeek]
  );

  const foodsById = useMemo(() => Object.fromEntries(foods.map((f) => [f.id, f])), [foods]);

  const targets = useMemo(() => {
    const tmb = calcTMB(p.sexo, p.peso, p.altura, p.edad);
    const tdee = calcTDEE(tmb, p.act);
    const kcal = Math.round(kcalForDay(activeDay, tdee, p.highPct, p.lowPct));
    const m = macrosForKcal(kcal, p.carb, p.prot, p.lip);
    return { kcal, ...m };
  }, [p, activeDay]);

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
          <p className="text-muted text-sm">
            {DAYS[activeDay].name} · {activeDate.toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}
            {isSnapshot ? (
              <span className="ml-2 text-accent">· registro propio</span>
            ) : mesoInfo ? (
              <span className="ml-2 text-muted/80">· {mesoInfo.meso.name} · sem {mesoInfo.weekNumber}/{mesoInfo.meso.weeks}</span>
            ) : (
              <span className="ml-2 text-muted/60">· plantilla</span>
            )}
          </p>
        </div>
        <button
          onClick={() => {
            const html = buildNutritionPrintHTML({
              profile: p,
              day: DAYS[activeDay],
              date: activeDate,
              dayType: dayType(activeDay),
              targets,
              totals,
              meals,
              dayPlan,
              foodsById,
              micros: MICRO_TARGETS,
            });
            const win = window.open('', '_blank', 'width=820,height=1000');
            if (!win) {
              showToast('Permite ventanas emergentes para imprimir', 'error');
              return;
            }
            win.document.open();
            win.document.write(html);
            win.document.close();
            win.focus();
            // Trigger print after content settles
            setTimeout(() => { try { win.print(); } catch (_) {} }, 350);
          }}
          className="px-4 py-2 text-sm rounded-lg border border-border text-muted hover:text-white hover:border-white/30 transition self-start"
          title="Generar PDF imprimible"
        >
          🖨 Imprimir / PDF
        </button>
      </div>

      <WeekNavigator
        activeWeek={activeWeek}
        onChange={setActiveWeek}
        snapshotCount={snapshotDays.length}
        mesoInfo={mesoInfo}
        onOpenMesocycles={() => setMesoOpen(true)}
      />

      <DaySelector
        active={activeDay}
        onChange={setActiveDay}
        weekKey={activeWeek}
        snapshotDays={snapshotDays}
      />

      {/* Snapshot actions */}
      <div className="flex flex-wrap gap-2 text-xs">
        {isSnapshot ? (
          <>
            <button
              onClick={() => {
                if (confirm(`¿Eliminar el registro de este día y volver a la plantilla?`)) {
                  resetDayToTemplate(activeWeek, activeDay);
                  showToast('Registro borrado, vuelve a plantilla');
                }
              }}
              className="px-3 py-1.5 rounded-md border border-border text-muted hover:text-white hover:border-white/20 transition"
              title="Borrar el snapshot de este día y volver a la plantilla"
            >
              ↺ Volver a plantilla
            </button>
            <button
              onClick={() => {
                if (confirm(`¿Guardar el plan de hoy como nueva plantilla? Esto reemplazará la plantilla del ${DAYS[activeDay].name}.`)) {
                  saveDayAsTemplate(activeWeek, activeDay);
                  showToast('Plantilla actualizada', 'ok');
                }
              }}
              className="px-3 py-1.5 rounded-md border border-border text-muted hover:text-white hover:border-white/20 transition"
              title="Guardar el plan actual como plantilla para todas las semanas futuras"
            >
              💾 Guardar como plantilla
            </button>
          </>
        ) : (
          <span className="text-muted/70 self-center">
            Cualquier cambio creará un registro propio para este día.
          </span>
        )}
      </div>

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
        <div className="mt-5 pt-4 border-t border-border grid grid-cols-3 gap-3">
          <MicroStat label="Fibra"  value={totals.fiber}  cfg={MICRO_TARGETS.fiber} />
          <MicroStat label="Azúcar" value={totals.sugar}  cfg={MICRO_TARGETS.sugar} />
          <MicroStat label="Sodio"  value={totals.sodium} cfg={MICRO_TARGETS.sodium} />
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

      <MesocycleModal
        open={mesoOpen}
        onClose={() => setMesoOpen(false)}
        mesocycles={mesocycles}
        activeId={activeMesocycleId}
        presets={presets}
        meals={meals}
        currentWeek={activeWeek}
        onCreate={(meso) => { addMesocycle(meso); showToast('Mesociclo creado', 'ok'); }}
        onUpdate={(id, patch) => updateMesocycle(id, patch)}
        onRemove={(id) => { removeMesocycle(id); showToast('Mesociclo eliminado'); }}
        onSetActive={(id) => { setActiveMesocycleId(id); showToast(id ? 'Mesociclo activado' : 'Mesociclo desactivado', 'ok'); }}
        onResetStart={(id, wk) => { resetMesoStart(id, wk); showToast('Inicio reseteado a esta semana', 'ok'); }}
        onSetPlan={(id, dt, mealId, presetId) => setMesoPlan(id, dt, mealId, presetId)}
      />
    </div>
  );
}

function MicroStat({ label, value, cfg }) {
  const { target, unit, type } = cfg;
  const v = value || 0;
  const pct = target > 0 ? Math.min(1, v / target) : 0;
  // For 'goal' (fiber): green when >=, accent below; for 'limit' (sugar/sodium): green under, red over
  let barColor, valueColor, suffix;
  if (type === 'goal') {
    const ok = v >= target;
    barColor = ok ? '#22c55e' : '#00e5ff';
    valueColor = ok ? 'text-ok' : 'text-white';
    suffix = `/ ${target}${unit}`;
  } else {
    const over = v > target;
    barColor = over ? '#ef4444' : '#22c55e';
    valueColor = over ? 'text-bad' : v > target * 0.8 ? 'text-warn' : 'text-ok';
    suffix = `/ <${target}${unit}`;
  }
  const fmt = (n) => (n >= 100 ? Math.round(n) : n.toFixed(1).replace('.0', ''));
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-[0.65rem] uppercase tracking-wider text-muted font-display">{label}</span>
        <span className="font-mono text-xs">
          <span className={valueColor}>{fmt(v)}{unit}</span>
          <span className="text-muted/70 ml-1">{suffix}</span>
        </span>
      </div>
      <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
        <div
          className="h-full transition-all"
          style={{ width: `${Math.min(100, pct * 100)}%`, background: barColor }}
        />
      </div>
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
