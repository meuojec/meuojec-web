export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { crearActividadAgenda } from "../actions";
import BackButton from "@/app/components/BackButton";

export default function NuevaActividadPage() {
  return (
    <div className="max-w-lg space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <BackButton />
          <h1 className="text-3xl font-bold">Agregar actividad</h1>
        </div>
        <p className="mt-2 text-white/60">Programa un nuevo evento o actividad para la iglesia.</p>
      </div>

      <form action={crearActividadAgenda} className="space-y-5 rounded-2xl border border-white/10 bg-black/20 p-6">
        <div className="space-y-2">
          <label className="text-sm text-white/70">Título *</label>
          <input
            name="titulo"
            required
            placeholder="Ej: Culto dominical"
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white outline-none focus:border-emerald-500/40"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-white/70">Descripción</label>
          <textarea
            name="descripcion"
            rows={3}
            placeholder="Detalles adicionales (opcional)"
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white outline-none focus:border-emerald-500/40 resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm text-white/70">Fecha *</label>
            <input
              name="fecha"
              type="date"
              required
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white outline-none focus:border-emerald-500/40"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-white/70">Tipo</label>
            <select name="tipo" className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white">
              <option value="culto">Culto</option>
              <option value="reunion">Reunión</option>
              <option value="ministerio">Ministerio</option>
              <option value="especial">Especial</option>
              <option value="otro">Otro</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm text-white/70">Hora inicio</label>
            <input
              name="hora_inicio"
              type="time"
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white outline-none focus:border-emerald-500/40"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-white/70">Hora fin</label>
            <input
              name="hora_fin"
              type="time"
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white outline-none focus:border-emerald-500/40"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-white/70">Lugar</label>
          <input
            name="lugar"
            placeholder="Ej: Templo principal"
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white outline-none focus:border-emerald-500/40"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="rounded-xl border border-emerald-500/30 bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/20 transition"
          >
            Guardar actividad
          </button>
          <Link
            href="/dashboard/agenda"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/10 transition"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
