export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { eliminarContribucion } from "./actions";
import BackButton from "@/app/components/BackButton";

const TIPO_STYLE: Record<string, string> = {
  diezmo: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  ofrenda: "border-sky-500/30 bg-sky-500/10 text-sky-200",
  especial: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  mision: "border-purple-500/30 bg-purple-500/10 text-purple-200",
};

function clp(n: number) {
  return n.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
}

function primerDiaMes() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

export default async function ContribucionesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const inicio = primerDiaMes();

  const { data: todos } = await supabase
    .from("contribuciones")
    .select("id,miembro_rut,anonimo,tipo,monto,fecha,notas,created_at")
    .order("fecha", { ascending: false })
    .limit(200);

  const lista = (todos ?? []) as any[];

  const delMes = lista.filter((c) => c.fecha >= inicio);
  const totalMes = delMes.reduce((s: number, c: any) => s + Number(c.monto ?? 0), 0);
  const diezmosMes = delMes.filter((c: any) => c.tipo === "diezmo").reduce((s: number, c: any) => s + Number(c.monto ?? 0), 0);
  const ofrendasMes = delMes.filter((c: any) => c.tipo === "ofrenda").reduce((s: number, c: any) => s + Number(c.monto ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <BackButton />
            <h1 className="text-3xl font-bold">Contribuciones</h1>
          </div>
          <p className="mt-2 text-white/60">Registro de diezmos, ofrendas y contribuciones especiales.</p>
        </div>
        <Link
          href="/dashboard/contribuciones/nueva"
          className="rounded-xl border border-emerald-500/30 bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/20 transition"
        >
          + Registrar
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total mes", valor: clp(totalMes), sub: "este mes" },
          { label: "Diezmos mes", valor: clp(diezmosMes), sub: "diezmos" },
          { label: "Ofrendas mes", valor: clp(ofrendasMes), sub: "ofrendas" },
          { label: "Registros totales", valor: lista.length.toString(), sub: "histórico" },
        ].map((k) => (
          <div key={k.label} className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <div className="text-sm text-white/60">{k.label}</div>
            <div className="text-2xl font-bold mt-1 text-white">{k.valor}</div>
            <div className="text-xs text-white/40 mt-1">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabla */}
      <div className="rounded-2xl border border-white/10 bg-black/20 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <span className="font-semibold">Historial</span>
          <span className="text-sm text-white/50">{lista.length} registros</span>
        </div>
        <div className="overflow-auto">
          <table className="min-w-[700px] w-full text-sm">
            <thead className="bg-black/30 text-white/70">
              <tr className="border-b border-white/10">
                <th className="text-left font-medium px-4 py-3">Fecha</th>
                <th className="text-left font-medium px-4 py-3">Miembro</th>
                <th className="text-left font-medium px-4 py-3">Tipo</th>
                <th className="text-right font-medium px-4 py-3">Monto</th>
                <th className="text-left font-medium px-4 py-3">Notas</th>
                <th className="text-right font-medium px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {lista.map((c) => (
                <tr key={c.id} className="border-t border-white/10 hover:bg-white/5">
                  <td className="px-4 py-3 text-white/70 tabular-nums">{c.fecha}</td>
                  <td className="px-4 py-3 text-white/80">
                    {c.anonimo ? <span className="text-white/40 italic">Anónimo</span> : (c.miembro_rut ?? "—")}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${TIPO_STYLE[c.tipo] ?? "border-white/10 bg-white/5 text-white/60"}`}>
                      {c.tipo}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-white/90">{clp(Number(c.monto))}</td>
                  <td className="px-4 py-3 text-white/50 max-w-[200px] truncate">{c.notas ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <form action={eliminarContribucion.bind(null, c.id)}>
                      <button
                        type="submit"
                        className="rounded border border-red-500/20 bg-red-500/10 px-2 py-1 text-xs text-red-300 hover:bg-red-500/20 transition"
                      >
                        Eliminar
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {lista.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-white/40">
                    Sin contribuciones registradas.
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
