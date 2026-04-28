// app/dashboard/miembros/[rut]/AsistenciasMiembro.tsx
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

type AsistRow = {
  rut: string;
  fecha: string | null;
  hora: string | null;
  ded: string | null;
  evento_sesion_id: string | null;
  id_evento: string | null;
  created_at: string | null;
};

type SesionMeta = {
  id: string;
  nombre: string | null;
  fecha: string | null;
};

function fmtDate(d: string | null) {
  if (!d) return "—";
  // fecha viene como YYYY-MM-DD
  const [y, m, day] = d.split("-");
  const meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  return `${day} ${meses[parseInt(m, 10) - 1]} ${y}`;
}

function hhmm(t: string | null) {
  if (!t) return "—";
  return t.slice(0, 5);
}

export default async function AsistenciasMiembro({ rut }: { rut: string }) {
  const supabase = await createClient();

  const { data: rows, error } = await supabase
    .from("asistencias")
    .select("rut,fecha,hora,ded,evento_sesion_id,id_evento,created_at")
    .eq("rut", rut)
    .order("fecha", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-5 text-sm text-white/50">
        No se pudo cargar el historial de asistencias.
      </div>
    );
  }

  const asistencias = (rows ?? []) as AsistRow[];
  const total = asistencias.length;

  // KPIs
  const fechas = asistencias
    .map((r) => r.fecha)
    .filter(Boolean)
    .sort() as string[];

  const primeraVisita = fechas.length > 0 ? fechas[0] : null;
  const ultimaVisita = fechas.length > 0 ? fechas[fechas.length - 1] : null;

  // Sesiones únicas visitadas
  const sesionesUnicas = new Set(
    asistencias.map((r) => r.evento_sesion_id ?? r.fecha).filter(Boolean)
  ).size;

  // Resolución de nombres de sesión
  const sesionIds = Array.from(
    new Set(asistencias.map((r) => r.evento_sesion_id).filter(Boolean))
  ) as string[];

  const sesionMap = new Map<string, { nombre: string | null; id: string }>();
  if (sesionIds.length > 0) {
    const { data: sesData } = await supabase
      .from("eventos_sesiones")
      .select("id,nombre,fecha")
      .in("id", sesionIds);

    (sesData ?? []).forEach((s: any) => {
      if (s?.id) sesionMap.set(s.id, { id: s.id, nombre: s.nombre ?? null });
    });
  }

  const recent = asistencias.slice(0, 20);

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
      {/* Encabezado */}
      <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-white">Historial de asistencias</h2>
          <p className="text-white/40 text-xs mt-0.5">
            {total === 0
              ? "Sin registros"
              : `${total} registro${total !== 1 ? "s" : ""}${total > 20 ? " — mostrando últimos 20" : ""}`}
          </p>
        </div>
        {total > 0 && (
          <a
            href={`/api/asistencias/export?format=csv&rut=${encodeURIComponent(rut)}`}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 hover:bg-white/10"
          >
            Exportar CSV
          </a>
        )}
      </div>

      {/* KPIs */}
      {total > 0 && (
        <div className="grid grid-cols-3 divide-x divide-white/5 border-b border-white/10">
          <div className="px-5 py-3">
            <div className="text-xs text-white/40">Total asistencias</div>
            <div className="text-2xl font-bold text-white mt-1">{total}</div>
          </div>
          <div className="px-5 py-3">
            <div className="text-xs text-white/40">Primera visita</div>
            <div className="text-sm font-semibold text-white mt-1">{fmtDate(primeraVisita)}</div>
          </div>
          <div className="px-5 py-3">
            <div className="text-xs text-white/40">Última visita</div>
            <div className="text-sm font-semibold text-white mt-1">{fmtDate(ultimaVisita)}</div>
          </div>
        </div>
      )}

      {total === 0 ? (
        <div className="px-5 py-6 text-sm text-white/40">
          Este miembro aún no tiene asistencias registradas.
        </div>
      ) : (
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-black/20 text-white/50">
              <tr className="border-b border-white/5">
                <th className="text-left font-medium px-5 py-2.5">Fecha</th>
                <th className="text-left font-medium px-5 py-2.5">Hora</th>
                <th className="text-left font-medium px-5 py-2.5">Sesión / Evento</th>
                <th className="text-left font-medium px-5 py-2.5">DED</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {recent.map((r, i) => {
                const sesInfo = r.evento_sesion_id ? sesionMap.get(r.evento_sesion_id) : null;
                const sesNombre = sesInfo?.nombre ?? r.id_evento ?? "—";

                return (
                  <tr key={i} className="hover:bg-white/[0.02]">
                    <td className="px-5 py-2.5 text-white/80 tabular-nums">
                      {fmtDate(r.fecha)}
                    </td>
                    <td className="px-5 py-2.5 text-white/60 tabular-nums">
                      {hhmm(r.hora)}
                    </td>
                    <td className="px-5 py-2.5 text-white/80">
                      {sesInfo?.id ? (
                        <Link
                          href={`/dashboard/asistencias/sesiones/${encodeURIComponent(sesInfo.id)}`}
                          className="hover:text-white underline-offset-2 hover:underline"
                        >
                          {sesNombre}
                        </Link>
                      ) : (
                        sesNombre
                      )}
                    </td>
                    <td className="px-5 py-2.5 text-white/50">{r.ded ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {total > 20 && (
            <div className="px-5 py-3 text-xs text-white/40 border-t border-white/5">
              Mostrando 20 de {total} registros.{" "}
              <a
                href={`/api/asistencias/export?format=csv&rut=${encodeURIComponent(rut)}`}
                className="underline hover:text-white/60"
              >
                Exportar todos
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
