import { useMemo, useState, useEffect } from 'react';
import Card from '../components/ui/Card.jsx';
import Pill from '../components/ui/Pill.jsx';
import { useProfileStore } from '../store/useProfileStore.js';
import {
  ACTIVITY_LEVELS, NEAT_LEVELS, MACRO_PRESETS, DAYS,
} from '../lib/constants.js';
import {
  calcTMB, calcTDEE, calcIMC, kcalForDay, weeklyAvg,
  macrosForKcal, dayType, recommendedWater,
} from '../lib/calculators.js';
import { showToast } from '../components/ui/Toast.jsx';
import BodyLogSection from '../components/body/BodyLogSection.jsx';

export default function ProfilePage() {
  const p = useProfileStore();

  const d = useMemo(() => {
    const tmb = calcTMB(p.sexo, p.peso, p.altura, p.edad);
    const tdee = calcTDEE(tmb, p.act);
    const imc = calcIMC(p.peso, p.altura);
    const avg = weeklyAvg(tdee, p.highPct, p.lowPct);
    return {
      tmb, tdee, imc, avg,
      balance: avg - tdee,
      high: tdee * (p.highPct / 100),
      low:  tdee * (p.lowPct  / 100),
      water: recommendedWater(p.peso),
    };
  }, [p.sexo, p.peso, p.altura, p.edad, p.act, p.highPct, p.lowPct]);

  const totalMacro = p.carb + p.prot + p.lip;
  const macroValid = totalMacro === 100;

  const setMacroField = (field, val) => {
    p.setField(field, Number(val));
  };

  const applyPreset = (preset) => {
    p.setMacros(preset.carb, preset.prot, preset.lip);
    showToast('✅ Preset aplicado: ' + preset.label, 'ok');
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl tracking-wider">PERFIL</h1>
        <p className="text-muted text-sm">Datos personales, ciclado Lyle McDonald y distribución de macros</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Datos personales */}
        <Card title="Datos personales">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nombre">
              <input type="text" value={p.nombre} onChange={(e) => p.setField('nombre', e.target.value)} />
            </Field>
            <Field label="Edad">
              <input type="number" value={p.edad} onChange={(e) => p.setField('edad', Number(e.target.value))} />
            </Field>
            <Field label="Sexo">
              <select value={p.sexo} onChange={(e) => p.setField('sexo', e.target.value)}>
                <option value="m">Masculino</option>
                <option value="f">Femenino</option>
              </select>
            </Field>
            <Field label="Peso (kg)">
              <input type="number" step="0.1" value={p.peso} onChange={(e) => p.setField('peso', Number(e.target.value))} />
            </Field>
            <Field label="Altura (cm)">
              <input type="number" value={p.altura} onChange={(e) => p.setField('altura', Number(e.target.value))} />
            </Field>
            <Field label="Nivel de actividad (objetivo Lyle)">
              <select value={p.act} onChange={(e) => p.setField('act', Number(e.target.value))}>
                {ACTIVITY_LEVELS.map((a) => (
                  <option key={a.id} value={a.id}>{a.label}</option>
                ))}
              </select>
              <div className="text-[0.65rem] text-muted/70 mt-1">
                Multiplicador Harris-Benedict combinado (NEAT + ejercicio típico). Define el TDEE
                de mantenimiento del que sale el objetivo Lyle de cada día.
              </div>
            </Field>
            <Field label="NEAT (sin ejercicio, kcal/día)">
              <select value={p.neat ?? 600} onChange={(e) => p.setField('neat', Number(e.target.value))}>
                {NEAT_LEVELS.map((n) => (
                  <option key={n.id} value={n.id}>{n.label} — {n.id} kcal · {n.sub}</option>
                ))}
              </select>
              <div className="text-[0.65rem] text-muted/70 mt-1">
                Gasto diario fuera del entreno estructurado. Para el balance real:
                <span className="font-mono text-white"> TMB + NEAT + entreno registrado</span>.
              </div>
            </Field>
          </div>
        </Card>

        {/* Metabolic results */}
        <Card title="Resultados metabólicos">
          <div className="space-y-2">
            <StatRow label="TMB (Harris-Benedict)" value={Math.round(d.tmb).toLocaleString() + ' kcal'} />
            <StatRow label="TDEE (mantenimiento)"  value={Math.round(d.tdee).toLocaleString() + ' kcal'} />
            <StatRow label="IMC" value={d.imc.toFixed(1) + ' — ' + imcLabel(d.imc)} />
            <StatRow label="Agua recomendada" value={d.water.toFixed(2) + ' L/día'} />
            <StatRow label="Promedio semanal" value={Math.round(d.avg).toLocaleString() + ' kcal'} tone="cyan" />
            <StatRow
              label="Balance vs TDEE"
              value={(d.balance >= 0 ? '+' : '') + Math.round(d.balance) + ' kcal'}
              tone={Math.abs(d.balance) < 50 ? 'cyan' : d.balance > 0 ? 'green' : 'red'}
            />
          </div>
        </Card>
      </div>

      {/* Lyle McDonald cycling */}
      <Card title="Ciclado calórico Lyle McDonald">
        <p className="text-xs text-muted mb-4 max-w-2xl">
          Alternar días altos (alrededor del entreno) con días bajos permite manipular la partición de nutrientes
          manteniendo el promedio semanal cerca del TDEE. D1/3/5 altos, D2/4/6 bajos, D7 normo.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-4">
            <Slider
              label={`Días ALTOS: ${p.highPct}% TDEE`}
              min={100} max={130} step={1}
              value={p.highPct}
              onChange={(v) => p.setField('highPct', v)}
              tone="#22c55e"
            />
            <Slider
              label={`Días BAJOS: ${p.lowPct}% TDEE`}
              min={70} max={100} step={1}
              value={p.lowPct}
              onChange={(v) => p.setField('lowPct', v)}
              tone="#ef4444"
            />
            <div className="grid grid-cols-2 gap-3 pt-2">
              <MiniStat label="Día alto" value={Math.round(d.high) + ' kcal'} tone="text-ok" />
              <MiniStat label="Día bajo" value={Math.round(d.low)  + ' kcal'} tone="text-bad" />
              <MiniStat label="Normo"    value={Math.round(d.tdee) + ' kcal'} tone="text-accent" />
              <MiniStat label="Promedio" value={Math.round(d.avg)  + ' kcal'} tone="text-white" />
            </div>
          </div>
          <div>
            <div className="text-[0.65rem] uppercase tracking-wider text-muted mb-2">Semana</div>
            <div className="grid grid-cols-7 gap-1.5">
              {DAYS.map((_, i) => {
                const kcal = Math.round(kcalForDay(i, d.tdee, p.highPct, p.lowPct));
                const t = dayType(i);
                const bg = t === 'high' ? 'bg-ok/15 border-ok/40 text-ok'
                         : t === 'low'  ? 'bg-bad/15 border-bad/40 text-bad'
                         : 'bg-accent/15 border-accent/40 text-accent';
                return (
                  <div key={i} className={`rounded-md border p-2 text-center ${bg}`}>
                    <div className="font-display text-xs">{DAYS[i].label}</div>
                    <div className="font-mono text-[0.65rem] mt-1">{kcal}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      {/* Macro distribution */}
      <Card title="Distribución de macros">
        <div className="flex flex-wrap gap-2 mb-4">
          {MACRO_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset)}
              className="px-3 py-1.5 text-xs rounded-md border border-border bg-white/[0.02] text-muted hover:text-accent hover:border-accent/40"
            >
              {preset.label} · {preset.carb}/{preset.prot}/{preset.lip}
            </button>
          ))}
        </div>

        <div className="text-[0.65rem] text-muted mb-3 font-mono">
          Referencia: TDEE {Math.round(d.tdee)} kcal · Peso {p.peso} kg
        </div>

        <div className="space-y-5">
          <MacroRow
            label="Carbohidratos" color="#00e5ff" kcalPerG={4}
            pct={p.carb} sliderMin={10} sliderMax={70}
            tdee={d.tdee} peso={p.peso}
            onPctChange={(v) => setMacroField('carb', v)}
          />
          <MacroRow
            label="Proteína" color="#22c55e" kcalPerG={4}
            pct={p.prot} sliderMin={10} sliderMax={60}
            tdee={d.tdee} peso={p.peso}
            onPctChange={(v) => setMacroField('prot', v)}
          />
          <MacroRow
            label="Grasas" color="#f59e0b" kcalPerG={9}
            pct={p.lip} sliderMin={10} sliderMax={50}
            tdee={d.tdee} peso={p.peso}
            onPctChange={(v) => setMacroField('lip', v)}
          />

          <div className={`text-xs font-mono ${macroValid ? 'text-ok' : 'text-bad'}`}>
            Suma: {totalMacro}% {macroValid ? '✓' : '← ajusta hasta sumar 100%'}
          </div>

          {/* Stacked bar */}
          <div className="h-3 rounded-full bg-white/5 overflow-hidden flex">
            <div style={{ width: p.carb + '%', background: '#00e5ff' }} />
            <div style={{ width: p.prot + '%', background: '#22c55e' }} />
            <div style={{ width: p.lip  + '%', background: '#f59e0b' }} />
          </div>

          {/* Macro table */}
          <div className="overflow-x-auto pt-3">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[0.65rem] uppercase text-muted border-b border-border">
                  <th className="text-left py-2">Tipo día</th>
                  <th className="py-2">kcal</th>
                  <th className="py-2">CH (g)</th>
                  <th className="py-2">P (g)</th>
                  <th className="py-2">G (g)</th>
                  <th className="py-2">P/kg</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {[
                  { label: 'Alto',  kcal: d.high, tone: 'text-ok' },
                  { label: 'Bajo',  kcal: d.low,  tone: 'text-bad' },
                  { label: 'Normo', kcal: d.tdee, tone: 'text-accent' },
                  { label: 'Promedio', kcal: d.avg, tone: 'text-white' },
                ].map((row) => {
                  const m = macrosForKcal(row.kcal, p.carb, p.prot, p.lip);
                  return (
                    <tr key={row.label} className="border-b border-border/40">
                      <td className={`py-2 ${row.tone} font-body`}>{row.label}</td>
                      <td className="py-2 text-center">{Math.round(row.kcal)}</td>
                      <td className="py-2 text-center">{m.carbG}</td>
                      <td className="py-2 text-center">{m.protG}</td>
                      <td className="py-2 text-center">{m.lipG}</td>
                      <td className="py-2 text-center">{(m.protG / p.peso).toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      <BodyLogSection />
    </div>
  );
}

/**
 * MacroRow — bidirectional % slider ↔ g/kg input
 * kcalPerG: 4 for carbs/prot, 9 for fat
 * g/kg field uses local state so the user can type freely;
 * it commits on blur or Enter, and syncs when pct changes externally.
 */
function MacroRow({ label, color, kcalPerG, pct, sliderMin, sliderMax, tdee, peso, onPctChange }) {
  const gPerKgFromPct = tdee > 0 && peso > 0
    ? (tdee * pct / 100 / kcalPerG) / peso
    : 0;

  // Local draft for the g/kg field to avoid snap-back while typing
  const [gkgDraft, setGkgDraft] = useState(gPerKgFromPct.toFixed(2));
  const [editing, setEditing] = useState(false);

  // Sync draft when pct changes from outside (slider, preset, % input)
  useEffect(() => {
    if (!editing) setGkgDraft(gPerKgFromPct.toFixed(2));
  }, [pct, tdee, peso, editing]);

  const commitGkg = () => {
    setEditing(false);
    const gPerKg = parseFloat(gkgDraft) || 0;
    if (gPerKg <= 0 || tdee <= 0 || peso <= 0) {
      setGkgDraft(gPerKgFromPct.toFixed(2));
      return;
    }
    const newPct = Math.round((gPerKg * peso * kcalPerG) / tdee * 100);
    const clamped = Math.max(sliderMin, Math.min(sliderMax, newPct));
    onPctChange(clamped);
  };

  const handlePct = (raw) => {
    const v = Math.max(sliderMin, Math.min(sliderMax, Number(raw) || 0));
    onPctChange(v);
  };

  const totalG = (gPerKgFromPct * peso).toFixed(0);

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
        <span className="text-sm font-medium text-white/90 w-28">{label}</span>

        {/* % input */}
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={pct}
            min={sliderMin} max={sliderMax}
            onChange={(e) => handlePct(e.target.value)}
            className="!w-16 !py-1 !px-2 text-sm text-center font-mono"
          />
          <span className="text-xs text-muted">%</span>
        </div>

        <span className="text-muted text-xs">↔</span>

        {/* g/kg input — free-type, commits on blur/Enter */}
        <div className="flex items-center gap-1">
          <input
            type="number"
            step="0.1"
            value={gkgDraft}
            onChange={(e) => { setEditing(true); setGkgDraft(e.target.value); }}
            onBlur={commitGkg}
            onKeyDown={(e) => e.key === 'Enter' && commitGkg()}
            className="!w-20 !py-1 !px-2 text-sm text-center font-mono"
            style={{ borderColor: color + '88' }}
          />
          <span className="text-xs text-muted">g/kg</span>
        </div>

        <span className="ml-auto font-mono text-xs text-muted">{totalG} g totales</span>
      </div>

      <input
        type="range"
        min={sliderMin} max={sliderMax} step={1} value={pct}
        onChange={(e) => handlePct(e.target.value)}
        style={{ accentColor: color }}
      />
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <div className="text-[0.7rem] uppercase tracking-wider text-muted mb-1">{label}</div>
      {children}
    </label>
  );
}

function Slider({ label, min, max, step, value, onChange, tone }) {
  return (
    <label className="block">
      <div className="text-xs text-muted mb-1 font-mono">{label}</div>
      <input
        type="range"
        min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ accentColor: tone }}
      />
    </label>
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

function MiniStat({ label, value, tone }) {
  return (
    <div className="bg-white/[0.02] border border-border rounded-lg p-3 text-center">
      <div className="text-[0.6rem] uppercase tracking-wider text-muted">{label}</div>
      <div className={`font-mono mt-1 ${tone}`}>{value}</div>
    </div>
  );
}

function imcLabel(imc) {
  if (imc < 18.5) return 'bajo peso';
  if (imc < 25)   return 'normal';
  if (imc < 30)   return 'sobrepeso';
  return 'obesidad';
}
