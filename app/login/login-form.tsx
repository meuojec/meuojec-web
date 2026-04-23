// app/login/login-form.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErr(error.message);
        return;
      }

      // ✅ importante: refresca el estado SSR (cookies + middleware)
      router.refresh();
      router.replace("/dashboard");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="w-full max-w-md rounded-2xl border border-white/10 bg-black/40 p-6"
    >
      <h1 className="text-2xl font-bold">Iniciar sesión</h1>
      <p className="mt-1 text-white/60 text-sm">
        Accede con tu correo y contraseña.
      </p>

      <div className="mt-6 space-y-3">
        <div>
          <label className="text-xs text-white/60">Email</label>
          <input
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 outline-none focus:border-white/20"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            type="email"
            required
          />
        </div>

        <div>
          <label className="text-xs text-white/60">Contraseña</label>
          <input
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 outline-none focus:border-white/20"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            type="password"
            required
          />
        </div>

        {err && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">
            {err}
          </div>
        )}

        <button
          disabled={loading}
          className={[
            "mt-2 w-full rounded-lg px-4 py-2 font-semibold transition",
            loading
              ? "bg-white/10 text-white/50 cursor-not-allowed"
              : "bg-emerald-600 hover:bg-emerald-500",
          ].join(" ")}
          type="submit"
        >
          {loading ? "Ingresando..." : "Entrar"}
        </button>
      </div>
    </form>
  );
}
