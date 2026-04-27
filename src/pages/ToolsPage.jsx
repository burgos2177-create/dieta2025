import { useState } from 'react';
import Card from '../components/ui/Card.jsx';
import { kgToLb, lbToKg, estimate1RM } from '../lib/calculators.js';

export default function ToolsPage() {
  const [kg, setKg] = useState(100);
  const [lb, setLb] = useState(220.46);
  const [w, setW] = useState(50);
  const [r, setR] = useState(10);
  const [s, setS] = useState(4);
  const [rmW, setRmW] = useState(80);
  const [rmR, setRmR] = useState(5);

  const setFromKg = (v) => { setKg(v); setLb(Number((kgToLb(Number(v) || 0)).toFixed(2))); };
  const setFromLb = (v) => { setLb(v); setKg(Number((lbToKg(Number(v) || 0)).toFixed(2))); };

  const vol = (Number(w) || 0) * (Number(r) || 0) * (Number(s) || 0);
  const rm = estimate1RM(Number(rmW) || 0, Number(rmR) || 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl tracking-wider">HERRAMIENTAS</h1>
        <p className="text-muted text-sm">Calculadoras rápidas</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card title="Conversor KG ↔ LB">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Kilogramos">
              <input type="number" value={kg} onChange={(e) => setFromKg(e.target.value)} />
            </Field>
            <Field label="Libras">
              <input type="number" value={lb} onChange={(e) => setFromLb(e.target.value)} />
            </Field>
          </div>
          <p className="text-xs text-muted mt-3 font-mono">1 kg = 2.20462 lb</p>
        </Card>

        <Card title="Volumen de trabajo">
          <div className="grid grid-cols-3 gap-3">
            <Field label="Peso (kg)"><input type="number" value={w} onChange={(e) => setW(e.target.value)} /></Field>
            <Field label="Reps"><input type="number" value={r} onChange={(e) => setR(e.target.value)} /></Field>
            <Field label="Sets"><input type="number" value={s} onChange={(e) => setS(e.target.value)} /></Field>
          </div>
          <div className="mt-4 bg-white/[0.02] border border-border rounded-lg p-4 text-center">
            <div className="text-[0.65rem] uppercase text-muted">Volumen total</div>
            <div className="font-mono text-3xl text-accent mt-1">{vol.toFixed(1)}</div>
            <div className="text-[0.65rem] text-muted">kg movidos</div>
          </div>
        </Card>

        <Card title="Estimador 1RM (Brzycki)" className="md:col-span-2">
          <div className="grid grid-cols-2 gap-3 max-w-md">
            <Field label="Peso levantado (kg)">
              <input type="number" step="0.5" value={rmW} onChange={(e) => setRmW(e.target.value)} />
            </Field>
            <Field label="Reps completadas">
              <input type="number" value={rmR} onChange={(e) => setRmR(e.target.value)} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <Result label="1RM estimado" value={rm.toFixed(1) + ' kg'} tone="text-ok" />
            <Result label="80% 1RM" value={(rm * 0.8).toFixed(1) + ' kg'} tone="text-accent" />
          </div>
          <p className="text-xs text-muted mt-3 font-mono">
            Fórmula: peso / (1.0278 − 0.0278 × reps) · precisa hasta ~10 reps
          </p>
        </Card>
      </div>
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

function Result({ label, value, tone }) {
  return (
    <div className="bg-white/[0.02] border border-border rounded-lg p-4 text-center">
      <div className="text-[0.65rem] uppercase text-muted">{label}</div>
      <div className={`font-mono text-2xl mt-1 ${tone}`}>{value}</div>
    </div>
  );
}
