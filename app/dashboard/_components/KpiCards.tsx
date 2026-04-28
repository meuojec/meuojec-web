import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export function Kpi({ title, value, icon: Icon, subtitle, prominent, href }: {
  title: string; value: number; icon?: LucideIcon; subtitle?: string; prominent?: boolean; href?: string;
}) {
  const inner = (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="text-sm text-white/70">{title}</div>
        <div className="mt-2 text-4xl font-bold tracking-tight text-white tabular-nums">{value}</div>
        {subtitle ? <div className="mt-2 text-sm text-white/50">{subtitle}</div> : null}
      </div>
      {Icon ? <div className="rounded-xl border border-white/10 bg-white/5 p-3"><Icon className="h-5 w-5 text-white/80" /></div> : null}
    </div>
  );
  const cls = [
    "rounded-2xl border p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]",
    prominent ? "border-white/15 bg-white/10" : "border-white/10 bg-black/20",
    href ? "hover:bg-white/5 transition block" : "",
  ].join(" ");
  if (href) return <Link href={href} className={cls}>{inner}</Link>;
  return <div className={cls}>{inner}</div>;
}

export function KpiCLP({ title, value, icon: Icon, subtitle, href }: {
  title: string; value: number; icon?: LucideIcon; subtitle?: string; href?: string;
}) {
  const formatted = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(value);
  const inner = (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="text-sm text-white/70">{title}</div>
        <div className="mt-2 text-2xl font-bold tracking-tight text-emerald-300 tabular-nums">{formatted}</div>
        {subtitle ? <div className="mt-2 text-sm text-white/50">{subtitle}</div> : null}
      </div>
      {Icon ? <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3"><Icon className="h-5 w-5 text-emerald-400" /></div> : null}
    </div>
  );
  const cls = "rounded-2xl border border-white/10 bg-black/20 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]" + (href ? " hover:bg-white/5 transition block" : "");
  if (href) return <Link href={href} className={cls}>{inner}</Link>;
  return <div className={cls}>{inner}</div>;
}

export function ProximasActividadesKpi({ title, icon: Icon, items, href }: {
  title: string; icon?: LucideIcon;
  items: { id: string; titulo: string; fecha: string; hora_inicio?: string | null; tipo: string }[];
  href?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="text-sm text-white/70">{title}</div>
        {Icon ? <div className="rounded-xl border border-white/10 bg-white/5 p-3"><Icon className="h-5 w-5 text-white/80" /></div> : null}
      </div>
      {items.length === 0 ? (
        <div className="text-sm text-white/40">Sin actividades próximas</div>
      ) : (
        <ul className="space-y-2">
          {items.map((ev) => (
            <li key={ev.id}>
              <div className="text-sm text-white truncate">{ev.titulo}</div>
              <div className="text-xs text-white/40">{ev.fecha}{ev.hora_inicio ? ` · ${ev.hora_inicio.slice(0, 5)}` : ""}</div>
            </li>
          ))}
        </ul>
      )}
      {href && <Link href={href} className="mt-3 inline-block text-xs text-white/40 hover:text-white/60 transition">Ver agenda →</Link>}
    </div>
  );
}
