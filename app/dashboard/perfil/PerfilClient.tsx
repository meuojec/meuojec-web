"use client";

import { useRef, useState, useTransition } from "react";
import { actualizarNombre, cambiarPassword } from "./actions";

export default function PerfilClient({
  userId,
  email,
  displayName: initialName,
}: {
  userId: string;
  email: string;
  displayName: string;
}) {
  // --- Nombre ---
  const [nombre, setNombre] = useState(initialName);
  const [nombreMsg, setNombreMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pendingNombre, startNombre] = useTransition();

  function handleNombre(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setNombreMsg(null);
    startNombre(async () => {
      const res = await actualizarNombre(fd);
      setNombreMsg({ ok: res.ok, text: res.ok ? "Nombre actualizado." : (res.error ?? "Error desconocido.") });
    });
  }

  // --- Contraseña ---
  const pwFormRef = useRef<HTMLFormElement>(null);
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pendingPw, startPw] = useTransition();

  function handlePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setPwMsg(null);
    startPw(async () => {
      const res = await cambiarPassword(fd);
      if (res.ok) {
        pwFormRef.current?.reset();
        setPwMsg({ ok: true, text: "Contraseña actualizada correctamente." });
      } else {
        setPwMsg({ ok: false, text: res.error ?? "Error desconocido." });
      }
    });
  }

  return (
    <div className="space-y-5">
      {/* Tarjeta: datos de cuenta */}
      <section className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-white">Cuenta</h2>

        {/* Email (solo lectura) */}
        <div>
          <label className="block text-xs text-white/50 mb-1">Correo electrónico</label>
          <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/60 select-all">
            {email}
          </div>
        </div>

        {/* Nombre editable */}
        <form onSubmit={handleNombre} className="space-y-3">
          <div>
            <label htmlFor="display_name" className="block text-xs text-white/50 mb-1">
              Nombre para mostrar
            </label>
            <input
              id="display_name"
              name="display_name"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Tu nombre"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20"
              required
            />
          </div>

          {nombreMsg && (
            <p className={`text-xs ${nombreMsg.ok ? "text-green-400" : "text-red-400"}`}>
              {nombreMsg.ok ? "✓ " : "✗ "}{nombreMsg.text}
            </p>
          )}

          <button
            type="submit"
            disabled={pendingNombre}
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:bg-white/90 disabled:opacity-50 transition"
          >
            {pendingNombre ? "Guardando…" : "Guardar nombre"}
          </button>
        </form>
      </section>

      {/* Tarjeta: cambiar contraseña */}
      <section className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-white">Cambiar contraseña</h2>

        <form ref={pwFormRef} onSubmit={handlePassword} className="space-y-3">
          <div>
            <label htmlFor="nueva" className="block text-xs text-white/50 mb-1">
              Nueva contraseña
            </label>
            <input
              id="nueva"
              name="nueva"
              type="password"
              placeholder="Mínimo 6 caracteres"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20"
              required
              minLength={6}
            />
          </div>

          <div>
            <label htmlFor="confirmar" className="block text-xs text-white/50 mb-1">
              Confirmar contraseña
            </label>
            <input
              id="confirmar"
              name="confirmar"
              type="password"
              placeholder="Repite la contraseña"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20"
              required
              minLength={6}
            />
          </div>

          {pwMsg && (
            <p className={`text-xs ${pwMsg.ok ? "text-green-400" : "text-red-400"}`}>
              {pwMsg.ok ? "✓ " : "✗ "}{pwMsg.text}
            </p>
          )}

          <button
            type="submit"
            disabled={pendingPw}
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10 disabled:opacity-50 transition"
          >
            {pendingPw ? "Actualizando…" : "Cambiar contraseña"}
          </button>
        </form>
      </section>

      {/* ID técnico (útil para soporte) */}
      <p className="text-xs text-white/20 select-all">ID: {userId}</p>
    </div>
  );
}
