export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { getReportesIGLESIA } from "./actions";
import KpiCards from "./_components/KpiCards";
import TotalesPorCategoria from "./_components/TotalesPorCategoria";
import SerieMensual from "./_components/SerieMensual";
import ExportCSVButton from "./_components/ExportCSVButton";
import BackButton from "@/app/components/BackButton";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function firstDayOfMonthISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}

function buildQS(base: Record<string, string | undefined>, extra: Record<string, string | undefined>) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(base)) {
    if (v && v.trim() !== "") qs.set(k, v);
  }
  for (const [k, v] of Object.entries(extra)) {
    if (!v || v.trim() === "") qs.delete(k);
    else qs.set(k, v);
  }
  return qs.toString();
}

export default async function ReportesPage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>;
}) {
  const spRaw = await Promise.resolve(props.searchParams ?? {});
  const get1 = (k: string) => {
    const v = spRaw[k];
    return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
  };

  const desde = (get1("desde") || firstDayOfMonthISO()).slice(0, 10);
  const hasta = (get1("hasta") || todayISO()).slice(0, 10);
  const tipo = (get1("tipo") || "TODOS").toUpperCase(); // TODOS|INGRESO|EGRESO|TRANSFERENCIA

  const data = await getReportesIGLESIA({ desde, hasta, tipo: tipo as any });

  const baseParams: Record<string, string | undefined> = { desde, hasta, tipo };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <BackButton />
            <h1 className="text-xl font-semibold text-white">Finanzas · Reportes (IGLESIA)</h1>
          </div>
          <p className="text-sm text-white/60">KPIs, totales por categoría y serie mensual.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ExportCSVButton
            filename={`finanzas_categoria_${desde}_a_${hasta}.csv`}
            label="Exportar categorías (CSV)"
            rows={data.export_categoria}
          />
          <ExportCSVButton
            filename={`finanzas_serie_${desde}_a_${hasta}.csv`}
            label="Exportar serie mensual (CSV)"
            rows={data.export_serie}
          />
        </div>
      </div>

      {/* Filtros */}
      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <form className="grid gap-3 md:grid-cols-4" action="/dashboard/finanzas/reportes" method="get">
          <div>
            <label className="block text-xs text-white/60 mb-1">Desde</label>
            <input
              type="date"
              name="desde"
              defaultValue={desde}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
            />
          </div>

          <div>
            <label className="block text-xs text-white/60 mb-1">Hasta</label>
            <input
              type="date"
              name="hasta"
              defaultValue={hasta}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
            />
          </div>

          <div>
            <label className="block text-xs text-white/60 mb-1">Tipo</label>
            <select
              name="tipo"
              defaultValue={tipo}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
            >
              <option value="TODOS">Todos</option>
              <option value="INGRESO">Ingreso</option>
              <option value="EGRESO">Egreso</option>
              <option value="TRANSFERENCIA">Transferencia</option>
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15"
            >
              Aplicar
            </button>

            <Link
              href={`/dashboard/finanzas/reportes?${buildQS(baseParams, {
                desde: firstDayOfMonthISO(),
                hasta: todayISO(),
                tipo: "TODOS",
              })}`}
              className="w-full text-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
            >
              Reset
            </Link>
          </div>
        </form>
      </div>

      {/* KPIs */}
      <KpiCards {...data.kpis} />

      {/* Totales por categoría */}
      <TotalesPorCategoria rows={data.totalesPorCategoria} />

      {/* Serie mensual */}
      <SerieMensual rows={data.serieMensual} />
    </div>
  );
}
