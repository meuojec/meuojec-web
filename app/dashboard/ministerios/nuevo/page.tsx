export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { crearMinisterio } from "../actions";
import BackButton from "@/app/components/BackButton";

const COLORES = [
  { valor: "#6366f1", nombre: "Índigo" },
  { valor: "#22c55e", nombre: "Verde" },
  { valor: "#f59e0b", nombre: "Ámbar" },
  { valor: "#ef4444", nombre: "Rojo" },
  { valor: "#06b6d4", nombre: "Cyan" },
  { valor: "#8b5cf6", nombre: "Violeta" },
  { valor: "#ec4899", nombre: "Rosa" },
  { valor: "#f97316", nombre: "Naranja" },
];

export default function NuevoMinisterioPage() {
  return (
    <div className="max-w-lg space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <BackButton />
          <h1 className="text-3xl font-bold">Nuevo ministerio</h1>
        </div>
        <p className="mt-2 text-white/60">Crea un departamento o ministerio de la iglesia.</p>
      </div>

      <form action={crearMinisterio} className="space-y-5 rounded-2xl border border-white/10 bg-black/20 p-6">
        <div className="space-y-2">
          <label className="text-sm text-white/70">Nombre *</label>
          <input
            name="nombre"
            required
            placeholder="Ej: Ministerio de Alabanza"
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white outline-none focus:border-emerald-500/40"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-white/70">Descripción</label>
          <textarea
            name="descripcion"
            rows={3}
            placeholder="Descripción del ministerio..."
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white outline-none focus:border-emerald-500/40 resize-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-white/70">RUT del líder</label>
          <input
            name="lider_rut"
            placeholder="Ej: 12345678-9"
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white outline-none focus:border-emerald-500/40"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-white/70">Color identificador</label>
          <div className="flex flex-wrap gap-2">
            {COLORES.map((c, i) => (
              <label key={c.valor} className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="color"
                  value={c.valor}
                  defaultChecked={i === 0}
                  className="sr-only"
                />
                <span
                  className="h-6 w-6 rounded-full border-2 border-white/20"
                  style={{ backgroundColor: c.valor }}
                  title={c.nombre}
                />
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="rounded-xl border border-emerald-500/30 bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/20 transition"
          >
            Crear ministerio
          </button>
          <Link
            href="/dashboard/ministerios"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/10 transition"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
