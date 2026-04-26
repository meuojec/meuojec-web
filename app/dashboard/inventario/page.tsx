// app/dashboard/inventario/page.tsx
export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BackButton from "@/app/components/BackButton";

function Card({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string;
  subtitle?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
      <div className="text-sm text-white/60">{title}</div>
      <div className="mt-2 text-3xl font-semibold">{value}</div>
      {subtitle ? <div className="mt-2 text-sm text-white/50">{subtitle}</div> : null}
    </div>
  );
}

export default async function InventarioPage() {
  const supabase = await createClient();

  // 1) Total productos activos
  const { count: productosActivos } = await supabase
    .from("inv_productos")
    .select("id", { count: "exact", head: true })
    .eq("activo", true);

  // 2) Movimientos de hoy (por fecha en timestamptz -> calculo rango día)
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);

  const { count: movHoy } = await supabase
    .from("inv_movimientos")
    .select("id", { count: "exact", head: true })
    .gte("fecha", start.toISOString())
    .lt("fecha", end.toISOString());

  // 3) Stock bajo mínimo (MVP: sumamos stock total por producto desde view)
  // view inv_stock trae stock por producto x ubicación. Aquí agregamos por producto.
  const { data: stockRows } = await supabase
    .from("inv_stock")
    .select("producto_id, stock");

  const { data: prodRows } = await supabase
    .from("inv_productos")
    .select("id, stock_minimo, activo")
    .eq("activo", true);

  const totalByProducto = new Map<string, number>();
  (stockRows ?? []).forEach((r: any) => {
    const id = r.producto_id as string;
    const v = Number(r.stock ?? 0);
    totalByProducto.set(id, (totalByProducto.get(id) ?? 0) + v);
  });

  let bajoMinimo = 0;
  (prodRows ?? []).forEach((p: any) => {
    const stockTotal = totalByProducto.get(p.id) ?? 0;
    const min = Number(p.stock_minimo ?? 0);
    if (stockTotal <= min) bajoMinimo += 1;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <BackButton />
            <h1 className="text-2xl font-semibold">Inventario</h1>
          </div>
          <p className="mt-1 text-white/60">
            Control de productos, stock y movimientos.
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/dashboard/inventario/movimientos/nuevo"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
          >
            + Nuevo movimiento
          </Link>
          <Link
            href="/dashboard/inventario/productos"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
          >
            Ver productos
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Productos activos" value={`${productosActivos ?? 0}`} />
        <Card title="Movimientos hoy" value={`${movHoy ?? 0}`} />
        <Card title="Bajo mínimo" value={`${bajoMinimo}`} subtitle="Stock total <= stock mínimo" />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Link
          href="/dashboard/inventario/productos"
          className="rounded-2xl border border-white/10 bg-black/20 p-5 hover:bg-black/30"
        >
          <div className="text-lg font-semibold">Productos</div>
          <div className="mt-1 text-sm text-white/60">Crear, editar y ver stock.</div>
        </Link>

        <Link
          href="/dashboard/inventario/movimientos"
          className="rounded-2xl border border-white/10 bg-black/20 p-5 hover:bg-black/30"
        >
          <div className="text-lg font-semibold">Movimientos</div>
          <div className="mt-1 text-sm text-white/60">Entradas, salidas, ajustes, traslados.</div>
        </Link>

        <Link
          href="/dashboard/inventario/alertas"
          className="rounded-2xl border border-white/10 bg-black/20 p-5 hover:bg-black/30"
        >
          <div className="text-lg font-semibold">Alertas</div>
          <div className="mt-1 text-sm text-white/60">Stock bajo, sin stock.</div>
        </Link>
      </div>
    </div>
  );
}