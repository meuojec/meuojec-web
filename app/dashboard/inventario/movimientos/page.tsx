// app/dashboard/inventario/movimientos/page.tsx
export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

function fmtDateTime(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("es-CL", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type MovimientoRow = {
  id: string;
  fecha: string | null;
  tipo: string | null;
  cantidad: number | null;
  nota: string | null;
  producto?: { nombre: string | null } | null;
  origen?: { nombre: string | null } | null;
  destino?: { nombre: string | null } | null;
};

export default async function MovimientosPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("inv_movimientos")
    .select(
      `
      id,
      fecha,
      tipo,
      cantidad,
      nota,
      producto:inv_productos ( nombre ),
      origen:inv_ubicaciones!inv_movimientos_ubicacion_origen_id_fkey ( nombre ),
      destino:inv_ubicaciones!inv_movimientos_ubicacion_destino_id_fkey ( nombre )
    `
    )
    .order("fecha", { ascending: false })
    .limit(50);

  const rows = (data ?? []) as unknown as MovimientoRow[];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Movimientos</h1>
          <p className="mt-1 text-white/60">Entradas, salidas, ajustes y traslados.</p>
        </div>

        <div className="flex gap-2">
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
          {error ? `Error: ${error.message}` : `Mostrando: ${rows.length}`}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-white/5 text-white/70">
              <tr>
                <th className="px-5 py-3 text-left">Fecha</th>
                <th className="px-5 py-3 text-left">Tipo</th>
                <th className="px-5 py-3 text-left">Producto</th>
                <th className="px-5 py-3 text-right">Cantidad</th>
                <th className="px-5 py-3 text-left">Origen</th>
                <th className="px-5 py-3 text-left">Destino</th>
                <th className="px-5 py-3 text-left">Nota</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((m) => (
                <tr key={m.id} className="border-t border-white/10 hover:bg-white/5">
                  <td className="px-5 py-3 text-white/80">{fmtDateTime(m.fecha)}</td>

                  <td className="px-5 py-3">
                    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs">
                      {m.tipo ?? "—"}
                    </span>
                  </td>

                  <td className="px-5 py-3 font-medium">{m.producto?.nombre ?? "—"}</td>

                  <td className="px-5 py-3 text-right">{m.cantidad ?? 0}</td>

                  <td className="px-5 py-3 text-white/80">{m.origen?.nombre ?? "—"}</td>

                  <td className="px-5 py-3 text-white/80">{m.destino?.nombre ?? "—"}</td>

                  <td className="px-5 py-3 text-white/70">{m.nota ?? "—"}</td>
                </tr>
              ))}

              {rows.length === 0 ? (
                <tr>
                  <td className="px-5 py-6 text-white/60" colSpan={7}>
                    No hay movimientos aún.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}