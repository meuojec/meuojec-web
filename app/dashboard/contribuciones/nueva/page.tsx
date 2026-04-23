export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { registrarContribucion } from "../actions";

export default function NuevaContribucionPage() {
  const hoy = new Date().toISOString().slice(0, 10);

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Registrar contribución</h1>
        <p className="mt-2 text-white/60">Ingresa un diezmo, ofrenda u otra contribución.</p>
      </div>

      <form action={registrarContribucion} className="space-y-5 rounded-2xl border border-white/10 bg-black/20 p-6">
        <div className="space-y-2">
          <label className="text-sm text-white/70">RUT del miembro</label>
          <input
            name="miembro_rut"
            placeholder="Dejar vacío si es anónimo"
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white outline-none focus:border-emerald-500/40"
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" name="anonimo" className="rounded" />
          <span className="text-sm text-white/70">Contribución anónima</span>
        </label>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm text-white/70">Tipo *</label>
            <select
              name="tipo"
              required
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white"
            >
              <option value="diezmo">Diezmo</option>
              <option value="ofrenda">Ofrenda</option>
              <option value="especial">Especial</option>
              <option value="mision">Misión</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-white/70">Monto (CLP) *</label>
            <input
              name="monto"
              type="number"
              min="0"
              step="1"
              required
              placeholder="0"
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white outline-none focus:border-emerald-500/40"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-white/70">Fecha *</label>
          <input
            name="fecha"
            type="date"
            defaultValue={hoy}
            required
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white outline-none focus:border-emerald-500/40"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-white/70">Notas</label>
          <textarea
            name="notas"
            rows={3}
            placeholder="Observaciones opcionales..."
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white outline-none focus:border-emerald-500/40 resize-none"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="rounded-xl border border-emerald-500/30 bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/20 transition"
          >
            Guardar contribución
          </button>
          <Link
            href="/dashboard/contribuciones"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/10 transition"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
