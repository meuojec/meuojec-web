export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { eliminarMinisterio } from "./actions";

const COLORS = [
  "#6366f1","#0ea5e9","#10b981","#f59e0b","#ef4444",
  "#8b5cf6","#ec4899","#14b8a6","#f97316","#84cc16",
];

export default async function MinisteriosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // ── Departamentos/DED desde tabla miembros ──────────────────────────
  const { data: dedRows } = await supabase
    .from("miembros")
    .select("ded")
    .not("ded", "is", null)
    .neq("ded", "");

  const dedMap: Record<string, number> = {};
  for (const r of dedRows ?? []) {
    const d = (r.ded ?? "").trim();
    if (d) dedMap[d] = (dedMap[d] ?? 0) + 1;
  }
  const departamentos = Object.entries(dedMap).sort((a, b) => a[0].localeCompare(b[0]));

  // ── Ministerios manuales ────────────────────────────────────────────
  const { data: ministerios } = await supabase
    .from("ministerios")
    .select("id,nombre,descripcion,lider_rut,color,activo,created_at")
    .eq("activo", true)
    .order("nombre");

  const { data: conteos } = await supabase
    .from("miembros_ministerios")
    .select("ministerio_id")
    .eq("activo", true);

  const conteoPorMinisterio = (conteos ?? []).reduce<Record<string, number>>((acc, r) => {
    if (r.ministerio_id) acc[r.ministerio_id] = (acc[r.ministerio_id] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Ministerios y Departamentos</h1>
          <p className="mt-2 text-white/60">
            Vista de departamentos y ministerios de la iglesia.
          </p>
        </div>
        <Link
          href="/dashboard/ministerios/nuevo"
          className="rounded-xl border border-emerald-500/30 bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/20 transition"
        >
          + Nuevo ministerio
        </Link>
      </div>

      {/* ── DEPARTAMENTOS (desde planilla de miembros) ── */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-1">Departamentos</h2>
        <p className="text-sm text-white/40 mb-4">Agrupados automaticamente desde la planilla de miembros.</p>

        {departamentos.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-black/20 p-8 text-center text-white/40">
            No hay departamentos registrados en la planilla de miembros.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {departamentos.map(([nombre, total], i) => (
              <div
                key={nombre}
                className="rounded-2xl border border-white/10 bg-black/20 p-5 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    />
                    <span className="font-semibold text-white">{nombre}</span>
                  </div>
                  <span className="text-xs text-white/40 tabular-nums">{total} miembros</span>
                </div>

                <div className="mt-auto pt-2">
                  <Link
                    href={`/dashboard/miembros?ded=${encodeURIComponent(nombre)}`}
                    className="block w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-center text-xs font-semibold text-white/80 hover:bg-white/10 transition"
                  >
                    Ver miembros
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── MINISTERIOS MANUALES ── */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-1">Ministerios</h2>
        <p className="text-sm text-white/40 mb-4">Ministerios creados manualmente con asignacion de miembros.</p>

        {(ministerios ?? []).length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-black/20 p-8 text-center text-white/40">
            No hay ministerios registrados.{" "}
            <Link href="/dashboard/ministerios/nuevo" className="text-emerald-400 hover:underline">
              Crear uno
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(ministerios ?? []).map((m) => (
              <div
                key={m.id}
                className="rounded-2xl border border-white/10 bg-black/20 p-5 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: m.color ?? "#6366f1" }}
                    />
                    <span className="font-semibold text-white">{m.nombre}</span>
                  </div>
                  <span className="text-xs text-white/40 tabular-nums">
                    {conteoPorMinisterio[m.id] ?? 0} miembros
                  </span>
                </div>

                {m.descripcion && (
                  <p className="text-sm text-white/60 line-clamp-2">{m.descripcion}</p>
                )}
                {m.lider_rut && (
                  <p className="text-xs text-white/40">Lider: {m.lider_rut}</p>
                )}

                <div className="mt-auto flex gap-2 pt-2">
                  <Link
                    href={`/dashboard/ministerios/${m.id}`}
                    className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-center text-xs font-semibold text-white/80 hover:bg-white/10 transition"
                  >
                    Ver miembros
                  </Link>
                  <form action={eliminarMinisterio.bind(null, m.id)}>
                    <button
                      type="submit"
                      className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/20 transition"
                    >
                      Archivar
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
