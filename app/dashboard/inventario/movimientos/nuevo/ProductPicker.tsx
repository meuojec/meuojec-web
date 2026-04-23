"use client";

import { useMemo, useState } from "react";

type P = {
  id: string;
  nombre: string | null;
  sku: string | null;
  barcode: string | null;
};

export default function ProductPicker({ productos }: { productos: P[] }) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");

  const list = useMemo(() => productos ?? [], [productos]);

  function normalize(s: string) {
    return (s || "").trim().toLowerCase();
  }

  function findByCode(codeRaw: string) {
    const code = normalize(codeRaw);
    if (!code) return null;
    return (
      list.find((p) => normalize(p.barcode ?? "") === code) ||
      list.find((p) => normalize(p.sku ?? "") === code) ||
      null
    );
  }

  function onScanSubmit() {
    const hit = findByCode(query);
    if (hit) {
      setSelectedId(hit.id);
      setQuery("");
      return;
    }
    alert("No se encontró producto con ese SKU/Barcode.");
  }

  const filtered = useMemo(() => {
    const q = normalize(query);
    if (!q) return list;
    return list.filter((p) => {
      const n = normalize(p.nombre ?? "");
      const sku = normalize(p.sku ?? "");
      const bc = normalize(p.barcode ?? "");
      return n.includes(q) || sku.includes(q) || bc.includes(q);
    });
  }, [list, query]);

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="text-sm font-semibold">Producto</div>
        <div className="text-xs text-white/50 mt-1">
          Puedes escanear (lector USB) o escribir y presionar Enter.
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <div className="text-sm text-white/70">Escanear / Buscar</div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onScanSubmit();
                }
              }}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2"
              placeholder="Escanea barcode o escribe SKU/nombre…"
            />
          </div>

          <div className="space-y-2">
            <div className="text-sm text-white/70">Seleccionar</div>

            {/* Hidden input real para el server action */}
            <input type="hidden" name="producto_id" value={selectedId} />

            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2"
              required
            >
              <option value="">Selecciona…</option>
              {filtered.map((p) => (
                <option key={p.id} value={p.id}>
                  {(p.sku ? `[${p.sku}] ` : "") + (p.nombre ?? "—")}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedId ? (
          <div className="mt-3 text-xs text-white/60">
            ✅ Producto seleccionado. Puedes guardar el movimiento.
          </div>
        ) : null}
      </div>
    </div>
  );
}