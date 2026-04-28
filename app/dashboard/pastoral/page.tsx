export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { eliminarSeguimiento, actualizarEstado } from "./actions";
import BackButton from "@/app/components/BackButton";

const TIPO_STYLE: Record<string, string> = {
  visita:    "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  llamada:   "border-sky-500/30 bg-sky-500/10 text-sky-200",
  consejeria:"border-purple-500/30 bg-purple-500/10 text-purple-200",
  oracion:   "border-amber-500/30 bg-amber-500/10 text-amber-200",
  otro:      "border-white/10 bg-white/5 text-white/50",
};

const ESTADO_STYLE: Record<string, { cls: string; label: string }> = {
  pendiente:  { cls: "border-yellow-500/30 bg-yellow-500/10 text-yellow-300", label: "🟡 Pendiente" },
  contactado: { cls: "border-blue-500/30 bg-blue-500/10 text-blue-300",       label: "🔵 Contactado" },
  resuelto:   { cls: "border-green-500/30 bg-green-500/10 text-green-300",    label: "🟢 Resuelto" },
};

function primerDiaMes() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

export default async function PastoralPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const sp = (await searchParams) ?? {};
  const estadoFiltro = typeof sp.estado === "string" ? sp.estado : "";

  const admin = createAdminClient();

  let query = admin
    .from("seguimiento_pastoral")
    .select("id,miembro_rut,fecha,tipo,descripcion,privado,estado,created_at")
    .order("fecha", { ascending: false })
    .limit(200);

  if (estadoFiltro) query = query.eq("estado", estadoFiltro);

  const { data: todos } = await query;
  const lista = (todos ?? []) as any[];

  // Resolver nombres de miembros
  const ruts = Array.from(new Set(lista.map((r) => r.miembro_rut).filter(Boolean))) as string[];
  const nombresMap = new Map<string, string>();
  if (ruts.length > 0) {
    const { data: ms } = await admin.from("miembros").select("rut,nombres,apellidos").in("rut", ruts);
    for (const m of (ms ?? []) as any[]) {
      if (m?.rut) nombresMap.set(m.rut, [m.nombres, m.apellidos].filter(Boolean).join(" ").trim());
    }
  }

  const inicio = primerDiaMes();
  const { data: todosSinFiltro } = await admin
    .from("seguimiento_pastoral")
    .select("id,miembro_rut,fecha,estado");

  const all = (todosSinFiltro ?? []) as any[];
  const delMes = all.filter((r) => r.fecha >= inicio);
  const pendientes = all.filter((r) => r.estado === "pendiente").length;
  const resueltos  = all.filter((r) => r.estado === "resuelto").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <BackButton />
            <h1 className="text-3xl font-bold">Seguimiento Pastoral</h1>
          </div>
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total registros",   valor: all.length,       color: "" },
          { label: "Este mes",          valor: delMes.length,    color: "" },
          { label: "Pendientes",        valor: pendientes,       color: "text-yellow-300" },
          { label: "Resueltos",         valor: resueltos,        color: "text-green-400" },
        ].map((k) => (
          <div key={k.label} className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <div className="text-sm text-white/60">{k.label}</div>
            <div className={`text-3xl font-bold mt-1 ${k.color || "text-white"}`}>{k.valor}</div>
          </div>
        ))}
      </div>

      {/* Filtro de estado */}
      <div className="flex gap-2 flex-wrap">
        {[
          { value: "", label: "Todos" },
          { value: "pendiente",  label: "🟡 Pendientes" },
          { value: "contactado", label: "🔵 Contactados" },
          { value: "resuelto",   label: "🟢 Resueltos" },
        ].map((f) => (
          <Link
            key={f.value}
            href={f.value ? `/dashboard/pastoral?estado=${f.value}` : "/dashboard/pastoral"}
            className={[
              "rounded-lg border px-3 py-1.5 text-xs font-medium transition",
              estadoFiltro === f.value
                ? "border-white/30 bg-white/15 text-white"
                : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10",
            ].join(" ")}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {/* Tabla */}
      <div className="rounded-2xl border border-white/10 bg-black/20 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <span className="font-semibold">
            Registros {estadoFiltro ? `(${lista.length})` : `(${all.length})`}
          </span>
          <span className="text-xs text-white/30">🔒 Privados solo visibles por admins/pastores</span>
        </div>

        <div className="overflow-auto">
          <table className="min-w-[850px] w-full text-sm">
            <thead className="bg-black/30 text-white/70">
              <tr className="border-b border-white/10">
                <th className="text-left font-medium px-4 py-3">Fecha</th>
                <th className="text-left font-medium px-4 py-3">Miembro</th>
                <th className="text-left font-medium px-4 py-3">Tipo</th>
                <th className="text-left font-medium px-4 py-3">Descripción</th>
                <th className="text-left font-medium px-4 py-3">Estado</th>
                <th className="text-center font-medium px-4 py-3">🔒</th>
                <th className="text-right font-medium px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {lista.map((r) => {
                const nombre = nombresMap.get(r.miembro_rut) || r.miembro_rut;
                const est = ESTADO_STYLE[r.estado] ?? ESTADO_STYLE.pendiente;
                return (
                  <tr key={r.id} className="border-t border-white/10 hover:bg-white/5">
                    <td className="px-4 py-3 text-white/60 tabular-nums whitespace-nowrap">{r.fecha}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/miembros/${encodeURIComponent(r.miembro_rut)}`}
                        className="text-white hover:underline underline-offset-2 font-medium"
                      >
                        {nombre}
                      </Link>
                      <div className="text-xs text-white/40 font-mono">{r.miembro_rut}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${TIPO_STYLE[r.tipo] ?? TIPO_STYLE.otro}`}>
                        {r.tipo}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/60 max-w-[220px]">
                      <span className="line-clamp-2">{r.descripcion}</span>
                    </td>
                    <td className="px-4 py-3">
                      {/* Cambio de estado inline */}
                      <form action={actualizarEstado.bind(null, r.id, r.estado === "pendiente" ? "contactado" : r.estado === "contactado" ? "resuelto" : "pendiente")}>
                        <button
                          type="submit"
                          title="Cambiar estado"
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition hover:opacity-80 ${est.cls}`}
                        >
                          {est.label}
                        </button>
                      </form>
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
                );
              })}
              {lista.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-white/40">
                    Sin registros{estadoFiltro ? ` con estado "${estadoFiltro}"` : ""}.
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
