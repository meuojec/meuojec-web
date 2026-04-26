export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BackButton from "@/app/components/BackButton";

const ESTADO_STYLE: Record<string, string> = {
  nuevo: "border-sky-500/30 bg-sky-500/10 text-sky-200",
  en_proceso: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  integrado: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  inactivo: "border-white/10 bg-white/5 text-white/50",
};

const ESTADO_LABEL: Record<string, string> = {
  nuevo: "Nuevo",
  en_proceso: "En proceso",
  integrado: "Integrado",
  inactivo: "Inactivo",
};

function primerDiaMes() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

export default async function VisitantesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: todos } = await supabase
    .from("visitantes")
    .select("id,nombres,apellidos,telefono,fecha_primera_visita,origen,estado,created_at")
    .order("created_at", { ascending: false });

  const lista = (todos ?? []) as any[];
  const inicio = primerDiaMes();

  const nuevosMes = lista.filter((v) => v.created_at?.slice(0, 10) >= inicio).length;
  const enProceso = lista.filter((v) => v.estado === "en_proceso").length;
  const integrados = lista.filter((v) => v.estado === "integrado").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <BackButton />
            <h1 className="text-3xl font-bold">Visitantes</h1>
          </div>
          <p className="mt-2 text-white/60">Registro y seguimiento de personas que visitan la iglesia.</p>
        </div>
        <Link
          href="/dashboard/visitantes/nuevo"
          className="rounded-xl border border-emerald-500/30 bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/20 transition"
        >
          + Registrar visitante
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total visitantes", valor: lista.length, sub: "registrados" },
          { label: "Nuevos este mes", valor: nuevosMes, sub: "este mes" },
          { label: "En proceso", valor: enProceso, sub: "en seguimiento" },
          { label: "Integrados", valor: integrados, sub: "se unieron" },
        ].map((k) => (
          <div key={k.label} className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <div className="text-sm text-white/60">{k.label}</div>
            <div className="text-3xl font-bold mt-1 text-white">{k.valor}</div>
            <div className="text-xs text-white/40 mt-1">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabla */}
      <div className="rounded-2xl border border-white/10 bg-black/20 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <span className="font-semibold">Listado</span>
          <span className="text-sm text-white/50">{lista.length} visitantes</span>
        </div>
        <div className="overflow-auto">
          <table className="min-w-[700px] w-full text-sm">
            <thead className="bg-black/30 text-white/70">
              <tr className="border-b border-white/10">
                <th className="text-left font-medium px-4 py-3">Nombre</th>
                <th className="text-left font-medium px-4 py-3">Teléfono</th>
                <th className="text-left font-medium px-4 py-3">Primera visita</th>
                <th className="text-left font-medium px-4 py-3">Origen</th>
                <th className="text-left font-medium px-4 py-3">Estado</th>
                <th className="text-right font-medium px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {lista.map((v) => (
                <tr key={v.id} className="border-t border-white/10 hover:bg-white/5">
                  <td className="px-4 py-3 font-medium text-white/90">
                    {v.nombres} {v.apellidos ?? ""}
                  </td>
                  <td className="px-4 py-3 text-white/60">{v.telefono ?? "—"}</td>
                  <td className="px-4 py-3 text-white/60 tabular-nums">{v.fecha_primera_visita}</td>
                  <td className="px-4 py-3 text-white/50 capitalize">{(v.origen ?? "").replace("_", " ")}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${ESTADO_STYLE[v.estado] ?? "border-white/10 bg-white/5 text-white/50"}`}>
                      {ESTADO_LABEL[v.estado] ?? v.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/dashboard/visitantes/${v.id}`}
                      className="rounded border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/70 hover:bg-white/10 transition"
                    >
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
              {lista.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-white/40">
                    Sin visitantes registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
