// app/dashboard/asistencias/sesiones/[id]/page.tsx
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";

type AsistRow = {
  rut: string | null;
  fecha: string | null;
  hora: string | null;
  ded: string | null;
  created_at: string | null;
};

type MiembroMini = {
  rut: string;
  nombres: string | null;
  apellidos: string | null;
  sexo: string | null;
};

function hhmm(t?: string | null) {
  if (!t) return "—";
  return t.slice(0, 5);
}

function formatNombre(n?: string | null, a?: string | null) {
  return `${(n ?? "").trim()} ${(a ?? "").trim()}`.trim() || "—";
}

function fmtDatetime(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Santiago",
  });
}

function fmtFecha(f?: string | null) {
  if (!f) return "—";
  const [y, m, d] = f.split("-");
  const meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  return `${d} ${meses[parseInt(m, 10) - 1]} ${y}`;
}

export default async function SesionAsistenciasPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Sesión
  const { data: sesion } = await supabase
    .from("eventos_sesiones")
    .select("id, id_evento, nombre, fecha, hora_inicio, hora_fin, activo")
    .eq("id", id)
    .maybeSingle();

  if (!sesion) notFound();

  // Evento padre
  let eventoNombre: string | null = null;
  if (sesion.id_evento) {
    const { data: ev } = await supabase
      .from("eventos")
      .select("nombre")
      .eq("id", sesion.id_evento)
      .maybeSingle();
    eventoNombre = (ev as any)?.nombre ?? null;
  }

  // Asistencias de esta sesión
  const { data: asistData, error } = await supabase
    .from("asistencias")
    .select("rut,fecha,hora,ded,created_at")
    .eq("evento_sesion_id", id)
    .order("created_at", { ascending: true });

  if (error) {
    return (
      <div className="p-6 text-red-400">Error: {error.message}</div>
    );
  }

  const asistencias = (asistData ?? []) as AsistRow[];
  const total = asistencias.length;

  // Lookup de miembros
  const ruts = Array.from(
    new Set(asistencias.map((r) => r.rut).filter(Boolean))
  ) as string[];

  const miembrosMap = new Map<string, MiembroMini>();
  if (ruts.length > 0) {
    const { data: ms } = await supabase
      .from("miembros")
      .select("rut,nombres,apellidos,sexo")
      .in("rut", ruts);
    (ms ?? []).forEach((m: any) => {
      if (m?.rut) miembrosMap.set(String(m.rut), m as MiembroMini);
    });
  }

  // Stats por DED
  const byDed = new Map<string, number>();
  for (const r of asistencias) {
    const k = (r.ded ?? "Sin DED").trim() || "Sin DED";
    byDed.set(k, (byDed.get(k) ?? 0) + 1);
  }
  const topDed = [...byDed.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);

  // Stats por sexo
  let hombres = 0, mujeres = 0, sinSexo = 0;
  for (const rut of ruts) {
    const m = miembrosMap.get(rut);
    const s = (m?.sexo ?? "").trim().toLowerCase();
    if (s === "masculino" || s === "m") hombres++;
    else if (s === "femenino" || s === "f") mujeres++;
    else sinSexo++;
  }

  const exportBase = `/api/asistencias/export?sesion=${encodeURIComponent(id)}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/dashboard/asistencias"
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 hover:bg-white/10 mb-3"
          >
            ← Volver a asistencias
          </Link>
          <h1 className="text-2xl font-bold text-white">
            {sesion.nombre ?? "Sesión"}
          </h1>
          <p className="mt-1 text-sm text-white/60">
            {eventoNombre && <span>Evento: {eventoNombre} · </span>}
            {sesion.fecha ? fmtFecha(sesion.fecha) : "Sin fecha"}
            {sesion.hora_inicio && <span> · {hhmm(sesion.hora_inicio)}</span>}
            {sesion.hora_fin && <span>–{hhmm(sesion.hora_fin)}</span>}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`${exportBase}&format=xlsx`}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
          >
            ↓ Excel
          </a>
          <a
            href={`${exportBase}&format=csv`}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
          >
            ↓ CSV
          </a>
          <Link
            href={`/dashboard/asistencias/sesiones/${encodeURIComponent(id)}/imprimir`}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
          >
            🖨️ Imprimir
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs text-white/40">Total asistentes</div>
          <div className="text-3xl font-bold text-white mt-1">{total}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs text-white/40">Hombres</div>
          <div className="text-3xl font-bold text-blue-300 mt-1">{hombres}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs text-white/40">Mujeres</div>
          <div className="text-3xl font-bold text-pink-300 mt-1">{mujeres}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs text-white/40">Sin clasificar</div>
          <div className="text-3xl font-bold text-white/50 mt-1">{sinSexo}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tabla de asistentes */}
        <div className="lg:col-span-2 rounded-xl border border-white/10 bg-white/5 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
            <div className="font-semibold text-white">Asistentes</div>
            <div className="text-sm text-white/40">{total} registros</div>
          </div>

          <div className="overflow-auto max-h-[60vh]">
            <table className="w-full text-sm">
              <thead className="bg-black/30 text-white/50 sticky top-0">
                <tr className="border-b border-white/10">
                  <th className="text-left font-medium px-4 py-3">#</th>
                  <th className="text-left font-medium px-4 py-3">RUT</th>
                  <th className="text-left font-medium px-4 py-3">Nombre</th>
                  <th className="text-left font-medium px-4 py-3">Sexo</th>
                  <th className="text-left font-medium px-4 py-3">DED</th>
                  <th className="text-left font-medium px-4 py-3">Hora</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {asistencias.map((r, i) => {
                  const m = r.rut ? miembrosMap.get(r.rut) : null;
                  return (
                    <tr key={i} className="hover:bg-white/[0.03]">
                      <td className="px-4 py-3 text-white/30 tabular-nums text-xs">
                        {i + 1}
                      </td>
                      <td className="px-4 py-3 text-white/60 tabular-nums text-xs">
                        {r.rut ? (
                          <Link
                            href={`/dashboard/miembros/${encodeURIComponent(r.rut)}`}
                            className="hover:text-white underline-offset-2 hover:underline"
                          >
                            {r.rut}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3 text-white/90">
                        {formatNombre(m?.nombres, m?.apellidos)}
                      </td>
                      <td className="px-4 py-3 text-white/60 text-xs">
                        {m?.sexo ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-white/60 text-xs">
                        {r.ded ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-white/50 tabular-nums text-xs">
                        {hhmm(r.hora)}
                      </td>
                    </tr>
                  );
                })}
                {asistencias.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-white/40">
                      No hay asistencias registradas para esta sesión.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top DED */}
        <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10">
            <div className="font-semibold text-white">Por DED</div>
          </div>
          <div className="p-5 space-y-3">
            {topDed.length === 0 ? (
              <div className="text-sm text-white/40">Sin datos.</div>
            ) : (
              topDed.map(([ded, count]) => {
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={ded}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-white/80 truncate">{ded}</span>
                      <span className="text-white/50 ml-2 shrink-0">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-400/60"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
