export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getNavPermissions } from "@/app/lib/auth/permissions";
import Link from "next/link";
import { QrCode, ClipboardList, LogIn } from "lucide-react";

export default async function MovilPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/movil");

  const perms = await getNavPermissions();

  return (
    <div className="flex flex-col min-h-screen p-5 gap-5">
      {/* Cabecera */}
      <div className="pt-safe">
        <div className="text-xs text-white/40 uppercase tracking-widest mb-1">MEUOJEC</div>
        <h1 className="text-2xl font-bold">Modo móvil</h1>
        <p className="text-sm text-white/50 mt-1">Accesos rápidos para usar desde el celular</p>
      </div>

      {/* Accesos */}
      <div className="flex-1 grid gap-4">
        {perms.asist ? (
          <>
            <Link
              href="/movil/asistencia"
              className="flex items-center gap-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 hover:bg-emerald-500/15 active:scale-95 transition"
            >
              <div className="rounded-xl bg-emerald-500/20 p-3">
                <QrCode className="h-7 w-7 text-emerald-300" />
              </div>
              <div>
                <div className="font-bold text-emerald-200 text-lg">Tomar asistencia</div>
                <div className="text-sm text-emerald-300/70">Escanear QR o buscar manualmente</div>
              </div>
            </Link>

            <Link
              href="/dashboard/asistencias/escanear"
              className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 hover:bg-white/10 active:scale-95 transition"
            >
              <div className="rounded-xl bg-white/10 p-3">
                <ClipboardList className="h-7 w-7 text-white/60" />
              </div>
              <div>
                <div className="font-bold text-white/80 text-lg">Escáner modo PC</div>
                <div className="text-sm text-white/40">Versión completa con semáforo</div>
              </div>
            </Link>
          </>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-white/50 text-sm">
            No tienes permiso para tomar asistencia.
          </div>
        )}

        <Link
          href="/dashboard"
          className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 hover:bg-white/10 active:scale-95 transition"
        >
          <div className="rounded-xl bg-white/10 p-3">
            <LogIn className="h-7 w-7 text-white/60" />
          </div>
          <div>
            <div className="font-bold text-white/80 text-lg">Panel completo</div>
            <div className="text-sm text-white/40">Ir al dashboard de escritorio</div>
          </div>
        </Link>
      </div>

      <div className="text-xs text-white/20 text-center pb-safe">
        Instalá esta app: en Safari → Compartir → Añadir a pantalla de inicio
      </div>
    </div>
  );
}
