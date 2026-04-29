"use client";

import { useState } from "react";
import Link from "next/link";
import type { AsistenciaDataRow } from "./actions";
import RowActions from "./RowActions";

const PAGE_SIZE = 50;

function fmtFecha(f: string | null) {
  if (!f) return "—";
  const [y, m, d] = f.split("-");
  const meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  return `${d} ${meses[parseInt(m, 10) - 1]} ${y}`;
}

export default function TablaAsistencias({ rows }: { rows: AsistenciaDataRow[] }) {
  const [page, setPage] = useState(1);
  const total = rows.length;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const slice = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between gap-3">
        <div>
          <div className="font-semibold text-white">Registros</div>
          <div className="text-xs text-white/40 mt-0.5">
            {total} total{total !== 1 ? "es" : ""}
            {totalPages > 1 && ` — página ${page} de ${totalPages}`}
          </div>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              disabled={page === 1}
              onClick={() => setPage(1)}
              className="rounded px-2 py-1 text-xs text-white/50 hover:text-white disabled:opacity-30"
            >
              «
            </button>
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded px-2 py-1 text-xs text-white/50 hover:text-white disabled:opacity-30"
            >
              ‹
            </button>
            <span className="text-xs text-white/50 px-1">
              {page} / {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded px-2 py-1 text-xs text-white/50 hover:text-white disabled:opacity-30"
            >
              ›
            </button>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(totalPages)}
              className="rounded px-2 py-1 text-xs text-white/50 hover:text-white disabled:opacity-30"
            >
              »
            </button>
          </div>
        )}
      </div>

      {/* Tabla */}
      <div className="overflow-auto">
        <table className="min-w-[900px] w-full text-sm">
          <thead className="bg-black/30 text-white/50 sticky top-0 z-10">
            <tr className="border-b border-white/10">
              <th className="text-left font-medium px-4 py-3 w-10">#</th>
              <th className="text-left font-medium px-4 py-3">RUT</th>
              <th className="text-left font-medium px-4 py-3">Nombre</th>
              <th className="text-left font-medium px-4 py-3">Fecha</th>
              <th className="text-left font-medium px-4 py-3">Hora</th>
              <th className="text-left font-medium px-4 py-3">Sesión</th>
              <th className="text-left font-medium px-4 py-3">DED</th>
              <th className="text-left font-medium px-4 py-3">Sexo</th>
              <th className="text-left font-medium px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {slice.map((r, i) => (
              <tr key={`${r.rut}-${r.created_at}-${i}`} className="hover:bg-white/[0.03]">
                <td className="px-4 py-3 text-white/25 text-xs tabular-nums">
                  {(page - 1) * PAGE_SIZE + i + 1}
                </td>
                <td className="px-4 py-3 text-white/60 text-xs tabular-nums">
                  {r.rut ? (
                    <Link
                      href={`/dashboard/miembros/${encodeURIComponent(r.rut)}`}
                      className="hover:text-white underline-offset-2 hover:underline"
                    >
                      {r.rut}
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3 text-white/90 font-medium">
                  {r.nombre || "—"}
                </td>
                <td className="px-4 py-3 text-white/70 tabular-nums text-xs">
                  {fmtFecha(r.fecha)}
                </td>
                <td className="px-4 py-3 text-white/50 tabular-nums text-xs">
                  {r.hora ?? "—"}
                </td>
                <td className="px-4 py-3 text-white/70 text-xs">
                  {r.sesion_id ? (
                    <Link
                      href={`/dashboard/asistencias/sesiones/${encodeURIComponent(r.sesion_id)}`}
                      className="hover:text-white underline-offset-2 hover:underline"
                    >
                      {r.sesion ?? r.sesion_id.slice(0, 8)}
                    </Link>
                  ) : (
                    r.sesion ?? r.evento ?? "—"
                  )}
                </td>
                <td className="px-4 py-3 text-white/60 text-xs">{r.ded ?? "—"}</td>
                <td className="px-4 py-3 text-white/40 text-xs">{r.sexo ?? "—"}</td>
                <td className="px-4 py-3">
                  {r.created_at ? (
                    <RowActions
                      rut={r.rut}
                      created_at={r.created_at}
                      nombre={r.nombre}
                      ded={r.ded}
                      hora={r.hora}
                    />
                  ) : null}
                </td>
              </tr>
            ))}
            {slice.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-white/30">
                  No hay registros con los filtros aplicados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer paginación */}
      {totalPages > 1 && (
        <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between text-xs text-white/40">
          <span>
            Mostrando {(page - 1) * PAGE_SIZE + 1}–
            {Math.min(page * PAGE_SIZE, total)} de {total}
          </span>
          <div className="flex gap-1">
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const p = i + 1;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={[
                    "rounded px-2 py-1",
                    p === page
                      ? "bg-white/15 text-white"
                      : "hover:bg-white/5 text-white/50",
                  ].join(" ")}
                >
                  {p}
                </button>
              );
            })}
            {totalPages > 7 && (
              <span className="px-2 py-1 text-white/30">…{totalPages}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
