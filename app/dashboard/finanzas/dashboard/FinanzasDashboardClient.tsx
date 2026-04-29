"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer
} from "recharts";

type MesData = { mes: string; ingresos: number; egresos: number };
type CatData = { nombre: string; total: number };
type Mov = {
  id: string; fecha: string | null; tipo: string | null;
  monto: number | null; descripcion: string | null;
  categoria: string | null; cuenta: string | null;
};

const COLORS = ["#6366f1","#f59e0b","#10b981","#ef4444","#3b82f6","#8b5cf6","#ec4899","#14b8a6"];

function fmtMoney(n: number) {
  return n.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
}

function CustomTooltipBar({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-xs space-y-1">
      <div className="font-semibold text-white/80">{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ color: p.color }}>{p.name}: {fmtMoney(p.value)}</div>
      ))}
    </div>
  );
}

function CustomTooltipPie({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-xs">
      <div className="font-semibold text-white/80">{d.name}</div>
      <div style={{ color: d.payload.fill }}>{fmtMoney(d.value)}</div>
    </div>
  );
}

export default function FinanzasDashboardClient({
  meses, categorias, recientes, totalIngresos, totalEgresos, balanceNeto, cuentas
}: {
  meses: MesData[];
  categorias: CatData[];
  recientes: Mov[];
  totalIngresos: number;
  totalEgresos: number;
  balanceNeto: number;
  cuentas: { nombre: string; saldo: number }[];
}) {
  return (
    <div className="space-y-8">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Ingresos (año)" value={fmtMoney(totalIngresos)} color="emerald" />
        <KpiCard label="Egresos (año)" value={fmtMoney(totalEgresos)} color="red" />
        <KpiCard label="Balance neto" value={fmtMoney(balanceNeto)} color={balanceNeto >= 0 ? "blue" : "red"} />
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
          <div className="text-xs text-white/50">Saldo por cuenta</div>
          {cuentas.length === 0 && <div className="text-sm text-white/30">Sin cuentas</div>}
          {cuentas.map((c, i) => (
            <div key={i} className="flex justify-between text-xs">
              <span className="text-white/70 truncate">{c.nombre}</span>
              <span className="font-mono text-white/90 ml-2">{fmtMoney(c.saldo)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Gráfico ingresos vs egresos */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <div className="font-semibold mb-4">Ingresos vs Egresos — últimos 12 meses</div>
        {meses.length === 0 ? (
          <div className="text-sm text-white/40 py-8 text-center">Sin movimientos registrados</div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={meses} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="mes" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
                tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltipBar />} />
              <Legend wrapperStyle={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }} />
              <Bar dataKey="ingresos" name="Ingresos" fill="#10b981" radius={[3,3,0,0]} />
              <Bar dataKey="egresos" name="Egresos" fill="#ef4444" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Torta categorías + movimientos recientes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Torta */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <div className="font-semibold mb-4">Top categorías de egreso</div>
          {categorias.length === 0 ? (
            <div className="text-sm text-white/40 py-8 text-center">Sin egresos categorizados</div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={categorias} dataKey="total" nameKey="nombre"
                    cx="50%" cy="50%" outerRadius={80} innerRadius={40}>
                    {categorias.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltipPie />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="w-full space-y-1">
                {categorias.slice(0, 6).map((c, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-white/70">{c.nombre}</span>
                    </div>
                    <span className="font-mono text-white/80">{fmtMoney(c.total)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Movimientos recientes */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <div className="font-semibold mb-4">Movimientos recientes</div>
          <div className="space-y-2">
            {recientes.length === 0 && (
              <div className="text-sm text-white/40 py-8 text-center">Sin movimientos</div>
            )}
            {recientes.map((m) => (
              <div key={m.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div className="min-w-0">
                  <div className="text-sm truncate">{m.descripcion || m.categoria || "—"}</div>
                  <div className="text-xs text-white/40">{m.fecha} · {m.cuenta}</div>
                </div>
                <div className={`ml-3 font-mono text-sm font-semibold shrink-0 ${
                  m.tipo === "ingreso" ? "text-emerald-400" : m.tipo === "egreso" ? "text-red-400" : "text-white/60"
                }`}>
                  {m.tipo === "egreso" ? "-" : "+"}{fmtMoney(Math.abs(m.monto ?? 0))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, color }: { label: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    emerald: "text-emerald-400", red: "text-red-400", blue: "text-blue-400"
  };
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="text-xs text-white/50">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${colors[color] ?? "text-white"}`}>{value}</div>
    </div>
  );
}
