export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import EditProductoForm from "./EditProductoForm";
import LocationFilter from "./LocationFilter";
import MovementsChart from "./MovementsChart";
import { quickMovimiento } from "./quick-actions";
import BackButton from "@/app/components/BackButton";

export default async function EditProductoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ ubicacion?: string }>;
}) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: prof } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const isAdmin = prof?.role === "admin";

  const { data: producto, error } = await supabase
    .from("inv_productos")
    .select("id, nombre, sku, barcode, unidad, stock_minimo, categoria_id, activo")
    .eq("id", id)
    .single();

  if (error || !producto) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/20 p-6">
        <div className="text-xl font-semibold">Producto no encontrado</div>
        <Link
          href="/dashboard/inventario/productos"
          className="mt-4 inline-block rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
        >
          Volver
        </Link>
      </div>
    );
  }

  const ubicacionId = (resolvedSearchParams?.ubicacion ?? "").trim() || null;

  const { data: categorias } = await supabase
    .from("inv_categorias")
    .select("id, nombre")
    .order("nombre", { ascending: true });

  const { data: ubicaciones } = await supabase
    .from("inv_ubicaciones")
    .select("id, nombre")
    .order("nombre", { ascending: true });

  const { data: stockRows } = await supabase
    .from("inv_stock")
    .select("stock, ubicacion_id, inv_ubicaciones(nombre)")
    .eq("producto_id", producto.id);

  const stockTotal = (stockRows ?? []).reduce(
    (acc: number, r: any) => acc + Number(r.stock ?? 0), 0
  );

  const stockFiltrado = ubicacionId
    ? (stockRows ?? [])
        .filter((r: any) => r.ubicacion_id === ubicacionId)
        .reduce((acc: number, r: any) => acc + Number(r.stock ?? 0), 0)
    : stockTotal;

  const min = Number(producto.stock_minimo ?? 0);
  const bajoMinimo = stockFiltrado <= min;

  const since = new Date();
  since.setDate(since.getDate() - 30);

  let movQ = supabase
    .from("inv_movimientos")
    .select("id, tipo, cantidad, fecha, nota, ubicacion_origen_id, ubicacion_destino_id")
    .eq("producto_id", producto.id)
    .gte("fecha", since.toISOString())
    .order("fecha", { ascending: true });

  if (ubicacionId) {
    movQ = movQ.or(
      `ubicacion_origen_id.eq.${ubicacionId},ubicacion_destino_id.eq.${ubicacionId}`
    );
  }

  const { data: movimientos30 } = await movQ;

  let movLastQ = supabase
    .from("inv_movimientos")
    .select("id, tipo, cantidad, fecha, nota, ubicacion_origen_id, ubicacion_destino_id")
    .eq("producto_id", producto.id)
    .order("fecha", { ascending: false })
    .limit(10);

  if (ubicacionId) {
    movLastQ = movLastQ.or(
      `ubicacion_origen_id.eq.${ubicacionId},ubicacion_destino_id.eq.${ubicacionId}`
    );
  }

  const { data: movimientosLast } = await movLastQ;

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <BackButton />
            <h1 className="text-2xl font-semibold">{producto.nombre}</h1>
          </div>
          <div className="text-sm text-white/60 mt-1">
            SKU: {producto.sku ?? "—"} | Barcode: {producto.barcode ?? "—"}
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/dashboard/inventario/productos/${producto.id}/export${ubicacionId ? `?ubicacion=${ubicacionId}` : ""}`}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
          >
            Exportar Excel (XLSX)
          </Link>
          <Link
            href="/dashboard/inventario/productos"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
          >
            Volver
          </Link>
        </div>
      </div>

      <LocationFilter ubicaciones={(ubicaciones ?? []) as any} />

      <div className="grid md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
          <div className="text-sm text-white/60">
            {ubicacionId ? "Stock (ubicacion)" : "Stock Total"}
          </div>
          <div className={`text-3xl font-semibold mt-2 ${bajoMinimo ? "text-amber-300" : ""}`}>
            {ubicacionId ? stockFiltrado : stockTotal}
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
          <div className="text-sm text-white/60">Stock minimo</div>
          <div className="text-3xl font-semibold mt-2">{min}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
          <div className="text-sm text-white/60">Estado</div>
          <div className="mt-2">
            {bajoMinimo ? (
              <span className="text-amber-300 font-semibold">Bajo minimo</span>
            ) : (
              <span className="text-emerald-300 font-semibold">Stock normal</span>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/20 p-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-lg font-semibold">Movimiento rapido</div>
            <div className="text-xs text-white/50 mt-1">
              Registra un movimiento sin salir del producto.
            </div>
          </div>
          <Link
            href="/dashboard/inventario/movimientos/nuevo"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
          >
            Ir a movimientos
          </Link>
        </div>

        <form action={quickMovimiento} className="mt-5 grid gap-4 md:grid-cols-4">
          <input type="hidden" name="producto_id" value={producto.id} />

          <label className="space-y-2">
            <div className="text-sm text-white/70">Tipo</div>
            <select
              name="tipo"
              defaultValue="entrada"
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm"
            >
              <option value="entrada">entrada</option>
              <option value="salida">salida</option>
              <option value="ajuste">ajuste</option>
              <option value="traslado">traslado</option>
            </select>
          </label>

          <label className="space-y-2">
            <div className="text-sm text-white/70">Cantidad</div>
            <input
              name="cantidad"
              type="number"
              min="0.0001"
              step="0.0001"
              required
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm"
              placeholder="Ej: 10"
            />
          </label>

          <label className="space-y-2">
            <div className="text-sm text-white/70">Origen</div>
            <select
              name="ubicacion_origen_id"
              defaultValue={ubicacionId ?? ""}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm"
            >
              <option value="">—</option>
              {(ubicaciones ?? []).map((u: any) => (
                <option key={u.id} value={u.id}>{u.nombre}</option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <div className="text-sm text-white/70">Destino</div>
            <select
              name="ubicacion_destino_id"
              defaultValue={ubicacionId ?? ""}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm"
            >
              <option value="">—</option>
              {(ubicaciones ?? []).map((u: any) => (
                <option key={u.id} value={u.id}>{u.nombre}</option>
              ))}
            </select>
          </label>

          <label className="space-y-2 md:col-span-3">
            <div className="text-sm text-white/70">Nota</div>
            <input
              name="nota"
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm"
              placeholder="Ej: compra, ajuste, consumo..."
            />
          </label>

          <div className="md:col-span-1 flex items-end justify-end">
            <button
              type="submit"
              className="w-full rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200 hover:bg-emerald-500/15"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>

      <MovementsChart movimientos={(movimientos30 ?? []) as any[]} />

      <div className="rounded-2xl border border-white/10 bg-black/20 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between gap-4">
          <div className="text-sm font-semibold">Ultimos movimientos</div>
        </div>
        {(movimientosLast ?? []).length === 0 ? (
          <div className="px-5 py-6 text-sm text-white/40">Sin movimientos registrados.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-white/50 text-xs">
                <th className="px-4 py-2 text-left">Fecha</th>
                <th className="px-4 py-2 text-left">Tipo</th>
                <th className="px-4 py-2 text-right">Cantidad</th>
                <th className="px-4 py-2 text-left">Nota</th>
              </tr>
            </thead>
            <tbody>
              {(movimientosLast ?? []).map((mv: any) => (
                <tr key={mv.id} className="border-t border-white/5">
                  <td className="px-4 py-2 text-white/60 tabular-nums">
                    {new Date(mv.fecha).toLocaleDateString("es-CL")}
                  </td>
                  <td className="px-4 py-2 capitalize">{mv.tipo}</td>
                  <td className="px-4 py-2 text-right tabular-nums font-medium">{mv.cantidad}</td>
                  <td className="px-4 py-2 text-white/50">{mv.nota ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isAdmin && (
        <EditProductoForm
          producto={producto as any}
          categorias={(categorias ?? []) as any}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
}
