// app/dashboard/reportes/asistencia/page.tsx
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
import { getAsistenciaReport } from "./actions";

function monthStartISO() {
  const d = new Date();
  const first = new Date(d.getFullYear(), d.getMonth(), 1);
  return first.toISOString().slice(0, 10);
}
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default async function ReporteAsistenciaPage({
  searchParams,
}: {
  searchParams?: Promise<{ [k: string]: string | string[] | undefined }>;
}) {
  const sp = searchParams ? await searchParams : {};
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const from = (sp?.from as string) || monthStartISO();
  const to = (sp?.to as string) || todayISO();
  const ded = (sp?.ded as string) || "";
  const evento = (sp?.evento as string) || "";
  const sesion = (sp?.sesion as string) || "";

  const rep = await getAsistenciaReport({
    from,
    to,
    ded: ded || undefined,
    evento: evento || undefined,
    sesion: sesion || undefined,
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
              <h1 className="text-xl font-bold text-white">Reportes · Asistencia</h1>
              <p className="mt-1 text-sm text-white/70">
                Tendencias (dia/semana/mes), top DED, nuevos vs recurrentes, comparativo por sesion.
              </p>
            </div>
          </div>

          <ExportClient
            from={from}
            to={to}
            ded={ded || undefined}
            evento={evento || undefined}
            sesion={sesion || undefined}
          />
        </div>

        <div className="mt-4">
          {/* ✅ ahora sí mostramos filtro de sesión */}
          <ReportFilters showDed showEvento showSesion />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard label="Registros (rango)" value={rep.kpis.totalRegistros} />
        <KpiCard label="Únicos (RUT)" value={rep.kpis.totalUnicos} />
        <KpiCard label="Nuevos" value={rep.kpis.nuevos} hint="Primera asistencia histórica dentro del rango" />
        <KpiCard label="Recurrentes" value={rep.kpis.recurrentes} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard title="Tendencia diaria" subtitle="Total registros por día">
          {rep.trendDay.length === 0 ? (
            <div className="text-sm text-white/60">Sin datos.</div>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="text-white/70">
                  <tr className="border-b border-white/10">
                    <th className="py-2 text-left font-semibold">Fecha</th>
                    <th className="py-2 text-right font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody className="text-white/90">
                  {rep.trendDay.map((r) => (
                    <tr key={r.key} className="border-b border-white/5">
                      <td className="py-2">{r.key}</td>
                      <td className="py-2 text-right">{r.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Tendencia semanal" subtitle="Semana = lunes (inicio)">
          {rep.trendWeek.length === 0 ? (
            <div className="text-sm text-white/60">Sin datos.</div>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="text-white/70">
                  <tr className="border-b border-white/10">
                    <th className="py-2 text-left font-semibold">Semana (inicio)</th>
                    <th className="py-2 text-right font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody className="text-white/90">
                  {rep.trendWeek.map((r) => (
                    <tr key={r.key} className="border-b border-white/5">
                      <td className="py-2">{r.key}</td>
                      <td className="py-2 text-right">{r.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Tendencia mensual" subtitle="Total registros por mes">
          {rep.trendMonth.length === 0 ? (
            <div className="text-sm text-white/60">Sin datos.</div>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="text-white/70">
                  <tr className="border-b border-white/10">
                    <th className="py-2 text-left font-semibold">Mes</th>
                    <th className="py-2 text-right font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody className="text-white/90">
                  {rep.trendMonth.map((r) => (
                    <tr key={r.key} className="border-b border-white/5">
                      <td className="py-2">{r.key}</td>
                      <td className="py-2 text-right">{r.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Top DED" subtitle="Top 10 por cantidad de registros">
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

        <SectionCard title="Comparativo por sesión" subtitle="Usa evento_sesion_id (total y únicos)">
          {rep.comparativoSesiones.length === 0 ? (
            <div className="text-sm text-white/60">Sin sesiones en el rango (o no hay evento_sesion_id).</div>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="text-white/70">
                  <tr className="border-b border-white/10">
                    <th className="py-2 text-left font-semibold">Sesión</th>
                    <th className="py-2 text-left font-semibold">Fecha</th>
                    <th className="py-2 text-right font-semibold">Total</th>
                    <th className="py-2 text-right font-semibold">Únicos</th>
                  </tr>
                </thead>
                <tbody className="text-white/90">
                  {rep.comparativoSesiones.slice(0, 15).map((s) => (
                    <tr key={s.id} className="border-b border-white/5">
                      <td className="py-2">
                        <Link
                          href={`/dashboard/asistencias/sesiones/${encodeURIComponent(s.id)}`}
                          className="font-medium hover:underline underline-offset-2"
                        >
                          {s.nombre}
                        </Link>
                        <div className="text-xs text-white/50">{s.id}</div>
                      </td>
                      <td className="py-2 whitespace-nowrap">
                        {(s.fecha ?? "—")}{s.hora ? ` ${String(s.hora).slice(0,5)}` : ""}
                      </td>
                      <td className="py-2 text-right">{s.total}</td>
                      <td className="py-2 text-right">{s.unicos}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rep.comparativoSesiones.length > 15 ? (
                <div className="mt-2 text-xs text-white/50">
                  Mostrando 15 de {rep.comparativoSesiones.length}.
                </div>
              ) : null}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
