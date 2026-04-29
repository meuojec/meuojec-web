"use client";

import { useTransition } from "react";
import { exportTransacciones } from "../actions";

type Props = {
  tipo?: string;
  cuenta?: string;
  categoria?: string;
  desde?: string;
  hasta?: string;
  q?: string;
  filename?: string;
};

function toCSV(rows: Array<Record<string, unknown>>) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const esc = (v: unknown) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    return s.includes('"') || s.includes(",") || s.includes("\n")
      ? `"${s.replaceAll('"', '""')}"`
      : s;
  };
  return [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => esc(r[h])).join(",")),
  ].join("\n");
}

export default function ExportTransaccionesButton({
  tipo, cuenta, categoria, desde, hasta, q, filename,
}: Props) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const res = await exportTransacciones({ tipo, cuenta, categoria, desde, hasta, q });
      if (!res.ok) {
        alert("Error al exportar: " + res.error);
        return;
      }
      if (!res.rows.length) {
        alert("No hay datos para exportar con los filtros actuales.");
        return;
      }
      const csv = toCSV(res.rows as Array<Record<string, unknown>>);
      const bom = "﻿"; // BOM para UTF-8 (Excel lo lee bien)
      const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename ?? `transacciones_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={handleClick}
      className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10 disabled:opacity-50 transition"
    >
      {isPending ? (
        <>
          <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Exportando…
        </>
      ) : (
        <>⬇ Exportar CSV</>
      )}
    </button>
  );
}
