"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

type M = { fecha: string; cantidad: number; tipo: string };

function ymd(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function MovementsChart({ movimientos }: { movimientos: M[] }) {
  const data = useMemo(() => {
    // Agrupar por día (sumar cantidades)
    const map = new Map<string, number>();
    for (const m of movimientos) {
      const day = ymd(new Date(m.fecha));
      map.set(day, (map.get(day) ?? 0) + Number(m.cantidad ?? 0));
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, total]) => ({ date, total }));
  }, [movimientos]);

  if (!data.length) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/20 p-6">
        <div className="text-lg font-semibold">Gráfico de movimientos</div>
        <div className="mt-2 text-white/50 text-sm">Sin datos para graficar.</div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-lg font-semibold">Gráfico de movimientos</div>
          <div className="text-xs text-white/50 mt-1">
            Total de unidades movidas por día (según filtro aplicado).
          </div>
        </div>
      </div>

      <div className="mt-5 h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Area type="monotone" dataKey="total" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}