// app/dashboard/reportes/finanzas/FinanzasExtraFilters.tsx
"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function FinanzasExtraFilters({
  initialTipo,
  initialCuenta,
  initialCategoria,
}: {
  initialTipo: string;
  initialCuenta: string;
  initialCategoria: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const [tipo, setTipo] = useState(initialTipo || "");
  const [cuenta, setCuenta] = useState(initialCuenta || "");
  const [categoria, setCategoria] = useState(initialCategoria || "");

  function apply() {
    const q = new URLSearchParams(sp.toString());

    if (tipo) q.set("tipo", tipo);
    else q.delete("tipo");

    if (cuenta.trim()) q.set("cuenta", cuenta.trim());
    else q.delete("cuenta");

    if (categoria.trim()) q.set("categoria", categoria.trim());
    else q.delete("categoria");

    router.push(`${pathname}?${q.toString()}`);
  }

  function reset() {
    const q = new URLSearchParams(sp.toString());
    q.delete("tipo");
    q.delete("cuenta");
    q.delete("categoria");
    router.push(`${pathname}?${q.toString()}`);
  }

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div className="grid gap-3 md:grid-cols-3">
        <div className="space-y-1">
          <div className="text-xs text-white/60">Tipo</div>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
          >
            <option value="">Todos</option>
            <option value="INGRESO">Ingreso</option>
            <option value="EGRESO">Egreso</option>
          </select>
        </div>

        <div className="space-y-1">
          <div className="text-xs text-white/60">Cuenta (id)</div>
          <input
            value={cuenta}
            onChange={(e) => setCuenta(e.target.value)}
            placeholder="uuid cuenta"
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30"
          />
        </div>

        <div className="space-y-1">
          <div className="text-xs text-white/60">Categoría (id)</div>
          <input
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            placeholder="uuid categoría"
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={reset}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/10"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={apply}
          className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/15"
        >
          Aplicar
        </button>
      </div>
    </div>
  );
}