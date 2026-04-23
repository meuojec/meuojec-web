"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Option = { value: string; label: string };

export default function FilterBar({ eventos, deds }: { eventos: Option[]; deds: Option[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const fecha = sp.get("fecha") && /^\d{4}-\d{2}-\d{2}$/.test(sp.get("fecha")!)
    ? sp.get("fecha")!
    : today;

  const evento = sp.get("evento") ?? "";
  const ded = sp.get("ded") ?? "";
  const q = sp.get("q") ?? "";

  const [localQ, setLocalQ] = useState(q);

  const apply = (patch: Record<string, string>) => {
    const params = new URLSearchParams(sp.toString());
    Object.entries(patch).forEach(([k, v]) => {
      if (!v) params.delete(k);
      else params.set(k, v);
    });
    if (!params.get("fecha")) params.set("fecha", fecha);

    router.push(`${pathname}?${params.toString()}`);
    router.refresh();
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-12 md:items-end">
        <div className="md:col-span-3">
          <label className="block text-xs text-white/70 mb-1">Fecha</label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => apply({ fecha: e.target.value })}
            className="w-full rounded-lg border border-white/10 bg-black/30 p-2 text-white"
          />
          <button
            onClick={() => apply({ fecha: today })}
            className="mt-2 text-xs text-white/70 hover:text-white underline"
          >
            Ir a hoy
          </button>
        </div>

        <div className="md:col-span-4">
          <label className="block text-xs text-white/70 mb-1">Evento</label>
          <select
            value={evento}
            onChange={(e) => apply({ evento: e.target.value })}
            className="w-full rounded-lg border border-white/10 bg-black/30 p-2 text-white"
          >
            <option value="">Todos</option>
            {eventos.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-3">
          <label className="block text-xs text-white/70 mb-1">DED</label>
          <select
            value={ded}
            onChange={(e) => apply({ ded: e.target.value })}
            className="w-full rounded-lg border border-white/10 bg-black/30 p-2 text-white"
          >
            <option value="">Todas</option>
            {deds.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs text-white/70 mb-1">Buscar</label>
          <input
            value={localQ}
            onChange={(e) => setLocalQ(e.target.value)}
            placeholder="RUT o nombre…"
            className="w-full rounded-lg border border-white/10 bg-black/30 p-2 text-white"
          />

          <div className="mt-2 flex gap-2">
            <button
              onClick={() => apply({ q: localQ })}
              className="flex-1 rounded-lg bg-white text-black px-3 py-2 text-sm font-semibold hover:bg-gray-100"
            >
              Aplicar
            </button>
            <button
              onClick={() => {
                setLocalQ("");
                router.push(`${pathname}?fecha=${fecha}`);
                router.refresh();
              }}
              className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white hover:bg-black/40"
            >
              Limpiar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}