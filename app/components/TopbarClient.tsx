"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import ThemeToggle from "@/app/components/ThemeToggle";
import GlobalSearch from "@/app/components/GlobalSearch";
import RealtimeNotifications from "@/app/components/RealtimeNotifications";

export default function TopbarClient({
  onMenuToggle,
  sidebarOpen,
}: {
  onMenuToggle: () => void;
  sidebarOpen: boolean;
}) {
  const supabase = createClient();
  const router = useRouter();

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="h-14 border-b border-white/10 bg-black/20 backdrop-blur flex items-center px-4 md:px-6 gap-3 sticky top-0 z-20">
      {/* Toggle sidebar */}
      <button
        onClick={onMenuToggle}
        className="flex items-center justify-center w-8 h-8 rounded-lg border border-white/10 hover:bg-white/5 transition shrink-0"
        aria-label={sidebarOpen ? "Cerrar menu" : "Abrir menu"}
      >
        {sidebarOpen ? (
          <X className="h-4 w-4 text-white/70" />
        ) : (
          <Menu className="h-4 w-4 text-white/70" />
        )}
      </button>

      <div className="text-sm text-white/60 hidden md:block">Sistema de Administracion</div>

      {/* Búsqueda global */}
      <GlobalSearch />

      {/* Controles lado derecho */}
      <div className="ml-auto flex items-center gap-2">
        {/* Notificaciones en tiempo real */}
        <RealtimeNotifications />

        {/* Toggle modo claro/oscuro */}
        <ThemeToggle />

        {/* Cerrar sesion */}
        <button
          onClick={logout}
          className="text-sm rounded-lg border border-white/10 px-3 py-1.5 hover:bg-white/5 transition text-white/70 hover:text-white"
        >
          Salir
        </button>
      </div>
    </header>
  );
}
