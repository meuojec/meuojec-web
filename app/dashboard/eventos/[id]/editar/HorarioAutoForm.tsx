"use client";

import { useState, useTransition } from "react";
import { guardarHorarioAuto } from "../../actions";

const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

type Franja = { dia: number; hora_inicio: string; hora_fin: string };
type HorarioAuto = { activo: boolean; franjas: Franja[] };

type Props = {
  eventoId: string;
  nombreEvento: string;
  horarioActual: HorarioAuto | null;
};

export default function HorarioAutoForm({ eventoId, nombreEvento, horarioActual }: Props) {
  const [activo, setActivo] = useState(horarioActual?.activo ?? false);
  const [franjas, setFranjas] = useState<Franja[]>(
    horarioActual?.franjas ?? []
  );
  const [saved, setSaved] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function addFranja() {
    setFranjas((prev) => [...prev, { dia: 0, hora_inicio: "08:00", hora_fin: "10:00" }]);
  }

  function removeFranja(idx: number) {
    setFranjas((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateFranja(idx: number, field: keyof Franja, value: string | number) {
    setFranjas((prev) =>
      prev.map((f, i) => (i === idx ? { ...f, [field]: value } : f))
    );
  }

  function handleSave() {
    setSaved(false);
    setErrMsg(null);
    startTransition(async () => {
      const res = await guardarHorarioAuto(eventoId, { activo, franjas });
      if (res?.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setErrMsg(res?.error ?? "Error desconocido");
      }
    });
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-6 space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-white">Horario automático</h2>
        <p className="text-sm text-white/50 mt-1">
          Cuando está activo, el sistema activa este evento automáticamente en los días y horarios
          configurados. La activación manual siempre tiene prioridad.
        </p>
      </div>

      {/* Toggle general */}
      <label className="flex items-center gap-3 cursor-pointer select-none">
        <div
          onClick={() => setActivo((v) => !v)}
          className={[
            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
            activo ? "bg-emerald-500" : "bg-white/20",
          ].join(" ")}
        >
          <span
            className={[
              "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
              activo ? "translate-x-6" : "translate-x-1",
            ].join(" ")}
          />
        </div>
        <span className="text-sm text-white/80">
          {activo ? "Activación automática habilitada" : "Activación automática deshabilitada"}
        </span>
      </label>

      {/* Franjas horarias */}
      {activo && (
        <div className="space-y-3">
          <div className="text-sm font-medium text-white/70">Franjas horarias</div>

          {franjas.length === 0 && (
            <p className="text-sm text-white/40 italic">
              Sin franjas configuradas. Agrega al menos una.
            </p>
          )}

          {franjas.map((f, idx) => (
            <div
              key={idx}
              className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end rounded-xl border border-white/10 bg-white/5 px-4 py-3"
            >
              <div className="space-y-1">
                <label className="text-xs text-white/50">Día</label>
                <select
                  value={f.dia}
                  onChange={(e) => updateFranja(idx, "dia", Number(e.target.value))}
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-sm text-white"
                >
                  {DIAS.map((d, i) => (
                    <option key={i} value={i}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-white/50">Hora inicio</label>
                <input
                  type="time"
                  step="60"
                  value={f.hora_inicio}
                  onChange={(e) => updateFranja(idx, "hora_inicio", e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-sm text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-white/50">Hora fin</label>
                <input
                  type="time"
                  step="60"
                  value={f.hora_fin}
                  onChange={(e) => updateFranja(idx, "hora_fin", e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-sm text-white"
                />
              </div>

              <button
                type="button"
                onClick={() => removeFranja(idx)}
                className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/20 transition"
              >
                Quitar
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addFranja}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 hover:bg-white/10 transition"
          >
            + Agregar franja
          </button>
        </div>
      )}

      {/* Guardar */}
      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="rounded-xl border border-emerald-500/30 bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/20 transition disabled:opacity-50"
        >
          {isPending ? "Guardando..." : "Guardar horario"}
        </button>

        {saved && (
          <span className="text-sm text-emerald-400">✓ Guardado</span>
        )}
        {errMsg && (
          <span className="text-sm text-red-400">{errMsg}</span>
        )}
      </div>

      {/* Resumen legible */}
      {activo && franjas.length > 0 && (
        <div className="rounded-xl border border-white/5 bg-white/5 px-4 py-3 text-xs text-white/60 space-y-1">
          <div className="font-medium text-white/70 mb-1">Activación programada:</div>
          {franjas.map((f, i) => (
            <div key={i}>
              {DIAS[f.dia]}: {f.hora_inicio} – {f.hora_fin}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
