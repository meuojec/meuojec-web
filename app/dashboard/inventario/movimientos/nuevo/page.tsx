// app/dashboard/inventario/movimientos/nuevo/page.tsx
export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createMovimiento } from "./actions";
import ProductPicker from "./ProductPicker";

export default async function NuevoMovimientoPage() {
  const supabase = await createClient();

  const { data: productos } = await supabase
    .from("inv_productos")
    .select("id, nombre, sku, barcode, activo")
    .eq("activo", true)
    .order("nombre", { ascending: true });

  const { data: ubicaciones } = await supabase
    .from("inv_ubicaciones")
    .select("id, nombre")
    .order("nombre", { ascending: true });

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Nuevo movimiento</h1>
          <p className="mt-1 text-white/60">
            Registra <b>entrada</b>, <b>salida</b>, <b>ajuste</b> o <b>traslado</b>.
            Puedes seleccionar producto desde lista o escanear <b>SKU/Barcode</b>.
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/dashboard/inventario/movimientos"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
          >
            ← Volver
          </Link>
        </div>
      </div>

      <form
        action={createMovimiento}
        className="rounded-2xl border border-white/10 bg-black/20 p-6 space-y-6"
      >
        {/* Producto pro: búsqueda / escaneo / selector */}
        <ProductPicker productos={(productos ?? []) as any} />

        {/* Datos del movimiento */}
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <div className="text-sm text-white/70">Tipo *</div>
            <select
              name="tipo"
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2"
              defaultValue="entrada"
              required
            >
              <option value="entrada">entrada</option>
              <option value="salida">salida</option>
              <option value="ajuste">ajuste</option>
              <option value="traslado">traslado</option>
            </select>
            <div className="text-xs text-white/45">
              Entrada = destino, Salida = origen, Traslado = ambos, Ajuste = origen(resta) o destino(suma).
            </div>
          </label>

          <label className="space-y-2">
            <div className="text-sm text-white/70">Cantidad *</div>
            <input
              name="cantidad"
              type="number"
              min="0.0001"
              step="0.0001"
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2"
              placeholder="Ej: 40"
              required
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <div className="text-sm text-white/70">Ubicación origen</div>
            <select
              name="ubicacion_origen_id"
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2"
              defaultValue=""
            >
              <option value="">—</option>
              {(ubicaciones ?? []).map((u: any) => (
                <option key={u.id} value={u.id}>
                  {u.nombre}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <div className="text-sm text-white/70">Ubicación destino</div>
            <select
              name="ubicacion_destino_id"
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2"
              defaultValue=""
            >
              <option value="">—</option>
              {(ubicaciones ?? []).map((u: any) => (
                <option key={u.id} value={u.id}>
                  {u.nombre}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="space-y-2 block">
          <div className="text-sm text-white/70">Nota (opcional)</div>
          <input
            name="nota"
            type="text"
            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2"
            placeholder="Ej: compra, donación, consumo..."
          />
        </label>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Link
            href="/dashboard/inventario/movimientos"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200 hover:bg-emerald-500/15"
          >
            Guardar movimiento
          </button>
        </div>

        <div className="text-xs text-white/40">
          Tip: si usas lector de códigos USB, escanea en el campo “Escanear / Buscar” y presiona Enter.
        </div>
      </form>
    </div>
  );
}
