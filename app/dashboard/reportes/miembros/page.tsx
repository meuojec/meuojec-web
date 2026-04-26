// app/dashboard/reportes/miembros/page.tsx
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import SectionCard from "../_components/SectionCard";
import KpiCard from "../_components/KpiCard";
import ReportFilters from "../_components/ReportFilters";
import ExportClient from "./export-client";
import { getMiembrosReport } from "./actions";
import MiembrosExtraFilters from "./MiembrosExtraFilters";

function monthStartISO() {
  const d = new Date();
  const first = new Date(d.getFullYear(), d.getMonth(), 1);
  return first.toISOString().slice(0, 10);
}
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default async function ReporteMiembrosPage({
  searchParams,
}: {
  searchParams?: Promise<{ [k: string]: string | string[] | undefined }>;
}) {
  const sp = searchParams ? await searchParams : {};
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const from = (sp?.from as string) || monthStartISO();
  const to = (sp?.to as string) || todayISO();
  const ded = (sp?.ded as string) || "";
  const sexo = (sp?.sexo as string) || "";
  const incompletos = (sp?.incompletos as string) || ""; // "1" o ""

  const rep = await getMiembrosReport({
    from,
    to,
    ded: ded || undefined,
    sexo: sexo || undefined,
    incompletos: incompletos === "1" ? true : undefined,
  });

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/reportes"
              className="inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/5 p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">Reportes · Miembros</h1>
              <p className="mt-1 text-sm text-white/70">
                Cumpleanos del mes, distribucion y calidad de datos (incompletos).
              </p>
            </div>
          </div>

          <ExportClient
            from={from}
            to={to}
            ded={ded || undefined}
            sexo={sexo || undefined}
            incompletos={incompletos === "1" ? true : undefined}
          />
        </div>

        <div className="mt-4 space-y-3">
          {/* Fechas + DED (client por dentro, ok) */}
          <ReportFilters showDed />

          {/* Sexo + Incompletos (client) */}
          <MiembrosExtraFilters
            initialSexo={sexo}
            initialIncompletos={incompletos}
          />

          <div className="text-xs text-white/50">
            Nota: el rango de fechas aplica a “miembros nuevos en el rango”.
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard label="Total miembros" value={rep.kpis.totalMiembros} />
        <KpiCard
          label="Nuevos (rango)"
          value={rep.kpis.nuevosRango}
          hint={`${from} → ${to}`}
        />
        <KpiCard label="Incompletos" value={rep.kpis.incompletos} />
        <KpiCard label="% Completos" value={`${rep.kpis.pctCompletos}%`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Cumpleaños del mes" subtitle="Listado por día (mes actual)">
          {rep.cumplesMes.length === 0 ? (
            <div className="text-sm text-white/60">No hay cumpleaños registrados este mes.</div>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="text-white/70">
                  <tr className="border-b border-white/10">
                    <th className="py-2 text-left font-semibold">Día</th>
                    <th className="py-2 text-left font-semibold">RUT</th>
                    <th className="py-2 text-left font-semibold">Nombre</th>
                    <th className="py-2 text-left font-semibold">DED</th>
                  </tr>
                </thead>
                <tbody className="text-white/90">
                  {rep.cumplesMes.map((r) => (
                    <tr key={`${r.rut}-${r.dia}`} className="border-b border-white/5">
                      <td className="py-2 whitespace-nowrap">{r.dia}</td>
                      <td className="py-2 whitespace-nowrap">{r.rut}</td>
                      <td className="py-2">{r.nombre}</td>
                      <td className="py-2">{r.ded || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Distribución por DED" subtitle="Top 10 por cantidad">
          {rep.topDed.length === 0 ? (
            <div className="text-sm text-white/60">Sin datos.</div>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="text-white/70">
                  <tr className="border-b border-white/10">
                    <th className="py-2 text-left font-semibold">DED</th>
                    <th className="py-2 text-right font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody className="text-white/90">
                  {rep.topDed.map((r) => (
                    <tr key={r.ded} className="border-b border-white/5">
                      <td className="py-2">{r.ded}</td>
                      <td className="py-2 text-right">{r.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>

      <SectionCard
        title="Incompletos (detalle)"
        subtitle="Reglas: falta nombres/apellidos/sexo/ded/fecha_nacimiento/edad o foto"
      >
        {rep.incompletosDetalle.length === 0 ? (
          <div className="text-sm text-white/60">No hay incompletos (según reglas actuales).</div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-white/70">
                <tr className="border-b border-white/10">
                  <th className="py-2 text-left font-semibold">RUT</th>
                  <th className="py-2 text-left font-semibold">Nombre</th>
                  <th className="py-2 text-left font-semibold">DED</th>
                  <th className="py-2 text-left font-semibold">Faltantes</th>
                </tr>
              </thead>
              <tbody className="text-white/90">
                {rep.incompletosDetalle.slice(0, 200).map((r) => (
                  <tr key={r.rut} className="border-b border-white/5">
                    <td className="py-2 whitespace-nowrap">{r.rut}</td>
                    <td className="py-2">{r.nombre}</td>
                    <td className="py-2">{r.ded || "—"}</td>
                    <td className="py-2 text-white/80">{r.faltantes.join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rep.incompletosDetalle.length > 200 ? (
              <div className="mt-2 text-xs text-white/50">
                Mostrando 200 de {rep.incompletosDetalle.length}. (Luego agregamos paginación)
              </div>
            ) : null}
          </div>
        )}
      </SectionCard>
    </div>
  );
}