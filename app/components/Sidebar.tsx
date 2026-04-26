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
  Wallet,
  Settings,
  Package,
  BookOpen,
  Church,
  UserCheck,
  Heart,
  Megaphone,
  CalendarRange,
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

function FinanzasSubmenu({ enabled }: { enabled: boolean }) {
  const pathname = usePathname();
  if (!enabled) return null;

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const base = "/dashboard/finanzas";
  const open = pathname === base || pathname.startsWith(base + "/");

  if (!open) {
    return (
      <div className="mt-2">
        <Link
          href="/dashboard/finanzas/transacciones"
          className={[
            "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
            isActive("/dashboard/finanzas/transacciones")
              ? "bg-zinc-800 text-white"
              : "text-white/70 hover:bg-white/5 hover:text-white",
          ].join(" ")}
        >
          <span
            className={[
              "absolute left-0 top-1/2 h-6 -translate-y-1/2 rounded-r transition-all",
              isActive("/dashboard/finanzas/transacciones")
                ? "w-1 bg-white"
                : "w-0 bg-transparent",
            ].join(" ")}
          />
          <Wallet className="h-4 w-4 opacity-90" />
          <span>Finanzas</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-2">
      <div className="px-3 text-xs font-semibold tracking-wider text-white/30 uppercase">
        Finanzas
      </div>
      <nav className="mt-2 space-y-1">
        {[
          { href: "/dashboard/finanzas/transacciones",   label: "Transacciones",   icon: true },
          { href: "/dashboard/finanzas/contribuciones",  label: "Contribuciones",  icon: false },
          { href: "/dashboard/finanzas/cuentas",         label: "Cuentas",         icon: false },
          { href: "/dashboard/finanzas/categorias",      label: "Categorias",      icon: false },
          { href: "/dashboard/finanzas/cierres",         label: "Cierres",         icon: false },
        ].map(({ href, label, icon }) => (
          <Link
            key={href}
            href={href}
            className={[
              "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
              isActive(href) ? "bg-zinc-800 text-white" : "text-white/70 hover:bg-white/5 hover:text-white",
            ].join(" ")}
          >
            <span
              className={[
                "absolute left-0 top-1/2 h-6 -translate-y-1/2 rounded-r transition-all",
                isActive(href) ? "w-1 bg-white" : "w-0 bg-transparent",
              ].join(" ")}
            />
            {icon ? <Wallet className="h-4 w-4 opacity-90" /> : <span className="w-4" />}
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}

export default function Sidebar({ navPerms }: { navPerms: NavPerms }) {
  const gestion: NavItem[] = [
    { label: "Dashboard",    href: "/dashboard",              icon: LayoutDashboard, enabled: !!navPerms.dash },
    { label: "Miembros",     href: "/dashboard/miembros",     icon: Users,           enabled: !!navPerms.miembros },
    { label: "Asistencias",  href: "/dashboard/asistencias",  icon: ClipboardList,   enabled: !!navPerms.asist },
    { label: "Eventos",      href: "/dashboard/eventos",      icon: CalendarDays,    enabled: !!navPerms.eventos },
    { label: "Esc. Dominical", href: "/dashboard/ded/sesion", icon: BookOpen,        enabled: !!navPerms.ded },
  ];

  const pastoral: NavItem[] = [
    { label: "Visitantes",   href: "/dashboard/visitantes",   icon: UserCheck, enabled: !!navPerms.visitantes },
    { label: "Pastoral",     href: "/dashboard/pastoral",     icon: Heart,     enabled: !!navPerms.pastoral },
    { label: "Ministerios",  href: "/dashboard/ministerios",  icon: Church,    enabled: !!navPerms.ministerios },
  ];

  const comunicacion: NavItem[] = [
    { label: "Agenda",   href: "/dashboard/agenda",   icon: CalendarRange, enabled: !!navPerms.agenda },
    { label: "Anuncios", href: "/dashboard/anuncios", icon: Megaphone,     enabled: !!navPerms.anuncios },
  ];

  const analisis: NavItem[] = [
    { label: "Reportes", href: "/dashboard/reportes", icon: BarChart3, enabled: !!navPerms.reportes },
  ];

  const sistema: NavItem[] = [
    { label: "Inventario",     href: "/dashboard/inventario",     icon: Package,  enabled: !!navPerms.inv },
    { label: "Administracion", href: "/dashboard/admin/usuarios", icon: Settings, enabled: !!navPerms.admin },
  ];

  return (
    <aside className="h-full w-72 border-r border-white/10 bg-black/40 backdrop-blur px-6 py-8 overflow-y-auto flex flex-col">
      <div className="mb-8 px-3">
        <div className="text-xl font-bold tracking-wide text-white">MEUOJEC</div>
        <div className="text-sm text-white/50">Panel de gestion</div>
      </div>

      <div className="flex-1">
        <Section title="GESTION" items={gestion} />
        <Section title="PASTORAL" items={pastoral} />
        <Section title="COMUNICACION" items={comunicacion} />
        <Section title="ANALISIS" items={analisis} />
        <Section title="SISTEMA" items={sistema} />
        <FinanzasSubmenu enabled={!!navPerms.fin} />
      </div>

      {/* Footer con creditos del desarrollador */}
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
          </div>
          <div>
            &copy; {new Date().getFullYear()} MEUOJEC &middot; Todos los derechos reservados
          </div>
        </div>
      </div>
    </aside>
  );
}
