export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { eliminarSeguimiento } from "./actions";

const TIPO_STYLE: Record<string, string> = {
  visita: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  llamada: "border-sky-500/30 bg-sky-500/10 text-sky-200",
  consejeria: "border-purple-500/30 bg-purple-500/10 text-purple-200",
  oracion: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  otro: "border-white/10 bg-white/5 text-white/50",
};

function primerDiaMes() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

export default async function PastoralPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: todos } = await supabase
    .from("seguimiento_pastoral")
    .select("id,miembro_rut,fecha,tipo,descripcion,privado,created_at")
    .order("fecha", { ascending: false })
    .limit(100);

  const lista = (todos ?? []) as any[];
  const inicio = primerDiaMes();
  const delMes = lista.filter((r) => r.fecha >= inicio);
  const rutsMes = new Set(delMes.map((r) => r.miembro_rut)).size;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Seguimiento Pastoral</h1>
          <p className="mt-2 text-white/60">Registro confidencial de atención pastoral a miembros.</p>
        </div>
        <Link
          href="/dashboard/pastoral/nuevo"
          className="rounded-xl border border-emerald-500/30 bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/20 transition"
        >
          + Registrar
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total registros", valor: lista.length },
          { label: "Este mes", valor: delMes.length },
          { label: "Miembros atendidos este mes", valor: rutsMes },
        ].map((k) => (
          <div key={k.label} className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <div className="text-sm text-white/60">{k.label}</div>
            <div className="text-3xl font-bold mt-1 text-white">{k.valor}</div>
          </div>
        ))}
      </div>

      {/* Tabla */}
      <div className="rounded-2xl border border-white/10 bg-black/20 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <span className="font-semibold">Registros</span>
          <span className="text-xs text-white/30 flex items-center gap-1">
            🔒 Los registros privados solo son visibles por administradores y pastores
          </span>
        </div>
        <div className="overflow-auto">
          <table className="min-w-[750px] w-full text-sm">
            <thead className="bg-black/30 text-white/70">
              <tr className="border-b border-white/10">
                <th className="text-left font-medium px-4 py-3">Fecha</th>
                <th className="text-left font-medium px-4 py-3">Miembro</th>
                <th className="text-left font-medium px-4 py-3">Tipo</th>
                <th className="text-left font-medium px-4 py-3">Descripción</th>
                <th className="text-center font-medium px-4 py-3">Privado</th>
                <th className="text-right font-medium px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {lista.map((r) => (
                <tr key={r.id} className="border-t border-white/10 hover:bg-white/5">
                  <td className="px-4 py-3 text-white/60 tabular-nums">{r.fecha}</td>
                  <td className="px-4 py-3 text-white/80 font-mono text-xs">{r.miembro_rut}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${TIPO_STYLE[r.tipo] ?? TIPO_STYLE.otro}`}>
                      {r.tipo}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white/60 max-w-[260px]">
                    <span className="line-clamp-1">{r.descripcion}</span>
                  </td>
                  <td className="px-4 py-3 text-center">{r.privado ? "🔒" : "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <form action={eliminarSeguimiento.bind(null, r.id)}>
                      <button type="submit" className="rounded border border-red-500/20 bg-red-500/10 px-2 py-1 text-xs text-red-300 hover:bg-red-500/20 transition">
                        Eliminar
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {lista.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-white/40">Sin registros.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
