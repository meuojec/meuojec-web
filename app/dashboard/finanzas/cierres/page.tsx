export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { ChevronLeft, CheckCircle, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

function fmtMoney(n: number) {
  return n.toLocaleString("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  });
}

function fmtMesLabel(yyyymm: string) {
  const [y, m] = yyyymm.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString("es-CL", { month: "long", year: "numeric" })
    .replace(/^\p{L}/u, (c: string) => c.toUpperCase());
}

type MovRow = {
  fecha: string | null;
  tipo: string | null;
  monto: number | null;
};

type MesSummary = {
  mes: string;
  ingresos: number;
  egresos: number;
  saldo: number;
  movimientos: number;
};

export default async function CierresPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: prof } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const isAdmin = prof?.role === "admin";

  // Traer todos los movimientos (solo fecha, tipo y monto para el resumen)
  const { data: movsData, error } = await supabase
    .from("fin_movimientos")
    .select("fecha,tipo,monto")
    .eq("area", "IGLESIA")
    .not("fecha", "is", null)
    .order("fecha", { ascending: false });

  const movs = (movsData ?? []) as MovRow[];

  // Agrupar por mes (YYYY-MM)
  const mesMap = new Map<string, MesSummary>();
  for (const m of movs) {
    if (!m.fecha) continue;
    const mes = m.fecha.slice(0, 7); // "YYYY-MM"
    if (!mesMap.has(mes)) {
      mesMap.set(mes, { mes, ingresos: 0, egresos: 0, saldo: 0, movimientos: 0 });
    }
    const s = mesMap.get(mes)!;
    s.movimientos++;
    const amt = m.monto ?? 0;
    if (m.tipo === "INGRESO") s.ingresos += amt;
    else if (m.tipo === "EGRESO") s.egresos += amt;
    s.saldo = s.ingresos - s.egresos;
  }

  const meses = Array.from(mesMap.values()).sort((a, b) => b.mes.localeCompare(a.mes));

  // Totales generales
  const totalIngresos = meses.reduce((a, m) => a + m.ingresos, 0);
  const totalEgresos = meses.reduce((a, m) => a + m.egresos, 0);
  const saldoTotal = totalIngresos - totalEgresos;

  // El mes actual no esta cerrado aun
  const now = new Date();
  const mesActual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/finanzas/transacciones"
            className="inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/5 p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-white">Cierres mensuales</h1>
            <p className="text-sm text-white/60">
              Resumen financiero por mes. Los meses pasados estan cerrados.
            </p>
          </div>
        </div>

        <Link
          href="/dashboard/reportes/finanzas"
          className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/5 hover:text-white"
        >
          Ver reporte completo
        </Link>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
          Error al cargar movimientos: {error.message}
        </div>
      )}

      {/* KPIs globales */}
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="text-xs text-white/60 mb-1">Total ingresos historico</div>
          <div className="text-2xl font-bold text-emerald-400">{fmtMoney(totalIngresos)}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="text-xs text-white/60 mb-1">Total egresos historico</div>
          <div className="text-2xl font-bold text-red-400">{fmtMoney(totalEgresos)}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="text-xs text-white/60 mb-1">Saldo acumulado</div>
          <div className={["text-2xl font-bold", saldoTotal >= 0 ? "text-white" : "text-red-400"].join(" ")}>
            {fmtMoney(saldoTotal)}
          </div>
        </div>
      </div>

      {/* Tabla de cierres por mes */}
      {meses.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-black/20 p-8 text-center text-white/50">
          No hay movimientos registrados aun.
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-black/20 overflow-hidden">
          <div className="border-b border-white/10 px-4 py-3">
            <h2 className="text-sm font-semibold text-white/80">Cierres por periodo</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="border-b border-white/10 text-white/60">
                <tr>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Periodo</th>
                  <th className="px-4 py-3 text-right">Movimientos</th>
                  <th className="px-4 py-3 text-right">Ingresos</th>
                  <th className="px-4 py-3 text-right">Egresos</th>
                  <th className="px-4 py-3 text-right">Saldo</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {meses.map((m) => {
                  const esMesActual = m.mes === mesActual;
                  return (
                    <tr key={m.mes} className="border-b border-white/5 hover:bg-white/[0.03]">
                      <td className="px-4 py-3">
                        {esMesActual ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-300">
                            <Clock className="h-3.5 w-3.5" />
                            En curso
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                            <CheckCircle className="h-3.5 w-3.5" />
                            Cerrado
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-white capitalize">
                        {fmtMesLabel(m.mes)}
                      </td>
                      <td className="px-4 py-3 text-right text-white/70">{m.movimientos}</td>
                      <td className="px-4 py-3 text-right text-emerald-400">{fmtMoney(m.ingresos)}</td>
                      <td className="px-4 py-3 text-right text-red-400">{fmtMoney(m.egresos)}</td>
                      <td className={["px-4 py-3 text-right font-semibold", m.saldo >= 0 ? "text-white" : "text-red-400"].join(" ")}>
                        {fmtMoney(m.saldo)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/dashboard/reportes/finanzas?from=${m.mes}-01&to=${m.mes}-31`}
                          className="inline-flex items-center rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10"
                        >
                          Ver detalle
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!isAdmin && (
        <div className="rounded-2xl border border-white/10 bg-black/20 p-3 text-sm text-white/60">
          Vista de solo lectura. Solo los administradores pueden registrar nuevas transacciones.
        </div>
      )}
    </div>
  );
}
