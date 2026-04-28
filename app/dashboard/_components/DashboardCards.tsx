import type { LucideIcon } from "lucide-react";
import CardShell from "./CardShell";

export function ListCard({ title, icon: Icon, rows, showBars, totalForPercent }: {
  title: string; icon?: LucideIcon; rows: { label: string; value: number }[]; showBars?: boolean; totalForPercent?: number;
}) {
  return (
    <CardShell>
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <div className="text-sm font-semibold text-white">{title}</div>
        {Icon ? <div className="rounded-lg border border-white/10 bg-white/5 p-2"><Icon className="h-4 w-4 text-white/70" /></div> : null}
      </div>
      <div className="px-6 py-2">
        {rows.length === 0 ? (
          <div className="py-6 text-sm text-white/50">Sin datos</div>
        ) : (
          <ul className="divide-y divide-white/10">
            {rows.map((r) => {
              const pct = totalForPercent && totalForPercent > 0 ? Math.round((r.value / totalForPercent) * 100) : null;
              return (
                <li key={r.label} className="py-3 transition hover:bg-white/5 -mx-2 px-2 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/85">{r.label}</span>
                    <span className="text-sm font-semibold tabular-nums text-white">
                      {r.value}{pct !== null ? <span className="text-white/40"> ({pct}%)</span> : null}
                    </span>
                  </div>
                  {showBars && totalForPercent && totalForPercent > 0 ? (
                    <div className="mt-2 h-2 w-full rounded-full bg-white/5">
                      <div className="h-2 rounded-full bg-white/25" style={{ width: `${Math.min(100, (r.value / totalForPercent) * 100)}%` }} />
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </CardShell>
  );
}

export function SimpleListCard({ title, icon: Icon, items, emptyText }: {
  title: string; icon?: LucideIcon; items: { id: string; primary: string; secondary?: string }[]; emptyText: string;
}) {
  return (
    <CardShell>
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <div className="text-sm font-semibold text-white">{title}</div>
        {Icon ? <div className="rounded-lg border border-white/10 bg-white/5 p-2"><Icon className="h-4 w-4 text-white/70" /></div> : null}
      </div>
      <div className="px-6 py-3">
        {items.length === 0 ? (
          <div className="py-6 text-sm text-white/50">{emptyText}</div>
        ) : (
          <ul className="divide-y divide-white/10">
            {items.map((it) => (
              <li key={it.id} className="py-3">
                <div className="text-sm text-white/90">{it.primary}</div>
                {it.secondary ? <div className="mt-1 text-xs text-white/50">{it.secondary}</div> : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </CardShell>
  );
}

export function SmallInfoCard({ title, icon: Icon, lines }: {
  title: string; icon?: LucideIcon; lines: { label: string; value: string }[];
}) {
  return (
    <CardShell>
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <div className="text-sm font-semibold text-white">{title}</div>
        {Icon ? <div className="rounded-lg border border-white/10 bg-white/5 p-2"><Icon className="h-4 w-4 text-white/70" /></div> : null}
      </div>
      <div className="px-6 py-3">
        <ul className="space-y-3">
          {lines.map((l) => (
            <li key={l.label} className="flex items-start justify-between gap-4">
              <span className="text-sm text-white/80">{l.label}</span>
              <span className="text-sm font-semibold tabular-nums text-white">{l.value}</span>
            </li>
          ))}
        </ul>
      </div>
    </CardShell>
  );
}
