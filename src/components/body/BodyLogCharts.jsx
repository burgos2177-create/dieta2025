import { useMemo, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer, ReferenceArea,
} from 'recharts';
import { useBodyLogStore } from '../../store/useBodyLogStore.js';
import { BODY_FIELD_GROUPS, CHART_BODY_FIELDS } from '../../lib/bodyFields.js';

const COLOR_BY_GROUP = {
  composition: '#00e5ff',
  control:     '#a78bfa',
  segFat:      '#f59e0b',
  segMusc:     '#22c55e',
  indicators:  '#f472b6',
};

function groupOf(key) {
  for (const g of BODY_FIELD_GROUPS) {
    if (g.items.some((i) => i.key === key)) return g.id;
  }
  return 'indicators';
}

function CustomTooltip({ active, payload, label, unit }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-xl">
      <div className="text-[0.6rem] uppercase text-muted font-display">{label}</div>
      <div className="font-mono text-sm text-white">
        {Number(payload[0].value).toFixed(2)}
        <span className="text-muted text-xs ml-1">{unit}</span>
      </div>
    </div>
  );
}

export default function BodyLogCharts() {
  const entries = useBodyLogStore((s) => s.entries);
  const [filter, setFilter] = useState('all');

  const sorted = useMemo(
    () => [...entries].sort((a, b) => a.date.localeCompare(b.date)),
    [entries]
  );

  // Keep only fields that have ≥1 data point (so chart is not empty)
  const usableFields = useMemo(() => {
    return CHART_BODY_FIELDS.filter((f) =>
      sorted.some((e) => e[f.key] != null)
    );
  }, [sorted]);

  const filtered = filter === 'all'
    ? usableFields
    : usableFields.filter((f) => groupOf(f.key) === filter);

  if (entries.length === 0) {
    return (
      <div className="text-sm text-muted text-center py-6 border border-dashed border-border rounded-lg">
        Las gráficas se generarán cuando agregues tu primer snapshot.
      </div>
    );
  }

  if (usableFields.length === 0) {
    return (
      <div className="text-sm text-muted text-center py-6 border border-dashed border-border rounded-lg">
        Captura valores numéricos en el formulario para ver las gráficas.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Group filter tabs */}
      <div className="flex flex-wrap gap-1">
        <FilterTab id="all" active={filter === 'all'} onClick={() => setFilter('all')}>Todo</FilterTab>
        {BODY_FIELD_GROUPS.map((g) => (
          <FilterTab key={g.id} id={g.id} active={filter === g.id} onClick={() => setFilter(g.id)} color={COLOR_BY_GROUP[g.id]}>
            {g.label}
          </FilterTab>
        ))}
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {filtered.map((f) => {
          const color = COLOR_BY_GROUP[groupOf(f.key)] || '#00e5ff';
          const data = sorted
            .filter((e) => e[f.key] != null)
            .map((e) => ({ date: e.date.slice(5), value: Number(e[f.key]) }));
          const values = data.map((d) => d.value);
          const last = values.at(-1);
          const first = values[0];
          const delta = last - first;
          const deltaTone = delta > 0 ? 'text-ok' : delta < 0 ? 'text-bad' : 'text-muted';
          const yMin = Math.min(...values);
          const yMax = Math.max(...values);
          const span = Math.max(1, yMax - yMin);
          return (
            <div key={f.key} className="bg-white/[0.02] border border-border rounded-lg p-3">
              <div className="flex items-baseline justify-between mb-1">
                <div className="font-display text-xs tracking-wide text-white/90 truncate">{f.label}</div>
                <div className="font-mono text-sm" style={{ color }}>
                  {last?.toFixed(2)}<span className="text-muted text-[0.6rem] ml-1">{f.unit}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[0.6rem] mb-1">
                <span className={`font-mono ${deltaTone}`}>
                  {delta === 0 ? '—' : (delta > 0 ? '+' : '') + delta.toFixed(2)}
                </span>
                <span className="text-muted">desde {sorted[0].date.slice(5)}</span>
                <span className="ml-auto text-muted font-mono">{data.length} pts</span>
              </div>
              <div className="h-24">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -28 }}>
                    <CartesianGrid stroke="#232940" strokeDasharray="3 3" />
                    <XAxis dataKey="date" stroke="#8892b0" fontSize={9} tickLine={false} axisLine={false} />
                    <YAxis
                      stroke="#8892b0"
                      fontSize={9}
                      tickLine={false}
                      axisLine={false}
                      domain={[yMin - span * 0.1, yMax + span * 0.1]}
                      width={30}
                    />
                    {f.ref && (
                      <ReferenceArea
                        y1={f.ref[0]}
                        y2={f.ref[1]}
                        fill="#22c55e"
                        fillOpacity={0.08}
                        stroke="#22c55e"
                        strokeOpacity={0.25}
                        strokeDasharray="2 2"
                      />
                    )}
                    <Tooltip content={<CustomTooltip unit={f.unit} />} />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={color}
                      strokeWidth={2}
                      dot={{ r: 2, fill: color }}
                      activeDot={{ r: 4 }}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FilterTab({ active, onClick, children, color }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-xs rounded-md border transition ${
        active
          ? 'bg-accent/15 border-accent/40 text-accent'
          : 'bg-white/[0.02] border-border text-muted hover:text-white'
      }`}
      style={active && color ? { color, borderColor: color + '55', background: color + '12' } : undefined}
    >
      {children}
    </button>
  );
}
