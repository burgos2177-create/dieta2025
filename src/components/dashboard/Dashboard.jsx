import { useEffect, useMemo } from 'react';
import Card from '../ui/Card.jsx';
import Pill from '../ui/Pill.jsx';
import MacroBar from '../ui/MacroBar.jsx';
import KcalRing from './KcalRing.jsx';
import DaySelector from './DaySelector.jsx';
import { useProfileStore } from '../../store/useProfileStore.js';
import { useNutritionStore, selectDayPlan } from '../../store/useNutritionStore.js';
import { useTrainingStore, selectTrainingDay } from '../../store/useTrainingStore.js';
import { useFoodStore } from '../../store/useFoodStore.js';
import { useUIStore } from '../../store/useUIStore.js';
import { DAYS, TR_DAYS_CONFIG } from '../../lib/constants.js';
import {
  calcTMB, calcTDEE, calcIMC, kcalForDay, weeklyAvg,
  macrosForKcal, dayType, recommendedWater, sumEntries,
} from '../../lib/calculators.js';
import { todayDayIdx } from '../../lib/dates.js';

export default function Dashboard() {
  const p = useProfileStore();
  const activeDay = useNutritionStore((s) => s.activeDay);
  const setActiveDay = useNutritionStore((s) => s.setActiveDay);
  const activeWeek = useNutritionStore((s) => s.activeWeek);
  const meals = useNutritionStore((s) => s.meals);
  const dayPlan = useNutritionStore((s) => selectDayPlan(s, s.activeWeek, s.activeDay));
  const foods = useFoodStore((s) => s.foods);
  const trainingDay = useTrainingStore((s) => selectTrainingDay(s, s.activeWeek, activeDay, { bodyweight: Number(p.peso) || 0 }));
  const trainingSnapshot = useTrainingStore((s) => s.weeks?.[s.activeWeek]?.[activeDay]);
  const extraSessionsToday = useTrainingStore((s) => s.extraSessions?.[s.activeWeek]?.[activeDay] || []);

  const lockDayToToday = useUIStore((s) => s.lockDayToToday);
  const setLockDayToToday = useUIStore((s) => s.setLockDayToToday);

  // Lock effect: when toggle is on, force activeDay to today
  useEffect(() => {
    if (lockDayToToday) {
      const t = todayDayIdx();
      if (t !== activeDay) setActiveDay(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lockDayToToday]);

  const onDayChange = (idx) => {
    if (idx !== todayDayIdx() && lockDayToToday) {
      setLockDayToToday(false);
    }
    setActiveDay(idx);
  };

  const d = useMemo(() => {
    const tmb  = calcTMB(p.sexo, p.peso, p.altura, p.edad);
    const tdee = calcTDEE(tmb, p.act);
    const high = tdee * (p.highPct / 100);
    const low  = tdee * (p.lowPct  / 100);
    const avg  = weeklyAvg(tdee, p.highPct, p.lowPct);
    const imc  = calcIMC(p.peso, p.altura);
    return { tmb, tdee, high, low, avg, imc };
  }, [p.sexo, p.peso, p.altura, p.edad, p.act, p.highPct, p.lowPct]);

  const kcal = Math.round(kcalForDay(activeDay, d.tdee, p.highPct, p.lowPct));
  const macros = macrosForKcal(kcal, p.carb, p.prot, p.lip);
  const maxKcal = Math.round(d.high);
  const mMax = macrosForKcal(maxKcal, p.carb, p.prot, p.lip);

  const type = dayType(activeDay);
  const day = DAYS[activeDay];
  const protPerKg = (macros.protG / p.peso).toFixed(2);
  const water = recommendedWater(p.peso).toFixed(2);

  // Calorie balance: target vs consumed vs burned
  const foodsById = useMemo(() => Object.fromEntries(foods.map((f) => [f.id, f])), [foods]);
  const consumed = useMemo(() => {
    const all = (meals || []).flatMap((m) => dayPlan?.[m.id] || []);
    return sumEntries(all, foodsById);
  }, [meals, dayPlan, foodsById]);

  const trainingKcal = (trainingSnapshot?.status === 'closed' ? Number(trainingSnapshot.kcalBurned) || 0 : 0);
  const extraKcal = (extraSessionsToday || []).reduce((a, s) => a + (Number(s.kcal) || 0), 0);
  const burnedKcal = trainingKcal + extraKcal;
  const remainingKcal = kcal + burnedKcal - Math.round(consumed.kcal);

  // Today's training, if it matches the active day
  const trainingCfg = TR_DAYS_CONFIG.find((c) => c.weekday === activeDay) || null;
  const isTodayActive = activeDay === todayDayIdx();

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="font-display text-3xl tracking-wider">DASHBOARD</h1>
          <p className="text-muted text-sm">Hola {p.nombre} · planifica tu semana con ciclado Lyle McDonald</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLockDayToToday(!lockDayToToday)}
            className={`px-3 py-1.5 text-xs rounded-md border transition ${
              lockDayToToday
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-border text-muted hover:text-white hover:border-white/20'
            }`}
            title={lockDayToToday ? 'Vinculado al día actual — al elegir otro día se desactiva' : 'Vincular el día activo al día de hoy'}
          >
            {lockDayToToday ? '🔗 Hoy fijado' : '📌 Fijar a hoy'}
          </button>
          {type === 'high' && <Pill tone="green">Día ALTO +{p.highPct - 100}%</Pill>}
          {type === 'low'  && <Pill tone="red">Día BAJO −{100 - p.lowPct}%</Pill>}
          {type === 'normo' && <Pill tone="cyan">Día NORMO (TDEE)</Pill>}
        </div>
      </div>

      <DaySelector active={activeDay} onChange={onDayChange} weekKey={activeWeek} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Ring + macros */}
        <Card className="lg:col-span-2" title={`${day.name} · Objetivo calórico`}>
          <div className="flex flex-col md:flex-row items-center gap-6">
            <KcalRing kcal={kcal} max={maxKcal} />
            <div className="flex-1 w-full space-y-4">
              <MacroBar label="Carbohidratos" value={macros.carbG} target={mMax.carbG} color="#00e5ff" />
              <MacroBar label="Proteína"      value={macros.protG} target={mMax.protG} color="#22c55e" />
              <MacroBar label="Grasas"        value={macros.lipG}  target={mMax.lipG}  color="#f59e0b" />
              <div className="text-xs text-muted pt-2 border-t border-border">
                Proteína/kg: <span className="font-mono text-white">{protPerKg}</span> · Agua sugerida:{' '}
                <span className="font-mono text-white">{water} L</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Metabolism quick stats */}
        <Card title="Metabolismo">
          <div className="space-y-3">
            <StatRow label="TMB (Harris-Benedict)" value={Math.round(d.tmb).toLocaleString() + ' kcal'} />
            <StatRow label="TDEE (mantenimiento)"  value={Math.round(d.tdee).toLocaleString() + ' kcal'} />
            <StatRow label="Día alto" value={Math.round(d.high).toLocaleString() + ' kcal'} tone="green" />
            <StatRow label="Día bajo" value={Math.round(d.low).toLocaleString() + ' kcal'}  tone="red" />
            <StatRow label="Promedio semanal" value={Math.round(d.avg).toLocaleString() + ' kcal'} tone="cyan" />
          </div>
        </Card>
      </div>

      {/* Calorie balance */}
      <Card title={`Balance calórico · ${day.name}${isTodayActive ? ' (hoy)' : ''}`}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <BalanceTile
            label="Objetivo (Lyle)"
            value={kcal.toLocaleString()}
            unit="kcal"
            tone="cyan"
            sub="lo que toca comer"
          />
          <BalanceTile
            label="Consumido"
            value={Math.round(consumed.kcal).toLocaleString()}
            unit="kcal"
            tone="white"
            sub={`${(meals || []).reduce((a, m) => a + (dayPlan?.[m.id]?.length || 0), 0)} alimentos`}
          />
          <BalanceTile
            label="Quemado en entreno"
            value={burnedKcal.toLocaleString()}
            unit="kcal"
            tone="orange"
            sub={
              trainingKcal > 0 && extraKcal > 0
                ? `pesas ${trainingKcal} + extra ${extraKcal}`
                : trainingKcal > 0
                  ? 'pesas (sesión cerrada)'
                  : extraKcal > 0
                    ? `${extraSessionsToday.length} actividad${extraSessionsToday.length !== 1 ? 'es' : ''}`
                    : 'sin registrar'
            }
          />
          <BalanceTile
            label="Restante"
            value={(remainingKcal >= 0 ? '+' : '') + remainingKcal.toLocaleString()}
            unit="kcal"
            tone={remainingKcal > 50 ? 'green' : remainingKcal < -50 ? 'red' : 'cyan'}
            sub={remainingKcal > 0 ? 'puedes comer más' : remainingKcal < 0 ? 'sobrepasaste' : 'en target'}
          />
        </div>
        <div className="text-[0.7rem] text-muted/70 mt-3 leading-relaxed">
          Restante = Objetivo + Quemado − Consumido. Para igualar exactamente el ciclado calórico del día,
          procura llegar a 0; positivo significa que aún tienes margen para comer; negativo, que excediste el plan.
        </div>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MiniCard label="Peso" value={p.peso + ' kg'} />
        <MiniCard label="IMC"  value={d.imc.toFixed(1)} sub={imcLabel(d.imc)} />
        <MiniCard label="Prot/kg" value={protPerKg} sub="objetivo ≥ 1.8" />
        <MiniCard
          label="Entreno de hoy"
          value={trainingDay ? trainingCfg?.focus?.split(':')[0] || 'Sesión' : (extraSessionsToday.length > 0 ? 'Actividad extra' : 'Descanso')}
          sub={
            trainingDay
              ? `${trainingDay.exercises.length} ejercicios${burnedKcal > 0 ? ` · ${burnedKcal} kcal` : ''}`
              : extraSessionsToday.length > 0
                ? `${extraSessionsToday.length} sesion${extraSessionsToday.length !== 1 ? 'es' : ''} · ${extraKcal} kcal`
                : ''
          }
        />
      </div>
    </div>
  );
}

function StatRow({ label, value, tone }) {
  const toneCls = tone === 'green' ? 'text-ok' : tone === 'red' ? 'text-bad' : tone === 'cyan' ? 'text-accent' : 'text-white';
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted">{label}</span>
      <span className={`font-mono font-semibold ${toneCls}`}>{value}</span>
    </div>
  );
}

function BalanceTile({ label, value, unit, tone, sub }) {
  const toneCls =
    tone === 'green' ? 'text-ok' :
    tone === 'red' ? 'text-bad' :
    tone === 'cyan' ? 'text-accent' :
    tone === 'orange' ? 'text-warn' :
    'text-white';
  return (
    <div className="bg-white/[0.02] border border-border rounded-lg p-3">
      <div className="text-[0.6rem] uppercase tracking-wider text-muted font-display">{label}</div>
      <div className={`font-mono text-xl mt-1 ${toneCls}`}>
        {value}
        <span className="text-xs text-muted ml-1">{unit}</span>
      </div>
      {sub && <div className="text-[0.6rem] text-muted/80 mt-1">{sub}</div>}
    </div>
  );
}

function MiniCard({ label, value, sub }) {
  return (
    <Card className="!p-4">
      <div className="text-[0.65rem] uppercase tracking-wider text-muted font-display">{label}</div>
      <div className="font-mono text-2xl text-white mt-1">{value}</div>
      {sub && <div className="text-[0.65rem] text-muted/80 mt-0.5">{sub}</div>}
    </Card>
  );
}

function imcLabel(imc) {
  if (imc < 18.5) return 'bajo peso';
  if (imc < 25)   return 'normal';
  if (imc < 30)   return 'sobrepeso';
  return 'obesidad';
}
