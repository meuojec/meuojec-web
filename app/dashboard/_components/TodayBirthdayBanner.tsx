import Image from "next/image";
import Link from "next/link";

type BirthdayItem = { id: string; name: string; photoUrl: string | null };

export default function TodayBirthdayBanner({ items }: { items: BirthdayItem[] }) {
  const plural = items.length !== 1;
  return (
    <div className="relative overflow-hidden rounded-2xl border border-yellow-500/30 bg-gradient-to-r from-yellow-500/10 via-amber-500/5 to-transparent p-5">
      <div className="pointer-events-none absolute -right-6 -top-6 text-7xl opacity-10 select-none">🎂</div>
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[160px]">
          <p className="text-xs font-semibold uppercase tracking-widest text-yellow-400/80 mb-1">🎂 Hoy</p>
          <p className="text-base font-bold text-white">
            {plural ? `${items.length} personas cumplen años hoy` : `${items[0].name} cumple años hoy`}
          </p>
          {plural && <p className="mt-0.5 text-sm text-white/50">{items.map((i) => i.name).join(", ")}</p>}
        </div>
        <div className="flex -space-x-3">
          {items.slice(0, 6).map((it) => (
            <Link key={it.id} href={`/dashboard/miembros/${encodeURIComponent(it.id)}`} title={it.name}
              className="relative h-11 w-11 overflow-hidden rounded-full border-2 border-yellow-500/50 bg-white/10 hover:z-10 hover:scale-110 transition-transform">
              {it.photoUrl
                ? <Image src={it.photoUrl} alt={it.name} fill sizes="44px" className="object-cover" />
                : <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-yellow-300">{it.name.charAt(0).toUpperCase()}</div>}
            </Link>
          ))}
          {items.length > 6 && (
            <div className="relative h-11 w-11 overflow-hidden rounded-full border-2 border-yellow-500/30 bg-white/10 flex items-center justify-center text-xs font-semibold text-white/60">
              +{items.length - 6}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
