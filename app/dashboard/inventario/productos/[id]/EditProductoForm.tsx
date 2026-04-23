"use client";

import { useMemo, useState, useTransition } from "react";
import {
  deleteProductoIfNoMovimientos,
  toggleProductoActivo,
  updateProducto,
} from "./actions";

type Categoria = { id: string; nombre: string | null };

type Producto = {
  id: string;
  nombre: string | null;
  sku: string | null;
  barcode: string | null;
  unidad: string | null;
  stock_minimo: number | null;
  categoria_id: string | null;
  activo: boolean | null;
};

export default function EditProductoForm({
  producto,
  categorias,
  isAdmin,
}: {
  producto: Producto;
  categorias: Categoria[];
  isAdmin: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string>("");

  const activo = !!producto.activo;

  const defaults = useMemo(
    () => ({
      id: producto.id,
      nombre: producto.nombre ?? "",
      sku: producto.sku ?? "",
      barcode: producto.barcode ?? "",
      unidad: producto.unidad ?? "unidad",
      stock_minimo: String(producto.stock_minimo ?? 0),
      categoria_id: producto.categoria_id ?? "",
    }),
    [producto]
  );

  return (
    <div className="space-y-6">
      {/* Estado */}
      <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm text-white/60">Estado</div>
            <div className="mt-1">
              {activo ? (
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-200">
                  Activo
                </span>
              ) : (
                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/60">
                  Inactivo
                </span>
              )}
            </div>
            <div className="mt-2 text-xs text-white/45">
              Desactivar mantiene historial y evita que aparezca para nuevos movimientos.
            </div>
          </div>

          <div className="flex gap-2">
            <button
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  setMsg("");
                  try {
                    await toggleProductoActivo(producto.id, !activo);
                  } catch (e: any) {
                    setMsg(e?.message ?? "Error");
                  }
                })
              }
              className={[
                "rounded-xl border px-4 py-2 text-sm transition",
                activo
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-200 hover:bg-amber-500/15"
                  : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/15",
                pending ? "opacity-60 cursor-not-allowed" : "",
              ].join(" ")}
            >
              {activo ? "Desactivar" : "Activar"}
            </button>

            {isAdmin ? (
              <button
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    setMsg("");
                    const ok = confirm(
                      "¿Eliminar producto?\n\nSolo se eliminará si NO tiene movimientos.\nSi tiene movimientos, usa 'Desactivar'."
                    );
                    if (!ok) return;

                    try {
                      await deleteProductoIfNoMovimientos(producto.id);
                    } catch (e: any) {
                      setMsg(e?.message ?? "Error");
                    }
                  })
                }
                className={[
                  "rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-200 hover:bg-red-500/15 transition",
                  pending ? "opacity-60 cursor-not-allowed" : "",
                ].join(" ")}
              >
                Eliminar
              </button>
            ) : null}
          </div>
        </div>

        {msg ? (
          <div className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
            {msg}
          </div>
        ) : null}
      </div>

      {/* Form */}
      <form
        action={(fd) =>
          startTransition(async () => {
            setMsg("");
            try {
              await updateProducto(fd);
            } catch (e: any) {
              setMsg(e?.message ?? "Error");
            }
          })
        }
        className="rounded-2xl border border-white/10 bg-black/20 p-6 space-y-6"
      >
        <input type="hidden" name="id" value={defaults.id} />

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <div className="text-sm text-white/70">Nombre *</div>
            <input
              name="nombre"
              defaultValue={defaults.nombre}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2"
              required
            />
          </label>

          <label className="space-y-2">
            <div className="text-sm text-white/70">Unidad *</div>
            <input
              name="unidad"
              defaultValue={defaults.unidad}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2"
              required
            />
          </label>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-5 space-y-4">
          <div>
            <div className="text-sm font-semibold">Identificación</div>
            <div className="text-xs text-white/50 mt-1">
              Pro: SKU (interno) + Barcode (escaneo). Debes tener al menos uno.
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <div className="text-sm text-white/70">SKU</div>
              <input
                name="sku"
                defaultValue={defaults.sku}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2"
              />
            </label>

            <label className="space-y-2">
              <div className="text-sm text-white/70">Barcode</div>
              <input
                name="barcode"
                defaultValue={defaults.barcode}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2"
              />
            </label>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <div className="text-sm text-white/70">Categoría</div>
            <select
              name="categoria_id"
              defaultValue={defaults.categoria_id}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2"
            >
              <option value="">—</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre ?? "—"}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <div className="text-sm text-white/70">Stock mínimo</div>
            <input
              name="stock_minimo"
              type="number"
              min={0}
              defaultValue={defaults.stock_minimo}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2"
            />
            <div className="text-xs text-white/45">Se usa para alertas de bajo stock.</div>
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="submit"
            disabled={pending}
            className={[
              "rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200 hover:bg-emerald-500/15",
              pending ? "opacity-60 cursor-not-allowed" : "",
            ].join(" ")}
          >
            Guardar cambios
          </button>
        </div>
      </form>
    </div>
  );
}