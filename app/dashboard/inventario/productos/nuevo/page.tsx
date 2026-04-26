// app/dashboard/inventario/productos/nuevo/page.tsx
export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createProducto } from "./actions";
import BackButton from "@/app/components/BackButton";

export default async function NuevoProductoPage() {
  const supabase = await createClient();

  const { data: categorias } = await supabase
    .from("inv_categorias")
    .select("id, nombre")
    .order("nombre", { ascending: true });

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <BackButton />
            <h1 className="text-2xl font-semibold">Nuevo Producto</h1>
          </div>
          <p className="mt-1 text-white/60">
            Crea un producto con <span className="text-white/80">SKU</span> (interno) y/o{" "}
            <span className="text-white/80">Barcode</span> (para escanear).
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/dashboard/inventario/productos"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
          >
            ← Volver
          </Link>
        </div>
      </div>

      <form
        action={createProducto}
        className="rounded-2xl border border-white/10 bg-black/20 p-6 space-y-6"
      >
        {/* Datos principales */}
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <div className="text-sm text-white/70">Nombre *</div>
            <input
              name="nombre"
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2"
              placeholder="Ej: Silla plegable"
              required
            />
          </label>

          <label className="space-y-2">
            <div className="text-sm text-white/70">Unidad *</div>
            <input
              name="unidad"
              defaultValue="unidad"
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2"
              placeholder="Ej: unidad, caja, kg, lt..."
              required
            />
          </label>
        </div>

        {/* Identificación pro */}
        <div className="rounded-2xl border border-white/10 bg-black/20 p-5 space-y-4">
          <div>
            <div className="text-sm font-semibold">Identificación</div>
            <div className="text-xs text-white/50 mt-1">
              Recomendado: usa <b>SKU</b> para tu control interno y <b>Barcode</b> para escaneo (EAN/Code128/QR).
              Debes ingresar al menos uno de los dos.
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <div className="text-sm text-white/70">SKU (interno)</div>
              <input
                name="sku"
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2"
                placeholder="Ej: SILLA-001"
              />
            </label>

            <label className="space-y-2">
              <div className="text-sm text-white/70">Barcode (para escanear)</div>
              <input
                name="barcode"
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2"
                placeholder="Ej: 7801234567890"
              />
            </label>
          </div>
        </div>

        {/* Configuración */}
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <div className="text-sm text-white/70">Categoría</div>
            <select
              name="categoria_id"
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2"
              defaultValue=""
            >
              <option value="">—</option>
              {(categorias ?? []).map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <div className="text-sm text-white/70">Stock mínimo</div>
            <input
              name="stock_minimo"
              type="number"
              defaultValue={0}
              min={0}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2"
              placeholder="0"
            />
            <div className="text-xs text-white/45">
              Se usa para alertas de “bajo mínimo”.
            </div>
          </label>
        </div>

        {/* Acciones */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <Link
            href="/dashboard/inventario/productos"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
          >
            Cancelar
          </Link>

          <button
            type="submit"
            className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200 hover:bg-emerald-500/15"
          >
            Guardar producto
          </button>
        </div>
      </form>
    </div>
  );
}