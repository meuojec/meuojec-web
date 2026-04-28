// app/dashboard/asistencias/inactivos/page.tsx
export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function todayISO() {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Santiago" }).format(new Date());
}

function weeksAgo(dateStr: string | null, today: string): number | null {
  if (!dateStr) return null;
  const ms = new Date(today).getTime() - new Date(dateStr).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24 * 7));
}

function fmtDate(d: string | null) {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  const meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  return `${day} ${meses[parseInt(m, 10) - 1]} ${y}`;
}

function semanasBadge(w: number | null) {
  if (w === null) return { label: "Nunca", color: "text-red-400 bg-red-500/10 border-red-500/20" };
  if (w < 4) return { label: `${w} sem`, color: "text-green-400 bg-green-500/10 border-green-500/20" };
  if (w < 8) return { label: `${w} sem`, color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" };
  if (w < 12) return { label: `${w} sem`, color: "text-orange-400 bg-orange-500/10 border-orange-500/20" };
  return { label: `${w} sem`, color: "text-red-400 bg-red-500/10 border-red-500/20" };
}

export default async function InactivosPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const sp = (await searchParams) ?? {};
  const getString = (k: string) => { const v = sp[k]; return typeof v === "string" ? v.trim() : ""; };

  const umbralStr = getString("umbral") || "4";
  const umbral = Math.max(1, parseInt(umbralStr, 10) || 4);
  const dedFiltro = getString("ded");
  const today = todayISO();

  const admin = createAdminClient();

  // Traer todos los miembros activos
  let miembrosQuery = admin
    .from("miembros")
    .select("rut,nombres,apellidos,ded,telefono")
    .order("apellidos");

  if (dedFiltro) miembrosQuery = miembrosQuery.eq("ded", dedFiltro);

  const { data: miembros } = await miembrosQuery.limit(2000);
  const todos = (miembros ?? []) as { rut: string; nombres: string | null; apellidos: string | null; ded: string | null; telefono: string | null }[];

  if (todos.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <Link href="/dashboard/asistencias" className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60 hover:bg-white/10 mb-3">
            ← Asistencias
          </Link>
          <h1 className="text-2xl font-bold text-white">Miembros inactivos</h1>
        </div>
        <div className="text-white/40">No hay miembros registrados.</div>
      </div>
    );
  }

  const ruts = todos.map((m) => m.rut).filter(Boolean);

  // Última asistencia por RUT
  const lastAsistMap = new Map<string, string>();
  if (ruts.length > 0) {
    // Traer la última asistencia de cada uno (ordenar desc y tomar el primero por rut)
    const { data: asist } = await admin
      .from("asistencias")
      .select("rut,fecha")
      .in("rut", ruts)
      .order("fecha", { ascending: false })
      .limit(10000);

    for (const a of (asist ?? []) as { rut: string; fecha: string }[]) {
      if (!lastAsistMap.has(a.rut)) lastAsistMap.set(a.rut, a.fecha);
    }
  }

  // DED únicos para filtro
  const { data: dedData } = await admin.from("miembros").select("ded").not("ded", "is", null).order("ded");
  const dedsSet = new Set<string>();
  ((dedData ?? []) as any[]).forEach((r) => { const d = (r.ded ?? "").trim(); if (d) dedsSet.add(d); });
  const deds = [...dedsSet].sort();

  // Filtrar por umbral de semanas
  const inactivos = todos
    .map((m) => {
      const ultima = lastAsistMap.get(m.rut) ?? null;
      const semanas = weeksAgo(ultima, today);
      return { ...m, ultima, semanas };
    })
    .filter((m) => m.semanas === null || m.semanas >= umbral)
    .sort((a, b) => {
      // Nunca asistió primero, luego por semanas desc
      if (a.semanas === null && b.semanas !== null) return -1;
      if (a.semanas !== null && b.semanas === null) return 1;
      if (a.semanas === null && b.semanas === null) return (a.apellidos ?? "").localeCompare(b.apellidos ?? "");
      return (b.semanas ?? 0) - (a.semanas ?? 0);
    });

  const nunca = inactivos.filter((m) => m.semanas === null).length;
  const mas12 = inactivos.filter((m) => m.semanas !== null && m.semanas >= 12).length;
  const entre8y12 = inactivos.filter((m) => m.semanas !== null && m.semanas >= 8 && m.semanas < 12).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/dashboard/asistencias"
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60 hover:bg-white/10 mb-3"
          >
            ← Asistencias
          </Link>
          <h1 className="text-2xl font-bold text-white">Miembros inactivos</h1>
          <p className="mt-1 text-sm text-white/50">
            Miembros sin asistencia en los últimos{" "}
            <span className="text-white/80">{umbral} semanas</span>
            {dedFiltro && <> · DED: <span className="text-white/80">{dedFiltro}</span></>}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <form method="GET" className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-white/50 mb-1">Semanas de inactividad</label>
          <select
            name="umbral"
            defaultValue={umbralStr}
            className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30"
          >
            <option value="2">2+ semanas</option>
            <option value="4">4+ semanas</option>
            <option value="6">6+ semanas</option>
            <option value="8">8+ semanas</option>
            <option value="12">12+ semanas</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-white/50 mb-1">DED</label>
          <select
            name="ded"
            defaultValue={dedFiltro}
            className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30"
          >
            <option value="">Todos los DED</option>
            {deds.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="rounded-lg bg-white/10 border border-white/10 px-4 py-2 text-sm text-white hover:bg-white/15"
        >
          Aplicar
        </button>
        <Link
          href="/dashboard/asistencias/inactivos"
          className="rounded-lg border border-white/10 bg-transparent px-4 py-2 text-sm text-white/50 hover:bg-white/5"
        >
          Limpiar
        </Link>
      </form>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs text-white/40 mb-1">Total inactivos</div>
          <div className="text-3xl font-bold text-white">{inactivos.length}</div>
          <div className="text-xs text-white/30 mt-1">de {todos.length} miembros</div>
        </div>
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <div className="text-xs text-red-400/70 mb-1">Nunca asistieron</div>
          <div className="text-3xl font-bold text-red-400">{nunca}</div>
        </div>
        <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4">
          <div className="text-xs text-orange-400/70 mb-1">Más de 12 semanas</div>
          <div className="text-3xl font-bold text-orange-400">{mas12}</div>
        </div>
        <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
          <div className="text-xs text-yellow-400/70 mb-1">Entre 8-12 semanas</div>
          <div className="text-3xl font-bold text-yellow-400">{entre8y12}</div>
        </div>
      </div>

      {/* Tabla */}
      <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10">
          <div className="font-semibold text-white">Listado de inactivos</div>
          <div className="text-xs text-white/40 mt-0.5">{inactivos.length} miembro{inactivos.length !== 1 ? "s" : ""}</div>
        </div>

        <div className="overflow-auto">
          <table className="min-w-[700px] w-full text-sm">
            <thead className="bg-black/30 text-white/50 sticky top-0 z-10">
              <tr className="border-b border-white/10">
                <th className="text-left font-medium px-4 py-3 w-10">#</th>
                <th className="text-left font-medium px-4 py-3">RUT</th>
                <th className="text-left font-medium px-4 py-3">Nombre</th>
                <th className="text-left font-medium px-4 py-3">DED</th>
                <th className="text-left font-medium px-4 py-3">Última asistencia</th>
                <th className="text-left font-medium px-4 py-3">Inactividad</th>
                <th className="text-left font-medium px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {inactivos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-white/30">
                    ¡Todos los miembros han asistido recientemente!
                  </td>
                </tr>
              ) : (
                inactivos.map((m, i) => {
                  const nombre = [m.nombres, m.apellidos].filter(Boolean).join(" ").trim() || m.rut;
                  const badge = semanasBadge(m.semanas);
                  return (
                    <tr key={m.rut} className="hover:bg-white/[0.03]">
                      <td className="px-4 py-3 text-white/25 text-xs tabular-nums">{i + 1}</td>
                      <td className="px-4 py-3 text-white/60 text-xs tabular-nums">
                        <Link
                          href={`/dashboard/miembros/${encodeURIComponent(m.rut)}`}
                          className="hover:text-white hover:underline underline-offset-2"
                        >
                          {m.rut}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-white/90 font-medium">{nombre}</td>
                      <td className="px-4 py-3 text-white/60 text-xs">{m.ded ?? "—"}</td>
                      <td className="px-4 py-3 text-white/60 text-xs tabular-nums">{fmtDate(m.ultima)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badge.color}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/dashboard/pastoral/nuevo?rut=${encodeURIComponent(m.rut)}`}
                          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60 hover:bg-white/10 hover:text-white"
                        >
                          Seguimiento →
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
