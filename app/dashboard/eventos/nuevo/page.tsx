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

export default function NuevoEventoPage() {
  async function createEvent(formData: FormData) {
    "use server";

    const nombre = String(formData.get("nombre") || "").trim();
    const id_evento = String(formData.get("id_evento") || "").trim();

    const fecha_evento = toNull(formData.get("fecha_evento")); // YYYY-MM-DD | null
    const hora_evento = toNull(formData.get("hora_evento"));   // HH:MM     | null

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
        <div className="space-y-2">
          <label className="text-sm text-white/70">Código del evento</label>
          <input
            name="id_evento"
            required
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white outline-none focus:border-emerald-500/40"
            placeholder="Ej: 003"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-white/70">Nombre</label>
          <input
            name="nombre"
            required
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white outline-none focus:border-emerald-500/40"
            placeholder="Ej: Escuela Dominical"
          />
        </div>

        {/* ✅ Fecha y hora */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm text-white/70">Fecha del evento</label>
            <input
              type="date"
              name="fecha_evento"
			  step="60"
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white outline-none focus:border-emerald-500/40"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-white/70">Hora del evento</label>
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