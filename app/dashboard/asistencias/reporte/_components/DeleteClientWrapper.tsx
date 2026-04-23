"use client";

import { useMemo, useState } from "react";
import RegistrosTable from "./RegistrosTable";
import type { RegistroRow } from "./RegistrosTable";
import { deleteAsistenciaByCreatedAt } from "../actions";

export default function DeleteClientWrapper({ rows }: { rows: RegistroRow[] }) {
  const [items, setItems] = useState<RegistroRow[]>(rows);
  const [busy, setBusy] = useState<string | null>(null);

  const count = useMemo(() => items.length, [items]);

  async function onDelete(row: RegistroRow) {
    const ok = confirm(
      `¿Eliminar asistencia?\n\nRUT: ${row.rut}\nFecha: ${row.fecha ?? "—"}\nHora: ${
        row.hora ?? "—"
      }`
    );
    if (!ok) return;

    setBusy(row.id);
    try {
      await deleteAsistenciaByCreatedAt({
        rut: row.rut,
        created_at: row.id,
      });
      setItems((prev) => prev.filter((x) => !(x.rut === row.rut && x.id === row.id)));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-lg font-semibold text-white">Registros</div>
          <div className="text-xs text-white/60">{count} filas</div>
        </div>
        <div className="text-xs text-white/60">Scroll dentro del bloque</div>
      </div>

      <div className="mt-3">
        <RegistrosTable rows={items} onDelete={onDelete} busyId={busy} />
      </div>
    </div>
  );
}