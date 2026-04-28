"use client";

import { useMemo, useState, useTransition } from "react";

function normalizeRut(input: string) {
  let s = (input || "").trim().toUpperCase();
  s = s.replace(/\s+/g, "").replace(/\./g, "");
  s = s.replace(/[^0-9K-]/g, "");
  if (!s.includes("-") && s.length >= 2) s = `${s.slice(0, -1)}-${s.slice(-1)}`;
  return s;
}

type MiembroResult = {
  rut: string;
  nombres: string | null;
  apellidos: string | null;
  foto_url: string | null;
  ded: string | null;
};

export default function CarnetsTools() {
  // ── Individual ────────────────────────────────────────────────────────────────
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MiembroResult[]>([]);
  const [selected, setSelected] = useState<MiembroResult | null>(null);
  const [searching, startSearch] = useTransition();

  const esRut = /^[\d\-kK.]+$/.test(query.trim());

  const rutNorm = useMemo(() => normalizeRut(query), [query]);
  const canDirectRut = rutNorm.includes("-") && rutNorm.length >= 3;

  async function buscar() {
    const q = query.trim();
    if (!q) return;

    startSearch(async () => {
      const sp = new URLSearchParams();
      if (esRut) {
        sp.set("rut", normalizeRut(q));
      } else {
        sp.set("nombre", q);
      }
      try {
        const res = await fetch(`/api/miembros/buscar?${sp.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data?.miembros ?? []);
          setSelected(null);
        }
      } catch {
        setResults([]);
      }
    });
  }

  const carnetUrl = useMemo(() => {
    if (selected) return `/api/miembros/${encodeURIComponent(selected.rut)}/carnet`;
    if (canDirectRut && esRut) return `/api/miembros/${encodeURIComponent(rutNorm)}/carnet`;
    return "";
  }, [selected, canDirectRut, esRut, rutNorm]);

  const openUrl = (u: string) => {
    if (!u) return;
    window.open(u, "_blank", "noopener,noreferrer");
  };

  // ── Masivo ────────────────────────────────────────────────────────────────────
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

  const selectedNombre = selected
    ? [selected.nombres, selected.apellidos].filter(Boolean).join(" ").trim()
    : null;

  return (
    <div className="grid gap-6 max-w-3xl">
      {/* ── Individual ─────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-lg font-semibold">Carnet individual</h2>
        <p className="text-white/60 text-sm mt-1">Busca por RUT o nombre del miembro.</p>

        <div className="mt-4 grid gap-3">
          <div className="flex gap-2">
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSelected(null); setResults([]); }}
              onKeyDown={(e) => e.key === "Enter" && buscar()}
              placeholder="RUT (25806136-5) o nombre"
              className="flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-emerald-500/40"
            />
            <button
              type="button"
              onClick={buscar}
              disabled={searching || !query.trim()}
              className="rounded-xl px-4 py-2 text-sm border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 disabled:opacity-40"
            >
              {searching ? "..." : "Buscar"}
            </button>
          </div>

          {/* Resultados de búsqueda */}
          {results.length > 0 && !selected && (
            <div className="rounded-xl border border-white/10 bg-black/20 divide-y divide-white/5 max-h-52 overflow-y-auto">
              {results.map((m) => {
                const nombre = [m.nombres, m.apellidos].filter(Boolean).join(" ").trim() || m.rut;
                return (
                  <button
                    key={m.rut}
                    type="button"
                    onClick={() => { setSelected(m); setResults([]); }}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-white/5 transition"
                  >
                    <div>
                      <div className="text-sm text-white">{nombre}</div>
                      <div className="text-xs text-white/40">{m.rut}{m.ded ? ` · ${m.ded}` : ""}</div>
                    </div>
                    <span className="text-xs text-white/30">→</span>
                  </button>
                );
              })}
            </div>
          )}

          {results.length === 0 && !searching && query.trim() && !selected && !canDirectRut && (
            <div className="text-xs text-white/40">No se encontraron resultados.</div>
          )}

          {/* Seleccionado */}
          {selected && (
            <div className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
              <div>
                <div className="text-sm font-semibold text-emerald-200">{selectedNombre}</div>
                <div className="text-xs text-white/40 mt-0.5">{selected.rut}{selected.ded ? ` · ${selected.ded}` : ""}</div>
              </div>
              <button
                type="button"
                onClick={() => { setSelected(null); setQuery(""); }}
                className="text-xs text-white/40 hover:text-white/70 ml-3"
              >
                ✕
              </button>
            </div>
          )}

          {carnetUrl && (
            <div className="text-xs text-white/60">
              Endpoint: <span className="text-white/80">{carnetUrl}</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => openUrl(carnetUrl)}
            disabled={!carnetUrl}
            className={[
              "rounded-xl px-4 py-2 text-sm font-semibold transition",
              carnetUrl
                ? "bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 hover:bg-emerald-500/25"
                : "bg-white/5 text-white/40 border border-white/10 cursor-not-allowed",
            ].join(" ")}
          >
            Generar PDF
          </button>
        </div>
      </div>

      {/* ── Masivo ─────────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-lg font-semibold">Carnets masivos (A4)</h2>
        <p className="text-white/60 text-sm mt-1">Genera un PDF con múltiples carnets filtrados por DED.</p>

        <div className="mt-4 grid gap-3">
          <div>
            <label className="text-xs text-white/70 block mb-1">DED (opcional)</label>
            <input
              value={ded}
              onChange={(e) => setDed(e.target.value)}
              placeholder="Ej: DED Norte"
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-emerald-500/40"
            />
          </div>

          <div>
            <label className="text-xs text-white/70 block mb-1">Límite de carnets</label>
            <input
              type="number"
              min={1}
              max={500}
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-emerald-500/40"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={soloConFoto}
              onChange={(e) => setSoloConFoto(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-white/70">Solo miembros con foto</span>
          </label>

          <div className="text-xs text-white/60">
            Endpoint: <span className="text-white/80">{masivoUrl}</span>
          </div>

          <button
            type="button"
            onClick={() => openUrl(masivoUrl)}
            className="rounded-xl px-4 py-2 text-sm font-semibold bg-blue-500/20 text-blue-200 border border-blue-500/30 hover:bg-blue-500/25 transition"
          >
            Generar PDF masivo
          </button>
        </div>
      </div>
    </div>
  );
}
