// app/dashboard/reportes/finanzas/page.tsx
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

import SectionCard from "../_components/SectionCard";
import KpiCard from "../_components/KpiCard";
import ReportFilters from "../_components/ReportFilters";
import ExportClient from "./export-client";
import FinanzasExtraFilters from "./FinanzasExtraFilters";
import { getFinanzasReport } from "./actions";

function monthStartISO() {
  const d = new Date();
  const first = new Date(d.getFullYear(), d.getMonth(), 1);
  return first.toISOString().slice(0, 10);
}
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function moneyCL(n: number) {
  try {
    return n.toLocaleString("es-CL", {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0,
    });
  } catch {
    return String(n);
  }
}

function fmtMesLabel(yyyymmStr: string) {
  // "2026-02" => "Febrero 2026"
  const [y, m] = (yyyymmStr || "").split("-");
  const year = Number(y);
  const month = Number(m);

  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    return yyyymmStr || "—";
  }

  const d = new Date(year, month - 1, 1);
  const s = d.toLocaleDateString("es-CL", { month: "long", year: "numeric" });

  // Capitaliza primera letra (soporta tildes)
  return s.replace(/^\p{L}/u, (c) => c.toUpperCase());
}

export default async function ReporteFinanzasPage(props: {
  searchParams?: Promise<{ [k: string]: string | string[] | undefined }>;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const sp = (props.searchParams ? await props.searchParams : {}) as Record<string, any>;

  const from = (sp.from as string) || monthStartISO();
  const to = (sp.to as string) || todayISO();
  const tipo = (sp.tipo as string) || "";
  const cuenta = (sp.cuenta as string) || "";
  const categoria = (sp.categoria as string) || "";

  const rep = await getFinanzasReport({
    from,
    to,
    tipo: (tipo as any) || undefined,
    cuenta: cuenta || undefined,
    categoria: categoria || undefined,
  });

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-white">Reportes · Finanzas</h1>
            <p className="mt-1 text-sm text-white/70">
              Ingresos vs egresos, por categoría, por cuenta, saldo y base para cierres.
            </p>
          </div>

          <ExportClient
            from={from}
            to={to}
            tipo={(tipo as any) || undefined}
            cuenta={cuenta || undefined}
            categoria={categoria || undefined}
          />
        </div>

        <div className="mt-4 space-y-3">
          <ReportFilters />
          <FinanzasExtraFilters
            initialTipo={tipo}
            initialCuenta={cuenta}
            initialCategoria={categoria}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard label="Ingresos" value={moneyCL(rep.kpis.ingresos)} />
        <KpiCard label="Egresos" value={moneyCL(rep.kpis.egresos)} />
        <KpiCard label="Saldo" value={moneyCL(rep.kpis.saldo)} hint="Ingresos - Egresos" />
        <KpiCard label="Movimientos" value={rep.kpis.totalMovs} />
      </div>

      <SectionCard title="Ingresos vs Egresos por mes" subtitle="Serie mensual del rango filtrado">
        {rep.serieMensual.length === 0 ? (
          <div className="text-sm text-white/60">Sin movimientos en el rango.</div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-white/70">
                <tr className="border-b border-white/10">
                  <th className="py-2 text-left font-semibold">Mes</th>
                  <th className="py-2 text-right font-semibold">Ingresos</th>
                  <th className="py-2 text-right font-semibold">Egresos</th>
                  <th className="py-2 text-right font-semibold">Saldo</th>
                </tr>
              </thead>
              <tbody className="text-white/90">
                {rep.serieMensual.map((r) => (
                  <tr key={r.mes} className="border-b border-white/5">
                    <td className="py-2 whitespace-nowrap">{fmtMesLabel(r.mes)}</td>
                    <td className="py-2 text-right">{moneyCL(r.ingresos)}</td>
                    <td className="py-2 text-right">{moneyCL(r.egresos)}</td>
                    <td className="py-2 text-right">{moneyCL(r.saldo)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Top categorías (Ingresos)" subtitle="Top 10 por monto">
          {rep.topCategoriasIngreso.length === 0 ? (
            <div className="text-sm text-white/60">Sin ingresos.</div>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="text-white/70">
                  <tr className="border-b border-white/10">
                    <th className="py-2 text-left font-semibold">Categoría</th>
                    <th className="py-2 text-right font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody className="text-white/90">
                  {rep.topCategoriasIngreso.map((r) => (
                    <tr key={r.id} className="border-b border-white/5">
                      <td className="py-2">{r.nombre}</td>
                      <td className="py-2 text-right">{moneyCL(r.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Top categorías (Egresos)" subtitle="Top 10 por monto">
          {rep.topCategoriasEgreso.length === 0 ? (
            <div className="text-sm text-white/60">Sin egresos.</div>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="text-white/70">
                  <tr className="border-b border-white/10">
                    <th className="py-2 text-left font-semibold">Categoría</th>
                    <th className="py-2 text-right font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody className="text-white/90">
                  {rep.topCategoriasEgreso.map((r) => (
                    <tr key={r.id} className="border-b border-white/5">
                      <td className="py-2">{r.nombre}</td>
                      <td className="py-2 text-right">{moneyCL(r.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>

      <SectionCard title="Por cuenta" subtitle="Ingresos, egresos, saldo y cantidad de movimientos">
        {rep.porCuenta.length === 0 ? (
          <div className="text-sm text-white/60">Sin datos.</div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-white/70">
                <tr className="border-b border-white/10">
                  <th className="py-2 text-left font-semibold">Cuenta</th>
                  <th className="py-2 text-right font-semibold">Ingresos</th>
                  <th className="py-2 text-right font-semibold">Egresos</th>
                  <th className="py-2 text-right font-semibold">Saldo</th>
                  <th className="py-2 text-right font-semibold">Movs</th>
                </tr>
              </thead>
              <tbody className="text-white/90">
                {rep.porCuenta.map((c) => (
                  <tr key={c.id} className="border-b border-white/5">
                    <td className="py-2">{c.nombre}</td>
                    <td className="py-2 text-right">{moneyCL(c.ingresos)}</td>
                    <td className="py-2 text-right">{moneyCL(c.egresos)}</td>
                    <td className="py-2 text-right">{moneyCL(c.saldo)}</td>
                    <td className="py-2 text-right">{c.movs}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}