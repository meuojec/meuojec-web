// app/dashboard/inventario/alertas/page.tsx
export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BackButton from "@/app/components/BackButton";

export default async function AlertasPage() {
  const supabase = await createClient();

  const { data: productos } = await supabase
    .from("inv_productos")
    .select("id, sku, nombre, unidad, stock_minimo, activo")
    .eq("activo", true)
    .order("nombre", { ascending: true });

  const { data: stockRows } = await supabase
    .from("inv_stock")
    .select("producto_id, stock");

  const totalByProducto = new Map<string, number>();
  (stockRows ?? []).forEach((r: any) => {
    const id = r.producto_id as string;
    totalByProducto.set(id, (totalByProducto.get(id) ?? 0) + Number(r.stock ?? 0));
  });

  const sinStock: any[] = [];
  const bajoMinimo: any[] = [];

  (productos ?? []).forEach((p: any) => {
    const stock = totalByProducto.get(p.id) ?? 0;
    const min = Number(p.stock_minimo ?? 0);
    if (stock <= 0) sinStock.push({ ...p, stock, min });
    if (stock > 0 && stock <= min) bajoMinimo.push({ ...p, stock, min });
  });

  const Row = ({ item }: { item: any }) => (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3">
      <div>
        <div className="font-medium">{item.nombre}</div>
        <div className="text-xs text-white/50">
          SKU: {item.sku ?? "—"} · Unidad: {item.unidad} · Minimo: {item.min}
        </div>
      </div>
      <div className="text-right">
        <div className="text-sm text-white/60">Stock</div>
        <div className="text-lg font-semibold">{item.stock}</div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <BackButton />
            <h1 className="text-2xl font-semibold">Alertas</h1>
          </div>
          <p className="mt-1 text-white/60">Stock bajo minimo o sin stock.</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard/inventario"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
          >
            Volver
          </Link>
          <Link
            href="/dashboard/inventario/movimientos/nuevo"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
          >
            + Nuevo movimiento
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-lg font-semibold">Sin stock</div>
            <div className="text-sm text-white/60">{sinStock.length} producto(s)</div>
          </div>
          {sinStock.length === 0 ? (
            <div className="text-sm text-white/40">Sin productos sin stock.</div>
          ) : (
            <div className="space-y-2">
              {sinStock.map((item) => <Row key={item.id} item={item} />)}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-lg font-semibold">Bajo minimo</div>
            <div className="text-sm text-white/60">{bajoMinimo.length} producto(s)</div>
          </div>
          {bajoMinimo.length === 0 ? (
            <div className="text-sm text-white/40">Sin productos bajo minimo.</div>
          ) : (
            <div className="space-y-2">
              {bajoMinimo.map((item) => <Row key={item.id} item={item} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
