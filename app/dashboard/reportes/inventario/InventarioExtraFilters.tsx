"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

function buildQS(sp: URLSearchParams, patch: Record<string, string>) {
  const next = new URLSearchParams(sp.toString());
  for (const [k, v] of Object.entries(patch)) {
    if (!v) next.delete(k);
    else next.set(k, v);
  }
  next.delete("page");
  return next.toString();
}

export default function InventarioExtraFilters(props: {
  initialUbicacion?: string;
  initialProducto?: string;
}) {
  const router = useRouter();
  const sp = useSearchParams();

  const [ubicacion, setUbicacion] = useState(props.initialUbicacion ?? "");
  const [producto, setProducto] = useState(props.initialProducto ?? "");

  const qs = useMemo(() => sp?.toString() ?? "", [sp]);

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div>
        <div className="text-xs font-semibold text-white/60">Ubicación (ID)</div>
        <input
          value={ubicacion}
          onChange={(e) => setUbicacion(e.target.value)}
          placeholder="Ej: uuid ubicación"
          className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30"
        />
      </div>

      <div>
        <div className="text-xs font-semibold text-white/60">Producto (ID)</div>
        <input
          value={producto}
          onChange={(e) => setProducto(e.target.value)}
          placeholder="Ej: uuid producto (para kardex)"
          className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30"
        />
      </div>

      <div className="md:col-span-2 flex gap-2">
        <button
          onClick={() => {
            const next = buildQS(new URLSearchParams(qs), {
              ubicacion,
              producto,
            });
            router.push(`/dashboard/reportes/inventario?${next}`);
          }}
          className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15"
        >
          Aplicar
        </button>

        <button
          onClick={() => {
            setUbicacion("");
            setProducto("");
            const next = buildQS(new URLSearchParams(qs), { ubicacion: "", producto: "" });
            router.push(`/dashboard/reportes/inventario?${next}`);
          }}
          className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-sm font-semibold text-white/70 hover:bg-white/5 hover:text-white"
        >
          Limpiar
        </button>
      </div>
    </div>
  );
}