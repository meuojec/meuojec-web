export const dynamic = "force-dynamic";
export const revalidate = 0;

import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import EditAsistenciaForm from "./EditAsistenciaForm";

function toHHMM(h?: string | null) {
  if (!h) return "";
  return h.length >= 5 ? h.slice(0, 5) : h;
}

export default async function EditarAsistenciaPage(props: any) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // ✅ Next 16: params/searchParams pueden venir como Promise => normalizamos
  const params = await Promise.resolve(props.params ?? {});
  const searchParams = await Promise.resolve(props.searchParams ?? {});

  const rut = String(searchParams?.rut ?? "").trim();

  // ✅ prioridad: querystring created_at, fallback: params.id
  const createdAtRaw =
    String(searchParams?.created_at ?? "").trim() ||
    (params?.id ? decodeURIComponent(String(params.id)) : "");

  if (!createdAtRaw) {
    return (
      <div className="p-6 text-white">
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
          <div className="font-semibold">Falta created_at</div>
          <div className="text-sm text-white/70 mt-1">
            El link de Editar debe incluir <b>?created_at=...</b>
          </div>
          <div className="mt-4">
            <Link
              href="/dashboard/asistencias/reporte"
              className="inline-flex items-center rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
            >
              Volver al reporte
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 1) Buscar la asistencia por created_at (y rut si viene)
  const base = supabase
    .from("asistencias")
    .select("rut, fecha, hora, ded, id_evento, evento_sesion_id, created_at")
    .eq("created_at", createdAtRaw);

  const { data: row, error } = rut ? await base.eq("rut", rut).maybeSingle() : await base.maybeSingle();

  if (error || !row) {
    return (
      <div className="p-6 text-white">
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
          <div className="font-semibold">No se encontró la asistencia</div>
          <div className="text-sm text-white/70 mt-1">{error?.message ?? "—"}</div>
          <div className="mt-4">
            <Link
              href="/dashboard/asistencias/reporte"
              className="inline-flex items-center rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
            >
              Volver al reporte
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2) Resolver nombre del evento (opcional)
  let eventoNombre: string | null = null;

  if (row.id_evento) {
    const { data: ev } = await supabase
      .from("eventos")
      .select("nombre")
      .eq("id_evento", row.id_evento)
      .maybeSingle();
    eventoNombre = ev?.nombre ?? null;
  }

  if (!eventoNombre && row.evento_sesion_id) {
    const { data: ses } = await supabase
      .from("eventos_sesiones")
      .select("evento_id")
      .eq("id", row.evento_sesion_id)
      .maybeSingle();

    if (ses?.evento_id) {
      const { data: ev2 } = await supabase
        .from("eventos")
        .select("nombre")
        .eq("id", ses.evento_id)
        .maybeSingle();
      eventoNombre = ev2?.nombre ?? null;
    }
  }

  return (
    <div className="p-6 text-white">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-xl font-semibold">Editar asistencia</div>
          <div className="text-sm text-white/60">
            RUT: <span className="text-white/90">{row.rut ?? "—"}</span>
            {eventoNombre ? (
              <>
                {" "}
                • Evento: <span className="text-white/90">{eventoNombre}</span>
              </>
            ) : null}
          </div>
        </div>

        <Link
          href="/dashboard/asistencias/reporte"
          className="inline-flex items-center rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
        >
          Volver
        </Link>
      </div>

      <EditAsistenciaForm
        initial={{
          rut: String(row.rut ?? ""),
          created_at: String(row.created_at ?? createdAtRaw),
          fecha: row.fecha ?? "",
          hora: toHHMM(row.hora),
          ded: row.ded ?? "",
          id_evento: row.id_evento ?? "",
          evento_sesion_id: row.evento_sesion_id ?? "",
        }}
      />
    </div>
  );
}