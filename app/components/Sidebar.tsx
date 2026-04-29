"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  CalendarDays,
  BarChart3,
  Settings,
  Package,
  BookOpen,
  Church,
  UserCheck,
  Heart,
  Megaphone,
  CalendarRange,
  ArrowLeftRight,
  Target,
  Gift,
  Landmark,
  Tag,
  Lock,
} from "lucide-react";

type NavPerms = {
  dash: boolean;
  miembros: boolean;
  asist: boolean;
  eventos: boolean;
  fin: boolean;
  inv: boolean;
  ded: boolean;
  reportes?: boolean;
  admin: boolean;
  ministerios?: boolean;
  visitantes?: boolean;
  pastoral?: boolean;
  anuncios?: boolean;
  agenda?: boolean;
};

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  enabled: boolean;
};

function Section({ title, items }: { title: string; items: NavItem[] }) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === href
      : pathname === href || pathname.startsWith(href + "/");

  const visible = items.filter((i) => i.enabled);
  if (visible.length === 0) return null;

  return (
    <div className="mt-8">
      <div className="px-3 text-xs font-semibold tracking-wider text-white/30 uppercase">
        {title}
      </div>
      <nav className="mt-2 space-y-1">
        {visible.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
                active
                  ? "bg-zinc-800 text-white"
                  : "text-white/70 hover:bg-white/5 hover:text-white",
              ].join(" ")}
            >
              <span
                className={[
                  "absolute left-0 top-1/2 h-6 -translate-y-1/2 rounded-r transition-all",
                  active ? "w-1 bg-white" : "w-0 bg-transparent",
                ].join(" ")}
              />
              <Icon className="h-4 w-4 opacity-90" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default function Sidebar({ navPerms }: { navPerms: NavPerms }) {
  const gestion: NavItem[] = [
    { label: "Dashboard",      href: "/dashboard",              icon: LayoutDashboard, enabled: !!navPerms.dash },
    { label: "Miembros",       href: "/dashboard/miembros",     icon: Users,           enabled: !!navPerms.miembros },
    { label: "Asistencias",    href: "/dashboard/asistencias",  icon: ClipboardList,   enabled: !!navPerms.asist },
    { label: "Eventos",        href: "/dashboard/eventos",      icon: CalendarDays,    enabled: !!navPerms.eventos },
    { label: "Esc. Dominical", href: "/dashboard/ded/sesion",   icon: BookOpen,        enabled: !!navPerms.ded },
  ];

  const pastoral: NavItem[] = [
    { label: "Visitantes",  href: "/dashboard/visitantes",  icon: UserCheck, enabled: !!navPerms.visitantes },
    { label: "Pastoral",    href: "/dashboard/pastoral",    icon: Heart,     enabled: !!navPerms.pastoral },
    { label: "Ministerios", href: "/dashboard/ministerios", icon: Church,    enabled: !!navPerms.ministerios },
  ];

  const comunicacion: NavItem[] = [
    { label: "Agenda",   href: "/dashboard/agenda",   icon: CalendarRange, enabled: !!navPerms.agenda },
    { label: "Anuncios", href: "/dashboard/anuncios", icon: Megaphone,     enabled: !!navPerms.anuncios },
  ];

  const analisis: NavItem[] = [
    { label: "Reportes", href: "/dashboard/reportes", icon: BarChart3, enabled: !!navPerms.reportes },
  ];

  const finanzas: NavItem[] = [
    { label: "Dashboard",      href: "/dashboard/finanzas/dashboard",      icon: LayoutDashboard, enabled: !!navPerms.fin },
    { label: "Transacciones",  href: "/dashboard/finanzas/transacciones",  icon: ArrowLeftRight,  enabled: !!navPerms.fin },
    { label: "Presupuesto",    href: "/dashboard/finanzas/presupuesto",    icon: Target,          enabled: !!navPerms.fin },
    { label: "Contribuciones", href: "/dashboard/finanzas/contribuciones", icon: Gift,            enabled: !!navPerms.fin },
    { label: "Cuentas",        href: "/dashboard/finanzas/cuentas",        icon: Landmark,        enabled: !!navPerms.fin },
    { label: "Categorias",     href: "/dashboard/finanzas/categorias",     icon: Tag,             enabled: !!navPerms.fin },
    { label: "Cierres",        href: "/dashboard/finanzas/cierres",        icon: Lock,            enabled: !!navPerms.fin },
  ];

  const sistema: NavItem[] = [
    { label: "Inventario",     href: "/dashboard/inventario",     icon: Package,  enabled: !!navPerms.inv },
    { label: "Administracion", href: "/dashboard/admin/usuarios", icon: Settings, enabled: !!navPerms.admin },
  ];

  return (
    <aside className="h-full w-72 border-r border-white/10 bg-black/40 backdrop-blur px-6 py-8 overflow-y-auto flex flex-col">
      <div className="mb-8 px-3">
        <div className="text-xl font-bold tracking-wide text-white">MEUOJEC</div>
        <div className="text-sm text-white/50">Sistema de administracion</div>
      </div>

      <div className="flex-1">
        <Section title="GESTION"       items={gestion} />
        <Section title="PASTORAL"      items={pastoral} />
        <Section title="COMUNICACION"  items={comunicacion} />
        <Section title="ANALISIS"      items={analisis} />
        <Section title="FINANZAS"      items={finanzas} />
        <Section title="SISTEMA"       items={sistema} />
      </div>

      {/* Footer */}
      <div className="mt-8 border-t border-white/10 pt-5 px-1">
        <div className="text-[10px] text-white/25 leading-relaxed">
          <div className="mb-1">
            Desarrollado por{" "}
            <a
              href="https://www.linkedin.com/in/jerrysainteron/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/45 hover:text-white/70 underline underline-offset-2 transition-colors"
            >
              Jerry Sainteron
            </a>
            {" · Todos los derechos reservados"}
          </div>
        </div>
      </div>
    </aside>
  );
}
