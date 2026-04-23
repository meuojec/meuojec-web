"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Cuenta = { id: string; nombre: string | null };
type Categoria = { id: string; nombre: string | null; tipo: string | null };

type Props = {
  cuentas: Cuenta[];
  categorias: Categoria[];
};

export default function FiltrosTransacciones({ cuentas, categorias }: Props) {
  const router = useRouter();
  const sp = useSearchParams();

  const [tipo, setTipo] = useState((sp.get("tipo") ?? "TODOS").toUpperCase());
  const [cuenta, setCuenta] = useState(sp.get("cuenta") ?? "");
  const [categoria, setCategoria] = useState(sp.get("categoria") ?? "");
  const [desde, setDesde] = useState(sp.get("desde") ?? "");
  const [hasta, setHasta] = useState(sp.get("hasta") ?? "");
  const [q, setQ] = useState(sp.get("q") ?? "");

  const categoriasFiltradas = useMemo(() => {
    if (tipo === "INGRESO") return categorias.filter(c => (c.tipo ?? "").toUpperCase() === "INGRESO");
    if (tipo === "EGRESO") return categorias.filter(c => (c.tipo ?? "").toUpperCase() === "EGRESO");
    if (tipo === "TRANSFERENCIA") return [];
    return categorias;
  }, [tipo, categorias]);

  function go(params: Record<string, string>) {
    const next = new URLSearchParams(sp.toString());
    // reset page
    next.set("page", "1");
    Object.entries(params).forEach(([k, v]) => {
      if (!v) next.delete(k);
      else next.set(k, v);
    });
    router.push(`/dashboard/finanzas/transacciones?${next.toString()}`);
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4 space-y-3">
      <div className="grid gap-3 lg:grid-cols-6">
        <div>
          <label className="block text-xs text-white/70 mb-1">Área</label>
          <select
            value="IGLESIA"
            disabled
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/70 opacity-70"
          >
            <option value="IGLESIA">IGLESIA</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-white/70 mb-1">Tipo</label>
          <select
            value={tipo}
            onChange={(e) => {
              const t = e.target.value.toUpperCase();
              setTipo(t);
              // si cambia tipo y categoría ya no aplica:
              if (t === "TRANSFERENCIA") setCategoria("");
            }}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-white/20"
          >
            <option value="TODOS">Todos</option>
            <option value="INGRESO">INGRESO</option>
            <option value="EGRESO">EGRESO</option>
            <option value="TRANSFERENCIA">TRANSFERENCIA</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-white/70 mb-1">Cuenta</label>
          <select
            value={cuenta}
            onChange={(e) => setCuenta(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-white/20"
          >
            <option value="">Todas</option>
            {cuentas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre ?? "—"}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-white/70 mb-1">Categoría</label>
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            disabled={tipo === "TRANSFERENCIA"}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-white/20 disabled:opacity-60"
          >
            <option value="">{tipo === "TRANSFERENCIA" ? "(No aplica)" : "Todas"}</option>
            {categoriasFiltradas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre ?? "—"}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-white/70 mb-1">Desde</label>
          <input
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-white/20"
          />
        </div>

        <div>
          <label className="block text-xs text-white/70 mb-1">Hasta</label>
          <input
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-white/20"
          />
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-6">
        <div className="lg:col-span-4">
          <label className="block text-xs text-white/70 mb-1">Buscar (ref/desc)</label>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ej: PRUEBA, arriendo..."
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-white/20"
          />
        </div>

        <div className="lg:col-span-1 flex items-end">
          <button
            type="button"
            onClick={() => go({ tipo, cuenta, categoria, desde, hasta, q })}
            className="w-full rounded-xl border border-white/10 bg-white text-black px-4 py-2 text-sm font-semibold hover:bg-white/90"
          >
            Filtrar
          </button>
        </div>

        <div className="lg:col-span-1 flex items-end">
          <button
            type="button"
            onClick={() => router.push("/dashboard/finanzas/transacciones")}
            className="w-full rounded-xl border border-white/10 bg-white/5 text-white px-4 py-2 text-sm font-semibold hover:bg-white/10"
          >
            Limpiar
          </button>
        </div>
      </div>
    </div>
  );
}
