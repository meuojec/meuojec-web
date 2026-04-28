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
} from "recharts";

const AZUL = "#3b82f6";
const VERDE = "#22c55e";

function TooltipCustom({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/15 bg-[#0f172a] px-3 py-2 text-xs shadow-lg">
      <div className="text-white/50 mb-1">{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span style={{ color: p.stroke ?? p.fill ?? AZUL }} className="font-bold">
            {p.value}
          </span>
          <span className="text-white/60">{p.name}</span>
        </div>
      ))}
    </div>
  );
}

export default function DashboardCharts({
  asistenciaTrend,
  miembrosTrend,
}: {
  asistenciaTrend: { label: string; total: number }[];
  miembrosTrend: { label: string; total: number }[];
}) {
  const hasAsist = asistenciaTrend.length > 0;
  const hasMiembros = miembrosTrend.length > 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Asistencia últimas sesiones */}
      <div className="rounded-2xl border border-white/10 bg-black/20 p-6">
        <div className="flex items-center justify-between mb-1">
          <div className="text-sm font-semibold text-white">Asistencia por sesión</div>
          <span className="text-xs text-white/30">Últimas {asistenciaTrend.length} sesiones</span>
        </div>
        <div className="text-xs text-white/40 mb-5">Total de asistentes registrados</div>

        {!hasAsist ? (
          <div className="flex items-center justify-center h-40 text-sm text-white/30">Sin datos disponibles</div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={asistenciaTrend} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradAsist" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={AZUL} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={AZUL} stopOpacity={0} />
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
                fill="url(#gradAsist)"
                dot={asistenciaTrend.length <= 20 ? { r: 3, fill: AZUL, strokeWidth: 0 } : false}
                activeDot={{ r: 5, fill: AZUL }}
                name="asistentes"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Crecimiento mensual de miembros */}
      <div className="rounded-2xl border border-white/10 bg-black/20 p-6">
        <div className="flex items-center justify-between mb-1">
          <div className="text-sm font-semibold text-white">Crecimiento de miembros</div>
          <span className="text-xs text-white/30">Nuevos por mes</span>
        </div>
        <div className="text-xs text-white/40 mb-5">Altas en los últimos 12 meses</div>

        {!hasMiembros ? (
          <div className="flex items-center justify-center h-40 text-sm text-white/30">Sin datos disponibles</div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={miembrosTrend} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<TooltipCustom />} />
              <Bar
                dataKey="total"
                fill={VERDE}
                fillOpacity={0.75}
                radius={[4, 4, 0, 0]}
                maxBarSize={32}
                name="nuevos miembros"
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
