// app/dashboard/eventos/page.tsx
export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { activarEvento, desactivarEvento } from "./actions";

const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

type Evento = {
  id: string;
  id_evento: string | null;
  nombre: string | null;
  activo: boolean | null;
  activated_at: string | null;
  created_at: string | null;
  horario_auto?: { activo: boolean; franjas: { dia: number; hora_inicio: string; hora_fin: string }[] } | null;
};

function fmtDateTime(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("es-CL", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function HorarioBadge({ horario }: { horario: Evento["horario_auto"] }) {
  if (!horario?.activo || !horario.franjas?.length) return null;
  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {horario.franjas.map((f, i) => (
        <span
          key={i}
          className="inline-flex items-center rounded-full border border-sky-500/20 bg-sky-500/10 px-2 py-0.5 text-[10px] text-sky-300"
        >
          {DIAS[f.dia]} {f.hora_inicio}–{f.hora_fin}
        </span>
      ))}
    </div>
  );
}

export default async function EventosPage() {
  const supabase = await createClient();

  // Intentar con horario_auto; si la columna no existe aún, reintentar sin ella
  let { data, error } = await supabase
    .from("eventos")
    .select("id,id_evento,nombre,activo,activated_at,created_at,horario_auto")
    .order("activo", { ascending: false })
    .order("activated_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false, nullsFirst: false });

  const needsMigration = !!error?.message?.includes("horario_auto");

  if (needsMigration) {
    // Columna aún no existe — consultar sin ella
    const fallback = await supabase
      .from("eventos")
      .select("id,id_evento,nombre,activo,activated_at,created_at")
      .order("activo", { ascending: false })
      .order("activated_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false, nullsFirst: false });
    data = fallback.data as typeof data;
    error = fallback.error;
  }

  if (error) {
    return (
      <div className="space-y-3">
        <h1 className="text-3xl font-bold">Eventos</h1>
        <p className="text-red-400">Error: {error.message}</p>
      </div>
    );
  }

  const eventos = (data ?? []) as Evento[];
  const active = eventos.find((e) => !!e.activo);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Eventos</h1>
          <p className="mt-2 text-white/70">
            Crea eventos y define cuál está activo para registrar asistencias.
          </p>
          <p className="mt-1 text-white/60 text-sm">
            Activo actual:{" "}
            <span className="text-white/80">{active?.nombre ?? "Ninguno"}</span>
          </p>
        </div>

        <Link
          href="/dashboard/eventos/nuevo"
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/10 active:scale-[0.99]"
        >
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/90">
            +
          </span>
          Crear evento
        </Link>
      </div>

      {/* Banner de migración pendiente */}
      {needsMigration && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-5 py-3 text-sm text-amber-200">
          <strong>Migración pendiente:</strong> Para activar los horarios automáticos, ejecuta el SQL en{" "}
          <code className="rounded bg-white/10 px-1">supabase/migrations/20260422_add_horario_auto.sql</code>{" "}
          en el Editor SQL de Supabase.
        </div>
      )}

      {/* Tabla */}
      <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="font-semibold">Listado</div>
          <div className="text-sm text-white/60">Total: {eventos.length}</div>
        </div>

        <div className="overflow-auto">
          <table className="min-w-[900px] w-full text-sm">
            <thead className="bg-black/30 text-white/70">
              <tr className="border-b border-white/10">
                <th className="text-left font-medium px-4 py-3">Código</th>
                <th className="text-left font-medium px-4 py-3">Estado</th>
                <th className="text-left font-medium px-4 py-3">Nombre / Horario auto</th>
                <th className="text-left font-medium px-4 py-3">Activado</th>
                <th className="text-right font-medium px-4 py-3">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {eventos.map((e) => {
                const canToggle = !!e.id_evento;
                const tieneHorario = !!e.horario_auto?.activo && (e.horario_auto?.franjas?.length ?? 0) > 0;

                return (
                  <tr
                    key={e.id}
                    className={[
                      "border-t border-white/10 transition",
                      e.activo ? "bg-emerald-500/[0.06]" : "hover:bg-white/5",
                    ].join(" ")}
                  >
                    <td className="px-4 py-3 text-white/70 tabular-nums">
                      {e.id_evento ?? "—"}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        {e.activo ? (
                          <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-200">
                            ● Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-xs font-semibold text-white/50">
                            Inactivo
                          </span>
                        )}
                        {tieneHorario && (
                          <span className="inline-flex items-center rounded-full border border-sky-500/20 bg-sky-500/10 px-2.5 py-0.5 text-[10px] text-sky-300">
                            ⏱ Auto
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="text-white/90 font-medium">{e.nombre ?? "—"}</div>
                      <HorarioBadge horario={e.horario_auto} />
                    </td>

                    <td className="px-4 py-3 text-white/80">
                      {fmtDateTime(e.activated_at)}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        {/* Activar — usa Server Action, no navega */}
                        {!e.activo && (
                          <form action={activarEvento}>
                            <input type="hidden" name="id_evento" value={e.id_evento ?? ""} />
                            <button
                              type="submit"
                              disabled={!canToggle}
                              className={[
                                "inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-semibold transition active:scale-[0.99]",
                                canToggle
                                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20"
                                  : "border-white/10 bg-white/5 text-white/50 opacity-60 cursor-not-allowed",
                              ].join(" ")}
                              title={canToggle ? "Activar evento" : "Este evento no tiene id_evento"}
                            >
                              Activar
                            </button>
                          </form>
                        )}

                        {/* Desactivar — usa Server Action, no navega */}
                        {e.activo && (
                          <form action={desactivarEvento}>
                            <input type="hidden" name="id_evento" value={e.id_evento ?? ""} />
                            <button
                              type="submit"
                              disabled={!canToggle}
                              className={[
                                "inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-semibold transition active:scale-[0.99]",
                                canToggle
                                  ? "border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
                                  : "border-white/10 bg-white/5 text-white/50 opacity-60 cursor-not-allowed",
                              ].join(" ")}
                              title={canToggle ? "Desactivar evento" : "Este evento no tiene id_evento"}
                            >
                              Desactivar
                            </button>
                          </form>
                        )}

                        {/* Editar */}
                        <Link
                          href={`/dashboard/eventos/${encodeURIComponent(e.id)}/editar`}
                          className="inline-flex items-center rounded-lg border border-white/10 bg-transparent px-3 py-1.5 text-xs font-semibold text-white/80 transition hover:bg-white/10 active:scale-[0.99]"
                        >
                          Editar
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {eventos.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-white/60">
                    No hay eventos aún.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-sm text-white/50">
        Solo puede existir 1 evento activo a la vez. Los eventos con ⏱ Auto se activan automáticamente
        según su horario programado. La activación manual siempre tiene prioridad.
      </div>
    </div>
  );
}
