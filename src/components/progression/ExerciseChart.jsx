import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer, Area, AreaChart,
} from 'recharts';

const METRIC_CFG = {
  weight: { key: 'weight', label: 'Peso (kg)',  color: '#00e5ff' },
  vol:    { key: 'vol',    label: 'Volumen (kg)', color: '#22c55e' },
  rxs:    { key: 'rxs',    label: 'Reps × Sets', color: '#f59e0b' },
};

function CustomTooltip({ active, payload, label, metric }) {
  if (!active || !payload?.length) return null;
  const cfg = METRIC_CFG[metric];
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-xl">
      <div className="text-[0.65rem] uppercase text-muted font-display">{label}</div>
      <div className="font-mono text-sm" style={{ color: cfg.color }}>
        {cfg.label}: {payload[0].value.toFixed(1)}
      </div>
    </div>
  );
}

export default function ExerciseChart({ log, metric }) {
  const cfg = METRIC_CFG[metric];
  const data = log.map((e) => ({
    date: e.date.slice(5),
    weight: e.weight,
    vol: e.vol,
    rxs: e.reps * e.sets,
  }));
  if (!data.length) {
    return <div className="text-sm text-muted text-center py-10">Sin registros todavía</div>;
  }
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id={'g-' + metric} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={cfg.color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={cfg.color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#232940" strokeDasharray="3 3" />
          <XAxis dataKey="date" stroke="#8892b0" fontSize={11} />
          <YAxis stroke="#8892b0" fontSize={11} />
          <Tooltip content={<CustomTooltip metric={metric} />} />
          <Area
            type="monotone"
            dataKey={cfg.key}
            stroke={cfg.color}
            strokeWidth={2}
            fill={`url(#g-${metric})`}
            dot={{ r: 3, fill: cfg.color }}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
