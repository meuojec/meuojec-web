"use client";

import { useState, useTransition } from "react";
import { upsertPresupuesto, type PresupuestoRow } from "./actions";

function fmtCLP(n: number) {
  return n.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
}

function BarPct({ pct, tipo }: { pct: number; tipo: "INGRESO" | "EGRESO" }) {
  const clamped = Math.min(pct, 100);
  const over = pct > 100;
  const color = tipo === "INGRESO"
    ? over ? "bg-emerald-300" : "bg-emerald-500"
    : over ? "bg-red-500" : pct >= 85 ? "bg-amber-400" : "bg-blue-500";
  return (
    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${clamped}%` }} />
    </div>
  );
}

function EditCell({
  row, mes, isAdmin,
}: {
  row: PresupuestoRow;
  mes: string;
  isAdmin: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(String(row.presupuestado));
  const [isPending, startTransition] = useTransition();
  const [err, setErr] = useState("");

  if (!isAdmin) {
    return <span className="text-white/70">{fmtCLP(row.presupuestado)}</span>;
  }

  if (!editing) {
    return (
      <button
        onClick={() => { setVal(String(row.presupuestado || "")); setEditing(true); setErr(""); }}
        className="text-white/70 hover:text-white underline-offset-2 hover:underline transition text-left"
        title="Clic para editar presupuesto"
      >
        {row.presupuestado > 0 ? fmtCLP(row.presupuestado) : <span className="text-white/25 italic">Sin presupuesto</span>}
      </button>
    );
  }

  function handleSave() {
    const monto = Number(val.replace(/\./g, "").replace(",", "."));
    if (isNaN(monto) || monto < 0) { setErr("Monto inválido"); return; }
    startTransition(async () => {
      const res = await upsertPresupuesto({ categoria_id: row.categoria_id, mes, monto });
      if (res.ok) setEditing(false);
      else setErr(res.error ?? "Error");
    });
  }

  return (
    <div className="flex items-center gap-1.5">
      <input
        type="number"
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") setEditing(false); }}
        autoFocus
        className="w-28 rounded border border-white/20 bg-black/40 px-2 py-1 text-sm text-white outline-none focus:border-white/40"
      />
      <button onClick={handleSave} disabled={isPending}
        className="rounded bg-white px-2 py-1 text-xs font-semibold text-black hover:bg-gray-100 disabled:opacity-50">
        {isPending ? "…" : "OK"}
      </button>
      <button onClick={() => setEditing(false)}
        className="text-white/30 hover:text-white text-lg leading-none px-1">×</button>
      {err && <span className="text-xs text-red-400">{err}</span>}
    </div>
  );
}

type Props = {
  rows: PresupuestoRow[];
  mes: string;
  isAdmin: boolean;
  totalPresupuestadoIngreso: number;
  totalPresupuestadoEgreso: number;
  totalEjecutadoIngreso: number;
  totalEjecutadoEgreso: number;
};

export default function PresupuestoClient({
  rows, mes, isAdmin,
  totalPresupuestadoIngreso, totalPresupuestadoEgreso,
  totalEjecutadoIngreso, totalEjecutadoEgreso,
}: Props) {
  const ingresos = rows.filter(r => r.tipo === "INGRESO");
  const egresos  = rows.filter(r => r.tipo === "EGRESO");

  const balPres = totalPresupuestadoIngreso - totalPresupuestadoEgreso;
  const balEjec = totalEjecutadoIngreso - totalEjecutadoEgreso;

  function Section({ title, items, color }: { title: string; items: PresupuestoRow[]; color: string }) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        <div className={`px-5 py-3 border-b border-white/10 flex items-center gap-2 text-sm font-semibold ${color}`}>
          {title}
          {isAdmin && <span className="ml-1 text-xs font-normal text-white/30">(clic en monto para editar)</span>}
        </div>
        <table className="w-full text-sm">
          <thead className="bg-black/20 text-white/40 text-xs">
            <tr>
              <th className="text-left px-5 py-2 font-medium">Categoría</th>
              <th className="text-right px-4 py-2 font-medium">Presupuesto</th>
              <th className="text-right px-4 py-2 font-medium">Ejecutado</th>
              <th className="text-right px-4 py-2 font-medium w-16">%</th>
              <th className="px-4 py-2 w-40">Progreso</th>
              <th className="text-right px-5 py-2 font-medium">Diferencia</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {items.map(row => (
              <tr key={row.categoria_id} className="hover:bg-white/[0.03]">
                <td className="px-5 py-3 text-white/80">{row.categoria_nombre}</td>
                <td className="px-4 py-3 text-right">
                  <EditCell row={row} mes={mes} isAdmin={isAdmin} />
                </td>
                <td className="px-4 py-3 text-right text-white/70">{fmtCLP(row.ejecutado)}</td>
                <td className={`px-4 py-3 text-right font-semibold tabular-nums ${
                  row.pct > 100 ? (row.tipo === "INGRESO" ? "text-emerald-400" : "text-red-400")
                  : row.pct >= 85 && row.tipo === "EGRESO" ? "text-amber-400"
                  : "text-white/70"
                }`}>
                  {row.presupuestado > 0 || row.ejecutado > 0 ? `${row.pct}%` : "—"}
                </td>
                <td className="px-4 py-3">
                  {(row.presupuestado > 0 || row.ejecutado > 0) && (
                    <BarPct pct={row.pct} tipo={row.tipo} />
                  )}
                </td>
                <td className={`px-5 py-3 text-right tabular-nums ${
                  row.diferencia >= 0 ? "text-white/50" : "text-red-400"
                }`}>
                  {row.presupuestado > 0 ? fmtCLP(row.diferencia) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs globales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs text-white/50">Ingresos presupuestados</div>
          <div className="mt-1 text-lg font-semibold text-emerald-400">{fmtCLP(totalPresupuestadoIngreso)}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs text-white/50">Ingresos ejecutados</div>
          <div className="mt-1 text-lg font-semibold text-emerald-300">{fmtCLP(totalEjecutadoIngreso)}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs text-white/50">Egresos presupuestados</div>
          <div className="mt-1 text-lg font-semibold text-red-400">{fmtCLP(totalPresupuestadoEgreso)}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs text-white/50">Egresos ejecutados</div>
          <div className="mt-1 text-lg font-semibold text-red-300">{fmtCLP(totalEjecutadoEgreso)}</div>
        </div>
      </div>

      {/* Balance */}
      <div className="grid grid-cols-2 gap-3">
        <div className={`rounded-xl border p-4 ${balPres >= 0 ? "border-white/10 bg-white/5" : "border-red-500/20 bg-red-500/5"}`}>
          <div className="text-xs text-white/50">Balance presupuestado</div>
          <div className={`mt-1 text-xl font-bold ${balPres >= 0 ? "text-white" : "text-red-400"}`}>{fmtCLP(balPres)}</div>
        </div>
        <div className={`rounded-xl border p-4 ${balEjec >= 0 ? "border-white/10 bg-white/5" : "border-red-500/20 bg-red-500/5"}`}>
          <div className="text-xs text-white/50">Balance ejecutado</div>
          <div className={`mt-1 text-xl font-bold ${balEjec >= 0 ? "text-white" : "text-red-400"}`}>{fmtCLP(balEjec)}</div>
        </div>
      </div>

      {/* Tablas por tipo */}
      {ingresos.length > 0 && <Section title="Ingresos" items={ingresos} color="text-emerald-400" />}
      {egresos.length  > 0 && <Section title="Egresos"  items={egresos}  color="text-red-400"     />}
    </div>
  );
}
