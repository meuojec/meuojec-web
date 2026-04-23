export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { registrarSeguimiento } from "../actions";

export default function NuevoSeguimientoPage() {
  const hoy = new Date().toISOString().slice(0, 10);

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Nuevo registro pastoral</h1>
        <p className="mt-2 text-white/60">Registra una visita, llamada o atención pastoral a un miembro.</p>
      </div>

      <form action={registrarSeguimiento} className="space-y-5 rounded-2xl border border-white/10 bg-black/20 p-6">
        <div className="space-y-2">
          <label className="text-sm text-white/70">RUT del miembro *</label>
          <input
            name="miembro_rut"
            required
            placeholder="Ej: 12345678-9"
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white outline-none focus:border-emerald-500/40"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm text-white/70">Fecha</label>
            <input
              name="fecha"
              type="date"
              defaultValue={hoy}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white outline-none focus:border-emerald-500/40"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-white/70">Tipo</label>
            <select name="tipo" className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white">
              <option value="visita">Visita domiciliar</option>
              <option value="llamada">Llamada telefónica</option>
              <option value="consejeria">Consejería</option>
              <option value="oracion">Oración</option>
              <option value="otro">Otro</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-white/70">Descripción *</label>
          <textarea
            name="descripcion"
            rows={5}
            required
            placeholder="Describe la visita, situación o atención brindada..."
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white outline-none focus:border-emerald-500/40 resize-none"
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" name="privado" defaultChecked className="rounded" />
          <span className="text-sm text-white/70">🔒 Registro privado (solo visible para pastores y admins)</span>
        </label>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="rounded-xl border border-emerald-500/30 bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/20 transition"
          >
            Guardar registro
          </button>
          <Link
            href="/dashboard/pastoral"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/10 transition"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
