import Image from "next/image";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import CardShell from "./CardShell";

type BirthdayItem = {
  id: string;
  name: string;
  dateLabel: string;
  photoUrl?: string | null;
  dia?: number | null;
};

export default function BirthdaysGridCard({ title, icon: Icon, items, errorText, todayDay }: {
  title: string; icon?: LucideIcon; items: BirthdayItem[]; errorText?: string; todayDay?: number;
}) {
  return (
    <CardShell>
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <div className="text-sm font-semibold text-white tracking-wide">{title}</div>
        {Icon ? <div className="rounded-lg border border-white/10 bg-white/5 p-2"><Icon className="h-4 w-4 text-white/70" /></div> : null}
      </div>
      <div className="px-6 py-5">
        {errorText ? (
          <div className="text-sm text-red-400">{errorText}</div>
        ) : items.length === 0 ? (
          <div className="text-sm text-white/50">No hay cumpleaños este mes.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
            {items.map((it) => {
              const isToday = todayDay !== undefined && it.dia === todayDay;
              return (
                <Link key={it.id} href={`/dashboard/miembros/${encodeURIComponent(it.id)}`}
                  className={`group rounded-xl border p-4 transition hover:bg-white/[0.06] ${isToday ? "border-yellow-500/50 bg-yellow-500/10" : "border-white/10 bg-white/[0.04]"}`}>
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`relative h-12 w-12 shrink-0 overflow-hidden rounded-full border bg-white/5 ${isToday ? "border-yellow-500/50" : "border-white/20"}`}>
                      {it.photoUrl
                        ? <Image src={it.photoUrl} alt={it.name} fill sizes="48px" className="object-cover" />
                        : <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white/50">{it.name.charAt(0).toUpperCase()}</div>}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-white truncate leading-tight">{it.name}</div>
                      <div className={`text-xs mt-0.5 ${isToday ? "text-yellow-400 font-medium" : "text-white/50"}`}>
                        {isToday ? "🎂 Hoy" : it.dateLabel}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </CardShell>
  );
}
