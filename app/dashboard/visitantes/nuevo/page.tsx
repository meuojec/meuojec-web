export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { registrarVisitante } from "../actions";
import BackButton from "@/app/components/BackButton";

export default function NuevoVisitantePage() {
  const hoy = new Date().toISOString().slice(0, 10);

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <BackButton />
          <h1 className="text-3xl font-bold">Registrar visitante</h1>
        </div>
        <p className="mt-2 text-white/60">Registra a una persona que visitó la iglesia por primera vez.</p>
      </div>

      <form action={registrarVisitante} className="space-y-5 rounded-2xl border border-white/10 bg-black/20 p-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm text-white/70">Nombres *</label>
            <input
              name="nombres"
              required
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white outline-none focus:border-emerald-500/40"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-white/70">Apellidos</label>
            <input
              name="apellidos"
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white outline-none focus:border-emerald-500/40"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm text-white/70">Teléfono</label>
            <input
              name="telefono"
              type="tel"
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white outline-none focus:border-emerald-500/40"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-white/70">Email</label>
            <input
              name="email"
              type="email"
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white outline-none focus:border-emerald-500/40"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm text-white/70">Fecha de primera visita</label>
            <input
              name="fecha_primera_visita"
              type="date"
              defaultValue={hoy}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white outline-none focus:border-emerald-500/40"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-white/70">¿Cómo llegó?</label>
            <select
              name="origen"
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white"
            >
              <option value="invitado">Invitado por miembro</option>
              <option value="redes_sociales">Redes sociales</option>
              <option value="publicidad">Publicidad</option>
              <option value="propio">Iniciativa propia</option>
              <option value="otro">Otro</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-white/70">Notas</label>
          <textarea
            name="notas"
            rows={3}
            placeholder="Observaciones, inquietudes, contexto..."
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white outline-none focus:border-emerald-500/40 resize-none"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="rounded-xl border border-emerald-500/30 bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/20 transition"
          >
            Registrar visitante
          </button>
          <Link
            href="/dashboard/visitantes"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/10 transition"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
