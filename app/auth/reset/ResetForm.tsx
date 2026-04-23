"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ResetForm() {
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");
  const [ok, setOk] = useState<string>("");

  // ✅ Verifica que exista sesión (la crea exchangeCodeForSession del server)
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setErr(
          "Sesión no encontrada. Abre nuevamente el enlace de restablecimiento (puede haber expirado)."
        );
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setOk("");

    if (password.length < 6) {
      setErr("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== password2) {
      setErr("Las contraseñas no coinciden.");
      return;
    }

    // ✅ Si no hay sesión, no tiene sentido intentar updateUser
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      setErr("Auth session missing. Vuelve a abrir el enlace de restablecimiento.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setErr(error.message);
      return;
    }

    setOk("Contraseña actualizada. Ya puedes iniciar sesión.");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="text-sm text-white/70">Nueva contraseña</label>
        <input
          type="password"
          className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 outline-none"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
        />
      </div>

      <div>
        <label className="text-sm text-white/70">Repetir contraseña</label>
        <input
          type="password"
          className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 outline-none"
          value={password2}
          onChange={(e) => setPassword2(e.target.value)}
          autoComplete="new-password"
        />
      </div>

      {err ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
          {err}
        </div>
      ) : null}

      {ok ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
          {ok}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-emerald-600 py-2 font-semibold text-black disabled:opacity-60"
      >
        {loading ? "Actualizando..." : "Actualizar contraseña"}
      </button>
    </form>
  );
}
