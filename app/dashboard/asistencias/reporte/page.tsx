// app/dashboard/asistencias/reporte/page.tsx
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAsistenciasData, getEventosDeds } from "./actions";
import FiltrosAsistencias from "./FiltrosAsistencias";
import AsistenciasCharts from "./AsistenciasCharts";
import TablaAsistencias from "./TablaAsistencias";

function todayISO() {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Santiago" }).format(new Date());
}

function monthStartISO() {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Santiago" }));
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

function Kpi({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="text-xs text-white/40 mb-1">{label}</div>
      <div className={`text-3xl font-bold ${color ?? "text-white"}`}>{value}</div>
      {sub && <div className="text-xs text-white/30 mt-1">{sub}</div>}
    </div>
  );
}

export default async function ReporteAsistenciasPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const sp = (await searchParams) ?? {};
  const getString = (k: string) => { const v = sp[k]; return typeof v === "string" ? v.trim() : ""; };

  const today = todayISO();
  const from = getString("from") || monthStartISO();
  const to = getString("to") || today;
  const q = getString("q");
  const ded = getString("ded");
  const evento = getString("evento");

  const [data, { eventos, deds }] = await Promise.all([
    getAsistenciasData({ from, to, q, ded, evento }),
    getEventosDeds(),
  ]);

  const { kpis, trendDay, topDed, rows } = data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/dashboard/asistencias"
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60 hover:bg-white/10 mb-3"
          >
            ← Asistencias
          </Link>
          <h1 className="text-2xl font-bold text-white">Reporte de asistencias</h1>
          <p className="mt-1 text-sm text-white/50">
            Período: <span className="text-white/80">{from}</span> → <span className="text-white/80">{to}</span>
          </p>
        </div>
        <Link
          href="/dashboard/asistencias/escanear"
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15"
        >
          ← Ir al escáner
        </Link>
      </div>

      <Suspense fallback={null}>
        <FiltrosAsistencias eventos={eventos} deds={deds} total={kpis.total} exportBase="/api/asistencias/export" />
      </Suspense>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Kpi label="Registros" value={kpis.total} />
        <Kpi label="Únicos (RUT)" value={kpis.unicos} sub="personas distintas" />
        <Kpi label="Nuevos" value={kpis.nuevos} sub="1ª vez histórica" color="text-green-400" />
        <Kpi label="Recurrentes" value={kpis.recurrentes} color="text-blue-400" />
        <Kpi label="Hombres" value={kpis.hombres} color="text-sky-300" />
        <Kpi label="Mujeres" value={kpis.mujeres} color="text-pink-300" />
        <Kpi label="Sin clasificar" value={kpis.sinSexo} color="text-white/40" />
      </div>

      <AsistenciasCharts
        trendDay={trendDay}
        topDed={topDed}
        hombres={kpis.hombres}
        mujeres={kpis.mujeres}
        sinSexo={kpis.sinSexo}
      />

      <TablaAsistencias rows={rows} />
    </div>
  );
}
