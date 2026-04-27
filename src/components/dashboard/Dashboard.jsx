import { useMemo } from 'react';
import Card from '../ui/Card.jsx';
import Pill from '../ui/Pill.jsx';
import MacroBar from '../ui/MacroBar.jsx';
import KcalRing from './KcalRing.jsx';
import DaySelector from './DaySelector.jsx';
import { useProfileStore } from '../../store/useProfileStore.js';
import { useNutritionStore } from '../../store/useNutritionStore.js';
import { useTrainingStore } from '../../store/useTrainingStore.js';
import { DAYS, TR_DAYS_CONFIG } from '../../lib/constants.js';
import {
  calcTMB, calcTDEE, calcIMC, kcalForDay, weeklyAvg,
  macrosForKcal, dayType, recommendedWater,
} from '../../lib/calculators.js';

export default function Dashboard() {
  const p = useProfileStore();
  const activeDay = useNutritionStore((s) => s.activeDay);
  const setActiveDay = useNutritionStore((s) => s.setActiveDay);
  const trainingDays = useTrainingStore((s) => s.days);

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

  // Today's training, if it matches the active day
  const trainingIdx = { 0: 0, 2: 1, 4: 2 }[activeDay];
  const trainingDay = trainingIdx != null ? trainingDays[trainingIdx] : null;
  const trainingCfg = trainingIdx != null ? TR_DAYS_CONFIG[trainingIdx] : null;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="font-display text-3xl tracking-wider">DASHBOARD</h1>
          <p className="text-muted text-sm">Hola {p.nombre} · planifica tu semana con ciclado Lyle McDonald</p>
        </div>
        {type === 'high' && <Pill tone="green">Día ALTO +{p.highPct - 100}%</Pill>}
        {type === 'low'  && <Pill tone="red">Día BAJO −{100 - p.lowPct}%</Pill>}
        {type === 'normo' && <Pill tone="cyan">Día NORMO (TDEE)</Pill>}
      </div>

      <DaySelector active={activeDay} onChange={setActiveDay} />

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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MiniCard label="Peso" value={p.peso + ' kg'} />
        <MiniCard label="IMC"  value={d.imc.toFixed(1)} sub={imcLabel(d.imc)} />
        <MiniCard label="Prot/kg" value={protPerKg} sub="objetivo ≥ 1.8" />
        <MiniCard
          label="Entreno de hoy"
          value={trainingDay ? trainingCfg.focus.split(':')[0] : 'Descanso'}
          sub={trainingDay ? trainingDay.exercises.length + ' ejercicios' : ''}
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
