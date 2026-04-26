export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { toggleAnuncio, eliminarAnuncio } from "./actions";
import BackButton from "@/app/components/BackButton";

const TIPO_STYLE: Record<string, string> = {
  urgente: "border-red-500/30 bg-red-500/10 text-red-200",
  general: "border-white/10 bg-white/5 text-white/60",
  informativo: "border-sky-500/30 bg-sky-500/10 text-sky-200",
  evento: "border-amber-500/30 bg-amber-500/10 text-amber-200",
};

export default async function AnunciosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: todos } = await supabase
    .from("anuncios")
    .select("id,titulo,contenido,tipo,audiencia,activo,expira_en,created_at")
    .order("activo", { ascending: false })
    .order("created_at", { ascending: false });

  const lista = (todos ?? []) as any[];
  const activos = lista.filter((a) => a.activo);
  const inactivos = lista.filter((a) => !a.activo);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <BackButton />
            <h1 className="text-3xl font-bold">Anuncios</h1>
          </div>
          <p className="mt-2 text-white/60">Comunicaciones internas para el equipo y la congregación.</p>
        </div>
        <Link
          href="/dashboard/anuncios/nuevo"
          className="rounded-xl border border-emerald-500/30 bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/20 transition"
        >
          + Crear anuncio
        </Link>
      </div>

      {/* Anuncios activos */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wider">Activos ({activos.length})</h2>
        {activos.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-center text-white/40 text-sm">
            No hay anuncios activos.
          </div>
        )}
        {activos.map((a) => (
          <div key={a.id} className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-white">{a.titulo}</span>
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs capitalize ${TIPO_STYLE[a.tipo] ?? TIPO_STYLE.general}`}>
                  {a.tipo}
                </span>
                <span className="text-xs text-white/30 border border-white/10 rounded-full px-2 py-0.5">
                  Para: {a.audiencia}
                </span>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <form action={toggleAnuncio.bind(null, a.id, false)}>
                  <button type="submit" className="rounded border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/60 hover:bg-white/10 transition">
                    Desactivar
                  </button>
                </form>
                <form action={eliminarAnuncio.bind(null, a.id)}>
                  <button type="submit" className="rounded border border-red-500/20 bg-red-500/10 px-2 py-1 text-xs text-red-300 hover:bg-red-500/20 transition">
                    Eliminar
                  </button>
                </form>
              </div>
            </div>
            <p className="mt-2 text-sm text-white/70">{a.contenido}</p>
            {a.expira_en && (
              <p className="mt-2 text-xs text-white/30">Expira: {a.expira_en}</p>
            )}
          </div>
        ))}
      </div>

      {/* Anuncios inactivos */}
      {inactivos.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-white/30 uppercase tracking-wider">Inactivos</h2>
          <div className="rounded-2xl border border-white/10 bg-black/20 overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                {inactivos.map((a) => (
                  <tr key={a.id} className="border-t border-white/10 first:border-t-0">
                    <td className="px-4 py-3 text-white/40">{a.titulo}</td>
                    <td className="px-4 py-3 text-white/30 text-xs">{a.created_at?.slice(0, 10)}</td>
                    <td className="px-4 py-3 text-right">
                      <form action={toggleAnuncio.bind(null, a.id, true)}>
                        <button type="submit" className="rounded border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300 hover:bg-emerald-500/20 transition">
                          Activar
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
