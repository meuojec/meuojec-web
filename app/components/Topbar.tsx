"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function Topbar() {
  const supabase = createClient();
  const router = useRouter();

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="h-14 border-b border-white/10 bg-black/20 backdrop-blur flex items-center px-6">
      <div className="text-sm opacity-70">Sistema de Administración</div>
      <button
        onClick={logout}
        className="ml-auto text-sm rounded-lg border border-white/10 px-3 py-1.5 hover:bg-white/5"
      >
        Salir
      </button>
    </header>
  );
}