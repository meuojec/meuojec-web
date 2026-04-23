// app/dashboard/eventos/[id]/editar/page.tsx
export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import HorarioAutoForm from "./HorarioAutoForm";

type Props = {
  params: Promise<{ id: string }>;
};

function toNull(v: FormDataEntryValue | null) {
  const s = String(v ?? "").trim();
  return s ? s : null;
}

export default async function EditarEventoPage({ params }: Props) {
  const { id } = await params;

  const supabase = await createClient();

  let { data: evento, error } = await supabase
    .from("eventos")
    .select("id,id_evento,nombre,fecha_evento,hora_evento,horario_auto")
    .eq("id", id)
    .maybeSingle();

  // Si la columna horario_auto aún no existe, reintentar sin ella
  const needsMigration = !!error?.message?.includes("horario_auto");
  if (needsMigration) {
    const fallback = await supabase
      .from("eventos")
      .select("id,id_evento,nombre,fecha_evento,hora_evento")
      .eq("id", id)
      .maybeSingle();
    evento = fallback.data as typeof evento;
    error = fallback.error;
  }

  if (error || !evento) return notFound();

  async function updateEvent(formData: FormData) {
    "use server";

    const id_evento = String(formData.get("id_evento") || "").trim();
    const nombre = String(formData.get("nombre") || "").trim();
    const fecha_evento = toNull(formData.get("fecha_evento"));
    const hora_evento = toNull(formData.get("hora_evento"));

    const supabase = await createClient();

    await supabase
      .from("eventos")
      .update({ id_evento, nombre, fecha_evento, hora_evento })
      .eq("id", id);

    revalidatePath("/dashboard/eventos");
    revalidatePath("/dashboard");
    redirect("/dashboard/eventos");
  }

  const horarioAuto = (evento.horario_auto as {
    activo: boolean;
    franjas: { dia: number; hora_inicio: string; hora_fin: string }[];
  } | null) ?? null;

  return (
    <div className="space-y-8 max-w-xl">
      <div>
        <h1 className="text-3xl font-bold text-white">Editar evento</h1>
        <p className="mt-2 text-white/60">
          Modifica la información del evento e indica si debe activarse automáticamente.
        </p>
      </div>

      {/* Datos básicos */}
      <form action={updateEvent} className="space-y-5">
        <div className="space-y-2">
          <label className="text-sm text-white/70">Código del evento</label>
          <input
            name="id_evento"
            defaultValue={evento.id_evento ?? ""}
            required
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white outline-none focus:border-emerald-500/40"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-white/70">Nombre</label>
          <input
            name="nombre"
            defaultValue={evento.nombre ?? ""}
            required
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white outline-none focus:border-emerald-500/40"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm text-white/70">Fecha del evento</label>
            <input
              type="date"
              name="fecha_evento"
              defaultValue={evento.fecha_evento ?? ""}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white outline-none focus:border-emerald-500/40"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-white/70">Hora del evento</label>
            <input
              type="time"
              name="hora_evento"
              step="60"
              defaultValue={evento.hora_evento ?? ""}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white outline-none focus:border-emerald-500/40"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-500/20 active:scale-[0.99]"
          >
            Guardar cambios
          </button>

          <Link
            href="/dashboard/eventos"
            className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/85 transition hover:bg-white/10 active:scale-[0.99]"
          >
            Cancelar
          </Link>
        </div>
      </form>

      {/* Horario automático */}
      {needsMigration ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-5 py-3 text-sm text-amber-200">
          <strong>Migración pendiente:</strong> Para configurar horarios automáticos, ejecuta primero el SQL en{" "}
          <code className="rounded bg-white/10 px-1">supabase/migrations/20260422_add_horario_auto.sql</code>{" "}
          en el Editor SQL de Supabase.
        </div>
      ) : (
        <HorarioAutoForm
          eventoId={evento.id}
          nombreEvento={evento.nombre ?? ""}
          horarioActual={horarioAuto}
        />
      )}
    </div>
  );
}
