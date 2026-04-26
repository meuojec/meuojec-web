// app/dashboard/reportes/page.tsx
export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BackButton from "@/app/components/BackButton";

export default async function ReportesHomePage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // (Opcional) si ya tienes permisos por capability, aquí podrías validar.
  // Por ahora, solo requiere sesión.

  const cards = [
    {
      title: "Asistencia",
      desc: "Tendencias semana/mes, top DED, nuevos vs recurrentes, comparativos.",
      href: "/dashboard/reportes/asistencia",
      icon: "📊",
    },
    {
      title: "Miembros",
      desc: "Cumpleaños del mes, DED, sexo, edades, nuevos por mes, incompletos.",
      href: "/dashboard/reportes/miembros",
      icon: "👥",
    },
    {
      title: "Inventario",
      desc: "Movimientos, stock bajo, rotación, kardex por producto.",
      href: "/dashboard/reportes/inventario",
      icon: "📦",
    },
    {
      title: "Finanzas",
      desc: "Ingresos vs egresos, categorías, cuentas, saldos y cierres.",
      href: "/dashboard/reportes/finanzas",
      icon: "💰",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
        <div className="flex items-center gap-3">
          <BackButton />
          <h1 className="text-xl font-bold text-white">Centro de Reportes</h1>
        </div>
        <p className="mt-1 text-sm text-white/70">
          Aquí es donde la app pasa de “registro” a “gestión”: análisis, tendencias y exportación.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="rounded-2xl border border-white/10 bg-black/20 p-5 hover:bg-black/30 transition"
          >
            <div className="flex items-start gap-3">
              <div className="text-2xl">{c.icon}</div>
              <div className="min-w-0">
                <div className="text-lg font-semibold text-white">{c.title}</div>
                <div className="mt-1 text-sm text-white/70">{c.desc}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}