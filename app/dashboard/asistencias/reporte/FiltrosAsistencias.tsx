"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

type Option = { value: string; label: string };

export default function FiltrosAsistencias({
  eventos,
  deds,
  total,
  exportBase,
}: {
  eventos: Option[];
  deds: Option[];
  total: number;
  exportBase: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState({
    from: sp.get("from") ?? "",
    to: sp.get("to") ?? "",
    q: sp.get("q") ?? "",
    ded: sp.get("ded") ?? "",
    evento: sp.get("evento") ?? "",
  });

  const set = (k: keyof typeof form, v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const apply = () => {
    const params = new URLSearchParams();
    Object.entries(form).forEach(([k, v]) => {
      if (v.trim()) params.set(k, v.trim());
    });
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const clear = () => {
    const empty = { from: "", to: "", q: "", ded: "", evento: "" };
    setForm(empty);
    startTransition(() => {
      router.push(pathname);
    });
  };

  const exportUrl = (fmt: string) => {
    const p = new URLSearchParams();
    Object.entries(form).forEach(([k, v]) => { if (v.trim()) p.set(k, v.trim()); });
    p.set("format", fmt);
    return `/api/asistencias/export?${p.toString()}`;
  };

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold text-white">Filtros</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/40">
            {total} resultado{total !== 1 ? "s" : ""}
          </span>
          {isPending && (
            <span className="text-xs text-white/40 animate-pulse">cargando…</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Desde */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-white/50">Desde</label>
          <input
            type="date"
            value={form.from}
            onChange={(e) => set("from", e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && apply()}
            className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-white/30"
          />
        </div>

        {/* Hasta */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-white/50">Hasta</label>
          <input
            type="date"
            value={form.to}
            onChange={(e) => set("to", e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && apply()}
            className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-white/30"
          />
        </div>

        {/* Búsqueda RUT / nombre */}
        <div className="flex flex-col gap-1 lg:col-span-1">
          <label className="text-xs text-white/50">RUT o Nombre</label>
          <input
            type="text"
            value={form.q}
            placeholder="12345678-9 o Juan…"
            onChange={(e) => set("q", e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && apply()}
            className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/25 outline-none focus:border-white/30"
          />
        </div>

        {/* Evento */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-white/50">Evento</label>
          <select
            value={form.evento}
            onChange={(e) => set("evento", e.target.value)}
            className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-white/30"
          >
            <option value="">Todos</option>
            {eventos.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* DED */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-white/50">DED</label>
          <select
            value={form.ded}
            onChange={(e) => set("ded", e.target.value)}
            className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-white/30"
          >
            <option value="">Todas</option>
            {deds.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* Acciones */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-white/50 invisible">Buscar</label>
          <div className="flex gap-2">
            <button
              onClick={apply}
              disabled={isPending}
              className="flex-1 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-white/90 disabled:opacity-50"
            >
              Buscar
            </button>
            <button
              onClick={clear}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 hover:bg-white/10"
              title="Limpiar filtros"
            >
              ✕
            </button>
          </div>
        </div>
      </div>

      {/* Export */}
      {total > 0 && (
        <div className="flex items-center gap-2 pt-1 border-t border-white/5">
          <span className="text-xs text-white/40">Exportar:</span>
          <a
            href={exportUrl("xlsx")}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 hover:bg-white/10"
          >
            ↓ Excel
          </a>
          <a
            href={exportUrl("csv")}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 hover:bg-white/10"
          >
            ↓ CSV
          </a>
        </div>
      )}
    </div>
  );
}
