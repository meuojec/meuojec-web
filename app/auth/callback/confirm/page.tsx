"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthConfirmPage() {
  const router = useRouter();
  const sp = useSearchParams();

  useEffect(() => {
    const supabase = createClient();

    const next = sp.get("next") || "/dashboard";
    const code = sp.get("code");
    const error = sp.get("error");
    const errorDesc = sp.get("error_description");

    (async () => {
      try {
        // 1) Si Supabase devolvió error explícito por querystring
        if (error) {
          const msg = errorDesc || "Link inválido o expirado";
          router.replace(`/login?error=${encodeURIComponent(msg)}`);
          return;
        }

        // 2) Si viene con ?code=..., lo intercambiamos por sesión (PKCE)
        if (code) {
          const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
          if (exErr) {
            router.replace(
              `/login?error=${encodeURIComponent(exErr.message || "Link inválido o expirado")}`
            );
            return;
          }
        }

        // 3) Confirmamos sesión ya establecida
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          router.replace(next);
        } else {
          router.replace(`/login?error=${encodeURIComponent("Link inválido o expirado")}`);
        }
      } catch (e: any) {
        router.replace(`/login?error=${encodeURIComponent(e?.message || "Error inesperado")}`);
      }
    })();
  }, [router, sp]);

  return (
    <div className="min-h-screen bg-[#0b0b0b] text-white flex items-center justify-center p-6">
      <div className="rounded-2xl border border-white/10 bg-black/40 p-6">
        Procesando acceso...
      </div>
    </div>
  );
}
