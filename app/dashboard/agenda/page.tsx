export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { eliminarActividad } from "./actions";
import BackButton from "@/app/components/BackButton";
import CalendarioAgenda from "./CalendarioAgenda";

const TIPO_STYLE: Record<string, string> = {
  culto:      "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  reunion:    "border-sky-500/30 bg-sky-500/10 text-sky-200",
  ministerio: "border-purple-500/30 bg-purple-500/10 text-purple-200",
  especial:   "border-amber-500/30 bg-amber-500/10 text-amber-200",
  otro:       "border-white/10 bg-white/5 text-white/50",
};

const TIPO_LABEL: Record<string, string> = {
  culto: "Culto", reunion: "Reunión", ministerio: "Ministerio", especial: "Especial", otro: "Otro",
};

function fmtFecha(fecha: string) {
  return new Date(fecha + "T12:00:00").toLocaleDateString("es-CL", {
    weekday: "long", day: "numeric", month: "long",
  });
}

function fmtHora(h?: string | null) {
  if (!h) return null;
  return h.slice(0, 5);
}

export default async function AgendaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const hoy = new Date().toISOString().slice(0, 10);
  const en30 = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  const hace7 = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const inicioMes = hoy.slice(0, 7) + "-01";
  const finMes3 = new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10);

  // Para el calendario: 3 meses de actividades
  const { data: paraCalendario } = await supabase
    .from("agenda")
    .select("id,titulo,fecha,hora_inicio,tipo")
    .eq("activo", true)
    .gte("fecha", inicioMes)
    .lte("fecha", finMes3)
    .order("fecha")
    .order("hora_inicio");

  // Para la lista: próximos 30 días
  const { data: proximos } = await supabase
    .from("agenda")
    .select("id,titulo,descripcion,fecha,hora_inicio,hora_fin,tipo,lugar")
    .eq("activo", true)
    .gte("fecha", hoy)
    .lte("fecha", en30)
    .order("fecha")
    .order("hora_inicio");

  const { data: pasados } = await supabase
    .from("agenda")
    .select("id,titulo,fecha,hora_inicio,tipo,lugar")
    .eq("activo", true)
    .gte("fecha", hace7)
    .lt("fecha", hoy)
    .order("fecha", { ascending: false });

  const actividadesCalendario = (paraCalendario ?? []) as any[];
  const listaProxima = (proximos ?? []) as any[];
  const listaPasada = (pasados ?? []) as any[];

  // Agrupar por fecha
  const porFecha = listaProxima.reduce<Record<string, any[]>>((acc, ev) => {
    if (!acc[ev.fecha]) acc[ev.fecha] = [];
    acc[ev.fecha].push(ev);
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <BackButton />
            <h1 className="text-3xl font-bold">Agenda</h1>
          </div>
          <p className="mt-2 text-white/60">Actividades y eventos programados de la iglesia.</p>
        </div>
        <Link
          href="/dashboard/agenda/nuevo"
          className="rounded-xl border border-emerald-500/30 bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/20 transition"
        >
          + Agregar actividad
        </Link>
      </div>

      {/* Calendario mensual */}
      <CalendarioAgenda actividades={actividadesCalendario} />

      {/* Próximos 30 días */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wider">
          Próximos 30 días ({listaProxima.length})
        </h2>

        {listaProxima.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-black/20 p-8 text-center text-white/40 text-sm">
            Sin actividades programadas para los próximos 30 días.
          </div>
        )}

        {Object.entries(porFecha).map(([fecha, eventos]) => (
          <div key={fecha}>
            <div className="text-sm font-medium text-white/40 mb-2 capitalize px-1">
              {fmtFecha(fecha)}
            </div>
            <div className="space-y-2">
              {eventos.map((ev) => (
                <div key={ev.id} className="rounded-2xl border border-white/10 bg-black/20 px-5 py-4 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="text-xs text-white/40 tabular-nums pt-0.5 min-w-[80px]">
                      {fmtHora(ev.hora_inicio)
                        ? `${fmtHora(ev.hora_inicio)}${fmtHora(ev.hora_fin) ? ` – ${fmtHora(ev.hora_fin)}` : ""}`
                        : "Todo el día"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{ev.titulo}</span>
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${TIPO_STYLE[ev.tipo] ?? TIPO_STYLE.otro}`}>
                          {TIPO_LABEL[ev.tipo] ?? ev.tipo}
                        </span>
                      </div>
                      {ev.lugar && <div className="text-xs text-white/40 mt-0.5">📍 {ev.lugar}</div>}
                      {ev.descripcion && <div className="text-sm text-white/50 mt-1">{ev.descripcion}</div>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link
                      href={`/dashboard/agenda/${ev.id}/editar`}
                      className="rounded border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/60 hover:bg-white/10 transition"
                    >
                      Editar
                    </Link>
                    <form action={eliminarActividad.bind(null, ev.id)}>
                      <button type="submit" className="rounded border border-red-500/20 bg-red-500/10 px-2 py-1 text-xs text-red-300 hover:bg-red-500/20 transition">
                        Quitar
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Pasados recientes */}
      {listaPasada.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-white/30 uppercase tracking-wider">Últimos 7 días</h2>
          <div className="rounded-2xl border border-white/10 bg-black/10 overflow-hidden opacity-60">
            <table className="w-full text-sm">
              <tbody>
                {listaPasada.map((ev) => (
                  <tr key={ev.id} className="border-t border-white/5 first:border-t-0">
                    <td className="px-4 py-2 text-white/30 tabular-nums text-xs">{ev.fecha}</td>
                    <td className="px-4 py-2 text-white/40">{ev.titulo}</td>
                    <td className="px-4 py-2 text-white/30 text-xs">{ev.lugar ?? ""}</td>
                    <td className="px-4 py-2">
                      <Link href={`/dashboard/agenda/${ev.id}/editar`} className="text-xs text-white/20 hover:text-white/50">
                        Editar
                      </Link>
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
