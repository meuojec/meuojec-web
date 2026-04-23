"use client";

import { useState } from "react";
import { updateAsistenciaByRutCreatedAt } from "./actions";

type Initial = {
  rut: string;
  created_at: string;
  fecha: string;
  hora: string; // HH:mm
  ded: string;
  id_evento: string; // puede ser ""
  evento_sesion_id: string; // puede ser ""
};

export default function EditAsistenciaForm({ initial }: { initial: Initial }) {
  const [fecha, setFecha] = useState(initial.fecha);
  const [hora, setHora] = useState(initial.hora);
  const [ded, setDed] = useState(initial.ded);
  const [idEvento, setIdEvento] = useState(initial.id_evento);
  const [sesionId, setSesionId] = useState(initial.evento_sesion_id);

  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState<string>("");
  const [err, setErr] = useState<string>("");

  async function onSave() {
    setSaving(true);
    setOk("");
    setErr("");

    try {
      await updateAsistenciaByRutCreatedAt({
        rut: initial.rut,
        created_at: initial.created_at,
        fecha,
        hora,
        ded,
        id_evento: idEvento,
        evento_sesion_id: sesionId,
      });
      setOk("Guardado ✅");
    } catch (e: any) {
      setErr(e?.message ?? "Error guardando");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-white">
      <div className="text-lg font-semibold mb-3">Modificar datos</div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="block">
          <div className="text-xs text-white/60 mb-1">Fecha</div>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-white/20"
          />
        </label>

        <label className="block">
          <div className="text-xs text-white/60 mb-1">Hora (HH:mm)</div>
          <input
            type="time"
            value={hora}
            onChange={(e) => setHora(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-white/20"
          />
        </label>

        <label className="block">
          <div className="text-xs text-white/60 mb-1">Clase (DED)</div>
          <input
            value={ded}
            onChange={(e) => setDed(e.target.value)}
            placeholder="Ej: Varones, Jóvenes..."
            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-white/20"
          />
        </label>

        <label className="block">
          <div className="text-xs text-white/60 mb-1">ID Evento (001)</div>
          <input
            value={idEvento}
            onChange={(e) => setIdEvento(e.target.value)}
            placeholder="Ej: 001"
            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-white/20"
          />
        </label>

        <label className="block md:col-span-2">
          <div className="text-xs text-white/60 mb-1">Evento sesión ID (UUID)</div>
          <input
            value={sesionId}
            onChange={(e) => setSesionId(e.target.value)}
            placeholder="UUID de eventos_sesiones.id (si aplica)"
            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-white/20"
          />
        </label>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className={[
            "rounded-xl border px-4 py-2 text-sm font-semibold",
            saving
              ? "border-white/10 bg-white/5 text-white/40 cursor-not-allowed"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20",
          ].join(" ")}
        >
          {saving ? "Guardando…" : "Guardar cambios"}
        </button>

        {ok && <div className="text-sm text-emerald-200">{ok}</div>}
        {err && <div className="text-sm text-red-200">{err}</div>}
      </div>
    </div>
  );
}