// app/dashboard/eventos/nuevo/page.tsx
export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

function toNull(v: FormDataEntryValue | null) {
  const s = String(v ?? "").trim();
  return s ? s : null;
}

export default async function NuevoEventoPage() {
  const supabase = await createClient();

  // Traer todos los codigos y quedarse con el maximo numerico
  const { data: todos } = await supabase
    .from("eventos")
    .select("id_evento");

  const maxNum = Math.max(
    0,
    ...(todos ?? []).map((e) => parseInt(e.id_evento ?? "0", 10) || 0)
  );
  const codigoSiguiente = String(maxNum + 1).padStart(3, "0");

  async function createEvent(formData: FormData) {
    "use server";

    const nombre     = String(formData.get("nombre")      || "").trim();
    const id_evento  = String(formData.get("id_evento")   || "").trim();
    const fecha_evento = toNull(formData.get("fecha_evento"));
    const hora_evento  = toNull(formData.get("hora_evento"));

    if (!nombre || !id_evento) return;

    const supabase = await createClient();
    await supabase.from("eventos").insert({
      nombre,
      id_evento,
      activo: false,
      fecha_evento,
      hora_evento,
    });

    revalidatePath("/dashboard/eventos");
    revalidatePath("/dashboard");
    redirect("/dashboard/eventos");
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-3xl font-bold text-white">Crear evento</h1>
        <p className="mt-2 text-white/60">
          Crea un nuevo evento. Puedes definir fecha y hora (opcional) y luego activarlo desde la lista.
        </p>
      </div>

      <form action={createEvent} className="space-y-5">
        {/* Hidden input que realmente se envia */}
        <input type="hidden" name="id_evento" value={codigoSiguiente} />

        <div className="space-y-2">
          <label className="text-sm text-white/70">
            Codigo del evento{" "}
            <span className="text-white/30">(asignado automaticamente)</span>
          </label>
          {/* Solo visual, no se envia */}
          <div className="w-full rounded-xl border border-white/10 bg-black/10 px-4 py-2 text-sm text-white/50 select-none">
            {codigoSiguiente}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-white/70">Nombre</label>
          <input
            name="nombre"
            required
            autoFocus
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white outline-none focus:border-emerald-500/40"
            placeholder="Ej: Escuela Dominical"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm text-white/70">
              Fecha del evento <span className="text-white/30">(opcional)</span>
            </label>
            <input
              type="date"
              name="fecha_evento"
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white outline-none focus:border-emerald-500/40"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-white/70">
              Hora del evento <span className="text-white/30">(opcional)</span>
            </label>
            <input
              type="time"
              name="hora_evento"
              step="60"
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white outline-none focus:border-emerald-500/40"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-500/20 active:scale-[0.99]"
          >
            Crear evento
          </button>
          <Link
            href="/dashboard/eventos"
            className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/85 transition hover:bg-white/10 active:scale-[0.99]"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
