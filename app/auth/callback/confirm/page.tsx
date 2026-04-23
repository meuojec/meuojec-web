"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function AuthConfirmInner() {
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
        if (error) {
          const msg = errorDesc || "Link inválido o expirado";
          router.replace(`/login?error=${encodeURIComponent(msg)}`);
          return;
        }

        if (code) {
          const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
          if (exErr) {
            router.replace(
              `/login?error=${encodeURIComponent(exErr.message || "Link inválido o expirado")}`
            );
            return;
          }
        }

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
    <div className="rounded-2xl border border-white/10 bg-black/40 p-6">
      Procesando acceso...
    </div>
  );
}

export default function AuthConfirmPage() {
  return (
    <div className="min-h-screen bg-[#0b0b0b] text-white flex items-center justify-center p-6">
      <Suspense
        fallback={
          <div className="rounded-2xl border border-white/10 bg-black/40 p-6">
            Cargando...
          </div>
        }
      >
        <AuthConfirmInner />
      </Suspense>
    </div>
  );
}
