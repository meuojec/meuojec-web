"use client";

import { useMemo, useState } from "react";

function normalizeRut(input: string) {
  let s = (input || "").trim().toUpperCase();
  s = s.replace(/\s+/g, "").replace(/\./g, "");
  s = s.replace(/[^0-9K-]/g, "");
  if (!s.includes("-") && s.length >= 2) s = `${s.slice(0, -1)}-${s.slice(-1)}`;
  return s;
}

export default function CarnetsTools() {
  // Individual
  const [rut, setRut] = useState("");
  const rutNorm = useMemo(() => normalizeRut(rut), [rut]);
  const can = rutNorm.includes("-") && rutNorm.length >= 3;

  const carnetUrl = useMemo(() => {
    if (!can) return "";
    return `/api/miembros/${encodeURIComponent(rutNorm)}/carnet`;
  }, [can, rutNorm]);

  // Masivo
  const [ded, setDed] = useState("");
  const [limit, setLimit] = useState("200");
  const [soloConFoto, setSoloConFoto] = useState(false);

  const masivoUrl = useMemo(() => {
    const sp = new URLSearchParams();
    if (ded.trim()) sp.set("ded", ded.trim());
    sp.set("limit", String(Math.min(Math.max(parseInt(limit || "200", 10) || 200, 1), 500)));
    sp.set("foto", soloConFoto ? "1" : "0");
    return `/api/miembros/carnets?${sp.toString()}`;
  }, [ded, limit, soloConFoto]);

  const openUrl = (u: string) => {
    if (!u) return;
    window.open(u, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="grid gap-6 max-w-3xl">
      {/* Individual */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-lg font-semibold">Carnet individual</h2>
        <p className="text-white/60 text-sm mt-1">Genera el PDF del carnet por RUT.</p>

        <div className="mt-4 grid gap-3">
          <label className="text-xs text-white/70">RUT</label>
          <input
            value={rut}
            onChange={(e) => setRut(e.target.value)}
            placeholder="Ej: 25806136-5"
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-emerald-500/40"
          />

          <div className="text-xs text-white/60">
            Endpoint: <span className="text-white/80">{carnetUrl || "—"}</span>
          </div>

          <button
            type="button"
            onClick={() => openUrl(carnetUrl)}
            disabled={!can}
            className={[
              "rounded-xl px-4 py-2 text-sm font-semibold transition",
              can
                ? "bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 hover:bg-emerald-500/25"
                : "bg-white/5 text-white/40 border border-white/10 cursor-not-allowed",
            ].join(" ")}
          >
            Generar PDF
          </button>
        </div>
      </div>

      {/* Masivo */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-lg font-semibold">Carnets masivos (A4)</h2>
        <p className="text-white/60 text-sm mt-1">PDF con 8 carnets por hoja.</p>

        <div className="mt-4 grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label className="text-xs text-white/70">DED (opcional)</label>
              <input
                value={ded}
                onChange={(e) => setDed(e.target.value)}
                placeholder="Ej: Jovenes"
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-emerald-500/40"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-xs text-white/70">Límite (máx 500)</label>
              <input
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                inputMode="numeric"
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-emerald-500/40"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-white/80">
            <input
              type="checkbox"
              checked={soloConFoto}
              onChange={(e) => setSoloConFoto(e.target.checked)}
            />
            Solo miembros con foto
          </label>

          <div className="text-xs text-white/60">
            Endpoint: <span className="text-white/80">{masivoUrl}</span>
          </div>

          <button
            type="button"
            onClick={() => openUrl(masivoUrl)}
            className="rounded-xl px-4 py-2 text-sm font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 hover:bg-emerald-500/25 transition"
          >
            Generar PDF
          </button>
        </div>
      </div>
    </div>
  );
}