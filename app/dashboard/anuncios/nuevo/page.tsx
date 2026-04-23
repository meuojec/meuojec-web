export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { crearAnuncio } from "../actions";

export default function NuevoAnuncioPage() {
  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Crear anuncio</h1>
        <p className="mt-2 text-white/60">Publica una comunicación interna para el equipo o la congregación.</p>
      </div>

      <form action={crearAnuncio} className="space-y-5 rounded-2xl border border-white/10 bg-black/20 p-6">
        <div className="space-y-2">
          <label className="text-sm text-white/70">Título *</label>
          <input
            name="titulo"
            required
            placeholder="Ej: Reunión de líderes este sábado"
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white outline-none focus:border-emerald-500/40"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-white/70">Contenido *</label>
          <textarea
            name="contenido"
            rows={5}
            required
            placeholder="Escribe el cuerpo del anuncio..."
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white outline-none focus:border-emerald-500/40 resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm text-white/70">Tipo</label>
            <select name="tipo" className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white">
              <option value="general">General</option>
              <option value="urgente">Urgente</option>
              <option value="informativo">Informativo</option>
              <option value="evento">Evento</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-white/70">Audiencia</label>
            <select name="audiencia" className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white">
              <option value="todos">Todos</option>
              <option value="lideres">Líderes</option>
              <option value="admin">Solo admins</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-white/70">Fecha de expiración (opcional)</label>
          <input
            name="expira_en"
            type="date"
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white outline-none focus:border-emerald-500/40"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="rounded-xl border border-emerald-500/30 bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/20 transition"
          >
            Publicar anuncio
          </button>
          <Link
            href="/dashboard/anuncios"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/10 transition"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
