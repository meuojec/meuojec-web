"use client";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

// ── PALETA ───────────────────────────────────────────────────────────────────
const AZUL = "#3b82f6";
const VERDE = "#22c55e";
const ROSA = "#ec4899";
const GRIS = "#6b7280";

const DED_COLORS = [
  "#3b82f6", "#22c55e", "#f59e0b", "#ec4899",
  "#8b5cf6", "#06b6d4", "#f97316", "#a3e635",
  "#fb7185", "#34d399", "#fbbf24", "#60a5fa",
  "#c084fc", "#2dd4bf", "#f87171",
];

// ── TOOLTIP CUSTOM ────────────────────────────────────────────────────────────
function TooltipCustom({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/15 bg-[#0f172a] px-3 py-2 text-xs shadow-lg">
      <div className="text-white/50 mb-1">{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span style={{ color: p.color ?? p.fill }} className="font-bold">
            {p.value}
          </span>
          <span className="text-white/60">{p.name ?? "total"}</span>
        </div>
      ))}
    </div>
  );
}

// ── DONUT SEXO ────────────────────────────────────────────────────────────────
function DonutSexo({
  hombres,
  mujeres,
  sinSexo,
}: {
  hombres: number;
  mujeres: number;
  sinSexo: number;
}) {
  const total = hombres + mujeres + sinSexo;
  if (total === 0) return <div className="text-sm text-white/40 p-4">Sin datos</div>;

  const pctH = Math.round((hombres / total) * 100);
  const pctM = Math.round((mujeres / total) * 100);
  const pctS = 100 - pctH - pctM;

  // SVG donut manual (para mayor control visual)
  const r = 42;
  const cx = 60;
  const cy = 60;
  const circum = 2 * Math.PI * r;

  const segments = [
    { label: "Hombres", pct: pctH, count: hombres, color: AZUL },
    { label: "Mujeres", pct: pctM, count: mujeres, color: ROSA },
    { label: "Sin info", pct: pctS, count: sinSexo, color: GRIS },
  ].filter((s) => s.pct > 0);

  let offset = 0;
  return (
    <div className="flex items-center gap-6">
      <svg width={120} height={120} viewBox="0 0 120 120">
        {segments.map((s, i) => {
          const dash = (s.pct / 100) * circum;
          const el = (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={14}
              strokeDasharray={`${dash} ${circum - dash}`}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${cx} ${cy})`}
              strokeLinecap="butt"
            />
          );
          offset += dash;
          return el;
        })}
        {/* Centro */}
        <text x={cx} y={cy - 4} textAnchor="middle" fill="white" fontSize={18} fontWeight="700">
          {total}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize={9}>
          total únicos
        </text>
      </svg>

      <div className="space-y-2">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-2 text-xs">
            <span
              className="inline-block w-2.5 h-2.5 rounded-sm shrink-0"
              style={{ background: s.color }}
            />
            <span className="text-white/70">{s.label}</span>
            <span className="text-white font-semibold ml-auto">{s.count}</span>
            <span className="text-white/40 w-8 text-right">{s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export default function AsistenciasCharts({
  trendDay,
  topDed,
  hombres,
  mujeres,
  sinSexo,
}: {
  trendDay: { fecha: string; total: number }[];
  topDed: { ded: string; total: number }[];
  hombres: number;
  mujeres: number;
  sinSexo: number;
}) {
  const hasTrend = trendDay.length > 0;
  const hasDed = topDed.length > 0;

  // Formatear fecha corta para el eje X
  const trendFmt = trendDay.map((d) => ({
    ...d,
    label: d.fecha.slice(5), // MM-DD
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* ── 1. Tendencia diaria ────────────────────────────────────────────── */}
      <div className="lg:col-span-2 rounded-xl border border-white/10 bg-white/5 p-5">
        <div className="text-sm font-semibold text-white mb-1">Tendencia diaria</div>
        <div className="text-xs text-white/40 mb-4">Registros por día en el rango seleccionado</div>

        {!hasTrend ? (
          <div className="flex items-center justify-center h-48 text-sm text-white/30">
            Sin datos en el rango
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trendFmt} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradAzul" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={AZUL} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={AZUL} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<TooltipCustom />} />
              <Area
                type="monotone"
                dataKey="total"
                stroke={AZUL}
                strokeWidth={2}
                fill="url(#gradAzul)"
                dot={trendDay.length <= 14 ? { r: 3, fill: AZUL, strokeWidth: 0 } : false}
                activeDot={{ r: 5, fill: AZUL }}
                name="asistentes"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── 2. Columna derecha: DED + Sexo ────────────────────────────────── */}
      <div className="space-y-5">
        {/* Distribución sexo */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <div className="text-sm font-semibold text-white mb-1">Por sexo</div>
          <div className="text-xs text-white/40 mb-4">Únicos en el rango</div>
          <DonutSexo hombres={hombres} mujeres={mujeres} sinSexo={sinSexo} />
        </div>
      </div>

      {/* ── 3. Top DED ────────────────────────────────────────────────────── */}
      <div className="lg:col-span-3 rounded-xl border border-white/10 bg-white/5 p-5">
        <div className="text-sm font-semibold text-white mb-1">Asistencia por DED</div>
        <div className="text-xs text-white/40 mb-4">
          Top {Math.min(topDed.length, 15)} grupos — total de registros en el rango
        </div>

        {!hasDed ? (
          <div className="flex items-center justify-center h-24 text-sm text-white/30">
            Sin datos
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(180, topDed.length * 32)}>
            <BarChart
              data={topDed}
              layout="vertical"
              margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="ded"
                width={110}
                tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<TooltipCustom />} />
              <Bar dataKey="total" radius={[0, 4, 4, 0]} name="asistentes" maxBarSize={22}>
                {topDed.map((_, i) => (
                  <Cell key={i} fill={DED_COLORS[i % DED_COLORS.length]} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
