"use client";

import Link from "next/link";

export type RegistroRow = {
  id: string; // created_at (string)
  rut: string;
  nombre: string;
  ded: string | null;
  sexo: string | null;
  hora: string | null; // HH:mm
  fecha?: string | null; // opcional si ya lo agregaste
  evento?: string | null; // opcional si ya lo agregaste
};

export default function RegistrosTable({ rows, onDelete, busyId }: { rows: RegistroRow[]; onDelete?: (row: RegistroRow) => Promise<void>; busyId?: string | null }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 overflow-hidden">
      <div className="overflow-auto">
        <table className="min-w-[1100px] w-full text-sm">
          <thead className="bg-white/5 text-white/70">
            <tr className="text-left border-b border-white/10">
              <th className="px-4 py-3">Hora</th>
              <th className="px-4 py-3">RUT</th>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Clase</th>
              <th className="px-4 py-3">Sexo</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => {
              const href = `/dashboard/asistencias/reporte/${encodeURIComponent(
                row.id
              )}/editar?rut=${encodeURIComponent(
                row.rut
              )}&created_at=${encodeURIComponent(row.id)}`;

              return (
                <tr
                  key={`${row.rut}-${row.id}`}
                  className="border-t border-white/10 hover:bg-white/5 transition"
                >
                  <td className="px-4 py-3 tabular-nums">{row.hora ?? "—"}</td>
                  <td className="px-4 py-3 tabular-nums">{row.rut}</td>
                  <td className="px-4 py-3">{row.nombre}</td>
                  <td className="px-4 py-3">{row.ded ?? "—"}</td>
                  <td className="px-4 py-3">{row.sexo ?? "—"}</td>

                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link
                        href={href}
                        className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
                      >
                        Editar
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}

            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-white/60">
                  No hay registros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}