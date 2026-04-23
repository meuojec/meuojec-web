// app/dashboard/reportes/_components/ReportFilters.tsx
"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

function isoTodayCL() {
  const d = new Date();
  // Nota: en el server usarás timezone del server; acá el navegador del usuario manda.
  return d.toISOString().slice(0, 10);
}

function monthStartISO() {
  const d = new Date();
  const first = new Date(d.getFullYear(), d.getMonth(), 1);
  return first.toISOString().slice(0, 10);
}

export default function ReportFilters({
  showDed,
  showEvento,
  showSesion,
}: {
  showDed?: boolean;
  showEvento?: boolean;
  showSesion?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const initialFrom = sp.get("from") || monthStartISO();
  const initialTo = sp.get("to") || isoTodayCL();

  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);

  const [ded, setDed] = useState(sp.get("ded") || "");
  const [evento, setEvento] = useState(sp.get("evento") || "");
  const [sesion, setSesion] = useState(sp.get("sesion") || "");

  const canApply = useMemo(() => {
    if (!from || !to) return false;
    return from <= to;
  }, [from, to]);

  function apply() {
    const q = new URLSearchParams();
    q.set("from", from);
    q.set("to", to);
    if (showDed && ded) q.set("ded", ded);
    if (showEvento && evento) q.set("evento", evento);
    if (showSesion && sesion) q.set("sesion", sesion);
    router.push(`${pathname}?${q.toString()}`);
  }

  function reset() {
    const q = new URLSearchParams();
    q.set("from", monthStartISO());
    q.set("to", isoTodayCL());
    router.push(`${pathname}?${q.toString()}`);
  }

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div className="grid gap-3 md:grid-cols-5">
        <div className="space-y-1">
          <div className="text-xs text-white/60">Desde</div>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
          />
        </div>

        <div className="space-y-1">
          <div className="text-xs text-white/60">Hasta</div>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
          />
        </div>

        {showDed ? (
          <div className="space-y-1">
            <div className="text-xs text-white/60">DED (opcional)</div>
            <input
              value={ded}
              onChange={(e) => setDed(e.target.value)}
              placeholder="Ej: Jóvenes"
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30"
            />
          </div>
        ) : null}

        {showEvento ? (
          <div className="space-y-1">
            <div className="text-xs text-white/60">Evento (opcional)</div>
            <input
              value={evento}
              onChange={(e) => setEvento(e.target.value)}
              placeholder="id_evento o uuid"
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30"
            />
          </div>
        ) : null}

        {showSesion ? (
          <div className="space-y-1">
            <div className="text-xs text-white/60">Sesión (opcional)</div>
            <input
              value={sesion}
              onChange={(e) => setSesion(e.target.value)}
              placeholder="uuid sesión"
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30"
            />
          </div>
        ) : null}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={reset}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/10"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={apply}
          disabled={!canApply}
          className={[
            "rounded-xl px-4 py-2 text-sm font-semibold",
            canApply
              ? "bg-emerald-500/15 text-emerald-200 border border-emerald-500/30 hover:bg-emerald-500/20"
              : "bg-white/5 text-white/40 border border-white/10 cursor-not-allowed",
          ].join(" ")}
        >
          Aplicar
        </button>
      </div>
    </div>
  );
}