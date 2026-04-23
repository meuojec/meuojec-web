"use client";

import { useState } from "react";
import { deleteAsistenciaByCreatedAt } from "./actions";

type Props = {
  id_asistencia: string;
  rut: string | null;
  nombres: string | null;
  apellidos: string | null;
  ded: string | null;
  sexo: string | null;
  evento_nombre: string | null;
};

export default function RowActions(p: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <div className="relative flex items-center gap-2">
      <button
        type="button"
        onClick={() => {
          setMsg(null);
          setOpen((v) => !v);
        }}
        className="rounded-md border border-white/10 bg-black/30 px-3 py-1 text-xs text-white hover:bg-black/40"
      >
        Editar
      </button>

      <form
        action={async (fd) => {
          const okConfirm = confirm(
            `¿Eliminar asistencia de ${p.rut ?? ""} ${p.nombres ?? ""} ${p.apellidos ?? ""}?`
          );
          if (!okConfirm) return;

          setBusy(true);
          setMsg(null);
          const res = await deleteAsistenciaByCreatedAt({ rut: String(fd.get("rut") ?? p.rut ?? ""), created_at: String(fd.get("id_asistencia") ?? p.id_asistencia ?? "") });
          setBusy(false);
          setMsg(res.ok ? "Eliminado ✅" : res.error ?? "Error");
        }}
      >
        <input type="hidden" name="id_asistencia" value={p.id_asistencia} />
        <button
          type="submit"
          disabled={busy}
          className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs text-red-200 hover:bg-red-500/20 disabled:opacity-50"
        >
          Eliminar
        </button>
      </form>

      {open ? (
        <div className="absolute right-0 top-8 z-50 w-[360px] rounded-xl border border-white/10 bg-black/90 p-3 shadow-xl">
          <div className="text-sm font-semibold mb-2">Editar asistencia</div>

          <div className="text-xs text-white/60 mb-3">
            {p.rut} · {p.nombres} {p.apellidos}
          </div>

          <form
            action={async (fd) => {
              setBusy(true);
              setMsg(null);
              const res = await deleteAsistenciaByCreatedAt({ rut: String(fd.get("rut") ?? p.rut ?? ""), created_at: String(fd.get("id_asistencia") ?? p.id_asistencia ?? "") });
              setBusy(false);

              if (res.ok) {
                setOpen(false);
                setMsg(null);
              } else {
                setMsg(res.error ?? "Error");
              }
            }}
            className="space-y-2"
          >
            <input type="hidden" name="id_asistencia" value={p.id_asistencia} />

            <label className="block text-xs text-white/70">Evento</label>
            <input
              name="evento_nombre"
              defaultValue={p.evento_nombre ?? ""}
              className="w-full rounded-lg border border-white/10 bg-black/30 p-2 text-white text-sm"
            />

            <label className="block text-xs text-white/70">DED</label>
            <input
              name="ded"
              defaultValue={p.ded ?? ""}
              className="w-full rounded-lg border border-white/10 bg-black/30 p-2 text-white text-sm"
            />

            <label className="block text-xs text-white/70">Sexo</label>
            <select
              name="sexo"
              defaultValue={p.sexo ?? ""}
              className="w-full rounded-lg border border-white/10 bg-black/30 p-2 text-white text-sm"
            >
              <option value="">(Sin definir)</option>
              <option value="Masculino">Masculino</option>
              <option value="Femenino">Femenino</option>
            </select>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={busy}
                className="flex-1 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-gray-100 disabled:opacity-50"
              >
                Guardar
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white hover:bg-black/40"
              >
                Cancelar
              </button>
            </div>
          </form>

          {msg ? <div className="mt-2 text-xs text-white/70">{msg}</div> : null}
        </div>
      ) : null}
    </div>
  );
}