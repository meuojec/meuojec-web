"use client";

import { useState, useTransition } from "react";
import { deleteAsistenciaByCreatedAt, updateAsistencia } from "./actions";

type Props = {
  rut: string;
  created_at: string;
  nombre: string;
  ded: string | null;
  hora: string | null;
};

export default function RowActions({ rut, created_at, nombre, ded, hora }: Props) {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(`¿Eliminar asistencia de ${nombre || rut}?`)) return;
    startTransition(async () => {
      const res = await deleteAsistenciaByCreatedAt({ rut, created_at });
      setMsg({ text: res.ok ? "Eliminado ✓" : (res.error ?? "Error"), ok: res.ok ?? false });
    });
  }

  function handleEdit(fd: FormData) {
    const newDed = fd.get("ded") as string | null;
    const newHora = fd.get("hora") as string | null;
    startTransition(async () => {
      const res = await updateAsistencia({
        rut,
        created_at,
        ded: newDed || null,
        hora: newHora || null,
      });
      if (res.ok) {
        setOpen(false);
        setMsg(null);
      } else {
        setMsg({ text: res.error ?? "Error al guardar", ok: false });
      }
    });
  }

  return (
    <div className="relative flex items-center gap-1.5">
      {/* Editar */}
      <button
        type="button"
        onClick={() => { setMsg(null); setOpen((v) => !v); }}
        className="rounded border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/70 hover:bg-white/10 hover:text-white transition"
      >
        Editar
      </button>

      {/* Eliminar */}
      <button
        type="button"
        disabled={isPending}
        onClick={handleDelete}
        className="rounded border border-red-500/25 bg-red-500/8 px-2.5 py-1 text-xs text-red-300 hover:bg-red-500/20 disabled:opacity-40 transition"
      >
        {isPending ? "…" : "Eliminar"}
      </button>

      {msg && !open && (
        <span className={`text-xs ${msg.ok ? "text-emerald-400" : "text-red-400"}`}>
          {msg.text}
        </span>
      )}

      {/* Panel de edición */}
      {open && (
        <div className="absolute right-0 top-8 z-50 w-72 rounded-xl border border-white/15 bg-zinc-900 shadow-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold text-white">Editar asistencia</div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-white/40 hover:text-white text-lg leading-none"
            >
              ×
            </button>
          </div>

          <div className="text-xs text-white/50 mb-4">{nombre || rut} · {rut}</div>

          <form action={handleEdit} className="space-y-3">
            <div>
              <label className="block text-xs text-white/60 mb-1">Hora (HH:MM)</label>
              <input
                name="hora"
                type="time"
                defaultValue={hora ?? ""}
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30"
              />
            </div>

            <div>
              <label className="block text-xs text-white/60 mb-1">DED</label>
              <input
                name="ded"
                defaultValue={ded ?? ""}
                placeholder="Sin DED"
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/30"
              />
            </div>

            {msg && (
              <div className={`text-xs ${msg.ok ? "text-emerald-400" : "text-red-400"}`}>
                {msg.text}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-gray-100 disabled:opacity-50 transition"
              >
                {isPending ? "Guardando…" : "Guardar"}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/70 hover:bg-black/50 transition"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
