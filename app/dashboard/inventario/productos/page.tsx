// app/dashboard/inventario/productos/page.tsx
export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ProductActions from "./ProductActions";

export default async function ProductosPage() {
  const supabase = await createClient();

  // Para saber si es admin (y mostrar botón eliminar)
  const { data: { user } } = await supabase.auth.getUser();

  const { data: prof } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user?.id ?? "")
    .single();

  const isAdmin = prof?.role === "admin";

  const { data: productos, error } = await supabase
    .from("inv_productos")
    .select("id, sku, barcode, nombre, unidad, stock_minimo, activo, categoria_id, inv_categorias(nombre)")
    .order("nombre", { ascending: true });

  const { data: stockRows } = await supabase
    .from("inv_stock")
    .select("producto_id, stock");

  // Stock total por producto
  const totalByProducto = new Map<string, number>();
  (stockRows ?? []).forEach((r: any) => {
    const id = r.producto_id as string;
    totalByProducto.set(id, (totalByProducto.get(id) ?? 0) + Number(r.stock ?? 0));
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Productos</h1>
          <p className="mt-1 text-white/60">Listado de productos con stock total.</p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/dashboard/inventario/productos/nuevo"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
          >
            + Nuevo producto
          </Link>

          <Link
            href="/dashboard/inventario"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
          >
            ← Volver
          </Link>

          <Link
            href="/dashboard/inventario/movimientos/nuevo"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
          >
            + Nuevo movimiento
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/20 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10 text-sm text-white/60">
          {error ? `Error: ${error.message}` : `Total: ${productos?.length ?? 0}`}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-white/5 text-white/70">
              <tr>
                <th className="px-5 py-3 text-left">SKU</th>
                <th className="px-5 py-3 text-left">Barcode</th>
                <th className="px-5 py-3 text-left">Nombre</th>
                <th className="px-5 py-3 text-left">Categoría</th>
                <th className="px-5 py-3 text-left">Unidad</th>
                <th className="px-5 py-3 text-right">Stock</th>
                <th className="px-5 py-3 text-right">Mínimo</th>
                <th className="px-5 py-3 text-left">Estado</th>
                <th className="px-5 py-3 text-right">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {(productos ?? []).map((p: any) => {
                const stockTotal = totalByProducto.get(p.id) ?? 0;
                const min = Number(p.stock_minimo ?? 0);
                const low = stockTotal <= min;

                return (
                  <tr key={p.id} className="border-t border-white/10 hover:bg-white/5">
                    <td className="px-5 py-3 text-white/80">{p.sku ?? "—"}</td>
                    <td className="px-5 py-3 text-white/80">{p.barcode ?? "—"}</td>

                    {/* ✅ LINK A EDITAR */}
                    <td className="px-5 py-3 font-medium">
                      <Link
                        href={`/dashboard/inventario/productos/${p.id}`}
                        className="hover:underline"
                        title="Editar producto"
                      >
                        {p.nombre}
                      </Link>
                      <div className="text-xs text-white/45">
                        ID: {String(p.id).slice(0, 8)}…
                      </div>
                    </td>

                    <td className="px-5 py-3 text-white/80">{p.inv_categorias?.nombre ?? "—"}</td>
                    <td className="px-5 py-3 text-white/80">{p.unidad}</td>

                    <td className="px-5 py-3 text-right">
                      <span className={low ? "text-amber-300" : "text-white"}>
                        {stockTotal}
                      </span>
                    </td>

                    <td className="px-5 py-3 text-right text-white/80">{min}</td>

                    <td className="px-5 py-3">
                      {p.activo ? (
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-200">
                          Activo
                        </span>
                      ) : (
                        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/60">
                          Inactivo
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-3">
                      <ProductActions id={p.id} activo={!!p.activo} isAdmin={isAdmin} />
                    </td>
                  </tr>
                );
              })}

              {(productos ?? []).length === 0 ? (
                <tr>
                  <td className="px-5 py-6 text-white/60" colSpan={9}>
                    No hay productos aún.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-xs text-white/40">
        Tip: Desactiva productos para mantener historial. Eliminar solo admin y solo si no tiene movimientos.
      </div>
    </div>
  );
}