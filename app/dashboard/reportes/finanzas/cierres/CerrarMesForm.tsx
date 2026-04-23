"use client";

import { useState, useTransition } from "react";
import { cerrarMes } from "./actions";

export default function CerrarMesForm({ defaultMes }: { defaultMes: string }) {
  const [mes, setMes] = useState(defaultMes);
  const [nota, setNota] = useState("");
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string>("");

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
      <div className="text-lg font-bold text-white">Cerrar mes</div>
      <p className="mt-1 text-sm text-white/70">
        Genera un cierre mensual (snapshot) y evita modificaciones futuras para ese periodo.
      </p>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="space-y-1">
          <div className="text-xs text-white/60">Mes (YYYY-MM)</div>
          <input
            value={mes}
            onChange={(e) => setMes(e.target.value)}
            placeholder="2026-02"
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30"
          />
        </div>

        <div className="md:col-span-2 space-y-1">
          <div className="text-xs text-white/60">Nota (opcional)</div>
          <input
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="Ej: Cierre oficial tesorería"
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30"
          />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            setMsg("");
            startTransition(async () => {
              try {
                await cerrarMes({ mes, nota });
                setMsg("✅ Mes cerrado (o ya estaba cerrado). Actualiza la página para ver el registro.");
              } catch (e: any) {
                setMsg(`❌ Error: ${e?.message || "No se pudo cerrar el mes"}`);
              }
            });
          }}
          className={[
            "rounded-xl px-4 py-2 text-sm font-semibold transition",
            isPending
              ? "border border-white/10 bg-white/5 text-white/50 cursor-not-allowed"
              : "border border-emerald-500/30 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/15",
          ].join(" ")}
        >
          {isPending ? "Cerrando..." : "Cerrar mes"}
        </button>

        {msg ? <div className="text-sm text-white/70">{msg}</div> : null}
      </div>
    </div>
  );
}