export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { eliminarSeguimiento, actualizarEstado } from "./actions";
import BackButton from "@/app/components/BackButton";
import DeleteConfirmButton from "@/app/components/DeleteConfirmButton";

type Seguimiento    = { id: string; miembro_rut: string; fecha: string; tipo: string; descripcion: string; privado: boolean; estado: string; created_at: string };
type MiembroMin     = { rut: string; nombres: string | null; apellidos: string | null };
type SeguimientoMin = { id: string; miembro_rut: string; fecha: string; estado: string };

const TIPO_STYLE: Record<string, string> = {
  visita:     "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  llamada:    "border-sky-500/30 bg-sky-500/10 text-sky-200",
  consejeria: "border-purple-500/30 bg-purple-500/10 text-purple-200",
  oracion:    "border-amber-500/30 bg-amber-500/10 text-amber-200",
  otro:       "border-white/10 bg-white/5 text-white/50",
};

const TIPO_LABEL: Record<string, string> = {
  visita: "🏠 Visita", llamada: "📞 Llamada", reunion: "🤝 Reunión",
  oracion: "🙏 Oración", consejeria: "💬 Consejería", otro: "📝 Otro",
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
  const lista = (todos ?? []) as Seguimiento[];

  const ruts = Array.from(new Set(lista.map((r) => r.miembro_rut).filter(Boolean)));
  const nombresMap = new Map<string, string>();
  if (ruts.length > 0) {
    const { data: ms } = await admin.from("miembros").select("rut,nombres,apellidos").in("rut", ruts);
    for (const m of (ms ?? []) as MiembroMin[]) {
      if (m?.rut) nombresMap.set(m.rut, [m.nombres, m.apellidos].filter(Boolean).join(" ").trim());
    }
  }

  const inicio = primerDiaMes();
  const { data: todosSinFiltro } = await admin
    .from("seguimiento_pastoral").select("id,miembro_rut,fecha,estado");

  const all       = (todosSinFiltro ?? []) as SeguimientoMin[];
  const delMes    = all.filter((r) => r.fecha >= inicio);
  const pendientes = all.filter((r) => r.estado === "pendiente").length;
  const resueltos  = all.filter((r) => r.estado === "resuelto").length;

  const tabs = [
    { label: "Todos",       valor: "" },
    { label: "🟡 Pendientes", valor: "pendiente" },
    { label: "🔵 Contactados",valor: "contactado" },
    { label: "🟢 Resueltos",  valor: "resuelto" },
  ];

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <BackButton />
            <h1 className="text-3xl font-bold">Pastoral</h1>
          </div>
          <p className="mt-2 text-white/60">Seguimiento pastoral de miembros.</p>
        </div>
        <Link
          href="/dashboard/pastoral/nuevo"
          className="rounded-xl border border-emerald-500/30 bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/20 transition"
        >
          + Nuevo registro
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total",      valor: all.length,       sub: "registros históricos" },
          { label: "Este mes",   valor: delMes.length,    sub: "en el mes actual" },
          { label: "Pendientes", valor: pendientes,        sub: "sin resolver" },
          { label: "Resueltos",  valor: resueltos,         sub: "cerrados" },
        ].map((k) => (
          <div key={k.label} className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <div className="text-sm text-white/60">{k.label}</div>
            <div className="text-3xl font-bold mt-1 text-white">{k.valor}</div>
            <div className="text-xs text-white/40 mt-1">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs filtro */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map((t) => (
          <Link
            key={t.valor}
            href={t.valor ? `/dashboard/pastoral?estado=${t.valor}` : "/dashboard/pastoral"}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition
              ${estadoFiltro === t.valor
                ? "border-white/30 bg-white/10 text-white"
                : "border-white/10 bg-white/5 text-white/50 hover:text-white hover:bg-white/10"}`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* Lista */}
      {lista.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-black/20 p-8 text-center text-white/40 text-sm">
          Sin registros{estadoFiltro ? ` con estado "${estadoFiltro}"` : ""}.
        </div>
      ) : (
        <div className="space-y-3">
          {lista.map((r) => {
            const estilo    = ESTADO_STYLE[r.estado] ?? ESTADO_STYLE.pendiente;
            const siguiente = r.estado === "pendiente" ? "contactado" : r.estado === "contactado" ? "resuelto" : "pendiente";
            const nombre    = nombresMap.get(r.miembro_rut) || r.miembro_rut;

            return (
              <div key={r.id} className="rounded-2xl border border-white/10 bg-black/20 px-5 py-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link href={`/dashboard/miembros/${encodeURIComponent(r.miembro_rut)}`} className="font-medium text-white hover:underline truncate">
                        {nombre}
                      </Link>
                      <span className={`text-xs border rounded-full px-2 py-0.5 ${TIPO_STYLE[r.tipo] ?? TIPO_STYLE.otro}`}>
                        {TIPO_LABEL[r.tipo] ?? r.tipo}
                      </span>
                      {r.privado && <span className="text-xs text-white/30">🔒</span>}
                    </div>
                    <div className="text-xs text-white/40">{r.fecha}</div>
                    {r.descripcion && (
                      <p className="text-sm text-white/60 mt-1 line-clamp-2">{r.descripcion}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Badge estado — clic para ciclar */}
                    <form action={actualizarEstado.bind(null, r.id, siguiente)}>
                      <button type="submit" title={`Cambiar a ${siguiente}`}
                        className={`cursor-pointer rounded-full border px-2.5 py-0.5 text-xs font-medium transition-opacity hover:opacity-70 ${estilo.cls}`}>
                        {estilo.label}
                      </button>
                    </form>
                    <DeleteConfirmButton
                      action={eliminarSeguimiento.bind(null, r.id)}
                      confirmMessage={`¿Eliminar el registro pastoral de ${nombre} (${r.fecha})? Esta acción no se puede deshacer.`}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
