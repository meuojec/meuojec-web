"use client";

import React, { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function PageSizePicker({
  value,
  options = [50, 100, 200, 500, 1000],
}: {
  value: number;
  options?: number[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const onChange = (next: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("pageSize", String(next));
    params.set("page", "1");

    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <div className="flex items-center gap-2">
      <select
        value={String(value)}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={isPending}
        className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm disabled:opacity-60"
      >
        {options.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>

      <span className="text-xs text-white/50">filas</span>
      {isPending && <span className="text-xs text-white/40">cargando…</span>}
    </div>
  );
}