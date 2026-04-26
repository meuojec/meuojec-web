export const dynamic = "force-dynamic";
export const revalidate = 0;

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAsistenciaPerms } from "@/app/lib/auth/perm";
import BackButton from "@/app/components/BackButton";

function todayISO_CL() {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Santiago" }).format(new Date());
}

function toHHMM(h?: string | null) {
  if (!h) return "—";
  return h.length >= 5 ? h.slice(0, 5) : h;
}

type AsistenciaRow = {
  rut: string;
  fecha: string | null;
  hora: string | null;
  ded: string | null;
  id_evento: string | null;
  evento_sesion_id: string | null;
  created_at: string;

  miembros: {
    nombres: string | null;
    apellidos: string | null;
    sexo: string | null;
  } | null;
};

export default async function AsistenciasHoyPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const perms = await getAsistenciaPerms();
  if (!perms.read) redirect("/dashboard");

  const hoy = todayISO_CL();

  // 1) Traemos asistencias del día (incluyendo id_evento y evento_sesion_id)
  const { data, error } = await supabase
    .from("asistencias")
    .select(`
      rut,
      fecha,
      hora,
      ded,
      id_evento,
      evento_sesion_id,
      created_at,
      miembros (
        nombres,
        apellidos,
        sexo
      )
    `)
    .eq("fecha", hoy)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    return (
      <div className="p-6 text-white">
        <div className="text-xl font-bold">Asistencias de hoy</div>
        <div className="mt-3 text-red-300">Error: {error.message}</div>
      </div>
    );
  }

  const rows = (data ?? []) as any as AsistenciaRow[];

  // 2) Resolver nombre de evento por id_evento (001,002...)
  const idsEvento = Array.from(
    new Set(rows.map(r => r.id_evento).filter(Boolean))
  ) as string[];

  const eventosPorCodigo = new Map<string, string>();

  if (idsEvento.length > 0) {
    const { data: evs } = await supabase
      .from("eventos")
      .select("id_evento,nombre")
      .in("id_evento", idsEvento);

    (evs ?? []).forEach((e: any) => {
      const k = e?.id_evento ? String(e.id_evento) : null;
      if (!k) return;
      eventosPorCodigo.set(k, String(e?.nombre ?? "").trim());
    });
  }

  // 3) Resolver nombre de evento por evento_sesion_id -> eventos_sesiones -> eventos
  const sesIds = Array.from(
    new Set(rows.map(r => r.evento_sesion_id).filter(Boolean))
  ) as string[];

  // Mapa: evento_sesion_id -> nombre_evento
  const eventoPorSesion = new Map<string, string>();

  if (sesIds.length > 0) {
    // Trae las sesiones
    const { data: ses } = await supabase
      .from("eventos_sesiones")
      .select("id, evento_id")
      .in("id", sesIds);

    const sesRows = (ses ?? []) as any[];
    const eventoIds = Array.from(
      new Set(sesRows.map(s => s.evento_id).filter(Boolean))
    ) as string[];

    // Trae eventos por UUID (evento_id)
    const eventosPorId = new Map<string, string>();
    if (eventoIds.length > 0) {
      const { data: evById } = await supabase
        .from("eventos")
        .select("id,nombre")
        .in("id", eventoIds);

      (evById ?? []).forEach((e: any) => {
        const k = e?.id ? String(e.id) : null;
        if (!k) return;
        eventosPorId.set(k, String(e?.nombre ?? "").trim());
      });
    }

    // arma mapa sesion -> nombre evento
    sesRows.forEach((s: any) => {
      const sid = s?.id ? String(s.id) : null;
      const eid = s?.evento_id ? String(s.evento_id) : null;
      if (!sid || !eid) return;
      const n = eventosPorId.get(eid);
      if (n) eventoPorSesion.set(sid, n);
    });
  }

  return (
    <div className="p-6 text-white space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-sm opacity-70">Asistencias</div>
          <div className="text-2xl font-bold">Hoy ({hoy})</div>
        </div>

        {perms.update && (
          <a
            href="/dashboard/asistencias/correccion"
            className="rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-sm hover:bg-white/15"
          >
            Corrección (secretario/admin)
          </a>
        )}
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/20 overflow-hidden">
        <div className="overflow-auto">
          <table className="min-w-[1050px] w-full text-sm">
            <thead className="bg-white/5">
              <tr className="text-left">
                <th className="p-3">Hora</th>
                <th className="p-3">RUT</th>
                <th className="p-3">Nombre</th>
                <th className="p-3">DED</th>
                <th className="p-3">Sexo</th>
                <th className="p-3">Evento</th>
                {(perms.update || perms.delete) && <th className="p-3">Acciones</th>}
              </tr>
            </thead>

            <tbody>
              {rows.map((r) => {
                const m = r.miembros;
                const nombre =
                  (m ? `${m.nombres ?? ""} ${m.apellidos ?? ""}`.trim() : "") || "—";

                // ✅ Prioridad:
                // 1) nombre por id_evento (código)
                // 2) nombre por evento_sesion_id
                // 3) si no hay nombre, muestra id_evento (para diagnosticar)
                const nombrePorCodigo = r.id_evento
                  ? eventosPorCodigo.get(String(r.id_evento))?.trim()
                  : null;

                const nombrePorSesion = r.evento_sesion_id
                  ? eventoPorSesion.get(String(r.evento_sesion_id))?.trim()
                  : null;

                const eventoFinal =
                  nombrePorCodigo ||
                  nombrePorSesion ||
                  (r.id_evento ? `(${r.id_evento})` : "—");

                return (
                  <tr key={`${r.rut}-${r.created_at}`} className="border-t border-white/10">
                    <td className="p-3 tabular-nums">{toHHMM(r.hora)}</td>
                    <td className="p-3">{r.rut}</td>
                    <td className="p-3">{nombre}</td>
                    <td className="p-3">{r.ded ?? "—"}</td>
                    <td className="p-3">{m?.sexo ?? "—"}</td>
                    <td className="p-3">{eventoFinal}</td>

                    {(perms.update || perms.delete) && (
                      <td className="p-3">
                        <span className="text-xs opacity-70">
                          Disponible para secretario/admin
                        </span>
                      </td>
                    )}
                  </tr>
                );
              })}

              {(rows.length ?? 0) === 0 && (
                <tr>
                  <td className="p-4 opacity-70" colSpan={(perms.update || perms.delete) ? 7 : 6}>
                    No hay registros hoy.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-xs opacity-70">
        Ujier: lectura + registrar. Secretario: corrige. Admin: todo.
      </div>
    </div>
  );
}