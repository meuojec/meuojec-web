"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const COMO_LLEGO_OPTIONS = [
  "Invitado por un amigo o familiar",
  "Redes sociales (Instagram, Facebook, etc.)",
  "Pasé por el lugar",
  "Búsqueda en internet",
  "Publicidad",
  "Otro",
];

type Estado = "idle" | "loading" | "success" | "error";

export default function RegistroVisitanteForm() {
  const [estado, setEstado] = useState<Estado>("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEstado("loading");
    setError("");

    const fd = new FormData(e.currentTarget);
    const nombres = String(fd.get("nombres") ?? "").trim();
    const apellidos = String(fd.get("apellidos") ?? "").trim();
    const telefono = String(fd.get("telefono") ?? "").trim();
    const como_llego = String(fd.get("como_llego") ?? "").trim();
    const direccion = String(fd.get("direccion") ?? "").trim();

    if (!nombres || !apellidos) {
      setError("El nombre y apellido son obligatorios.");
      setEstado("error");
      return;
    }

    const supabase = createClient();
    const { error: dbError } = await supabase.from("visitantes").insert({
      nombres,
      apellidos,
      telefono: telefono || null,
      como_llego: como_llego || null,
      direccion: direccion || null,
      fecha_visita: new Date().toISOString().slice(0, 10),
    });

    if (dbError) {
      setError("Hubo un error al guardar tu registro. Intenta de nuevo.");
      setEstado("error");
      return;
    }

    setEstado("success");
  }

  if (estado === "success") {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center space-y-3">
        <div className="text-4xl">🎉</div>
        <h2 className="text-xl font-bold text-emerald-300">¡Registro exitoso!</h2>
        <p className="text-white/70 text-sm">
          Gracias por visitarnos. Pronto nos pondremos en contacto contigo.
          ¡Que Dios te bendiga!
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-6 space-y-5">
      {/* Nombres */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm text-white/70">Nombres <span className="text-red-400">*</span></label>
          <input
            name="nombres" required
            placeholder="Juan"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm text-white/70">Apellidos <span className="text-red-400">*</span></label>
          <input
            name="apellidos" required
            placeholder="Pérez"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition"
          />
        </div>
      </div>

      {/* Teléfono */}
      <div className="space-y-1.5">
        <label className="text-sm text-white/70">Teléfono / WhatsApp</label>
        <input
          name="telefono" type="tel"
          placeholder="+56 9 1234 5678"
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition"
        />
      </div>

      {/* Cómo llegó */}
      <div className="space-y-1.5">
        <label className="text-sm text-white/70">¿Cómo llegaste a nosotros?</label>
        <select
          name="como_llego"
          className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-white/30 transition"
        >
          <option value="">Selecciona una opción…</option>
          {COMO_LLEGO_OPTIONS.map(o => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </div>

      {/* Dirección */}
      <div className="space-y-1.5">
        <label className="text-sm text-white/70">Dirección / Sector</label>
        <input
          name="direccion"
          placeholder="Ej: Lo Prado, Santiago"
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition"
        />
      </div>

      {/* Error */}
      {estado === "error" && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={estado === "loading"}
        className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 px-4 py-3 text-sm font-semibold text-white transition"
      >
        {estado === "loading" ? "Guardando…" : "Registrarme"}
      </button>

      <p className="text-center text-xs text-white/30">
        Tus datos son confidenciales y solo serán usados por el equipo pastoral.
      </p>
    </form>
  );
}
