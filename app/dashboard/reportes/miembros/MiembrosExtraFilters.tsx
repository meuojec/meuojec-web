// app/dashboard/reportes/miembros/MiembrosExtraFilters.tsx
"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

export default function MiembrosExtraFilters({
  initialSexo,
  initialIncompletos,
}: {
  initialSexo: string;
  initialIncompletos: string; // "" o "1"
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const [sexo, setSexo] = useState(initialSexo || "");
  const [incompletos, setIncompletos] = useState(initialIncompletos || "");

  const canApply = useMemo(() => true, []);

  function apply() {
    const q = new URLSearchParams(sp.toString());

    if (sexo.trim()) q.set("sexo", sexo.trim());
    else q.delete("sexo");

    if (incompletos) q.set("incompletos", incompletos);
    else q.delete("incompletos");

    router.push(`${pathname}?${q.toString()}`);
  }

  function reset() {
    const q = new URLSearchParams(sp.toString());
    q.delete("sexo");
    q.delete("incompletos");
    router.push(`${pathname}?${q.toString()}`);
  }

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div className="grid gap-3 md:grid-cols-3">
        <div className="space-y-1">
          <div className="text-xs text-white/60">Sexo (opcional)</div>
          <input
            value={sexo}
            onChange={(e) => setSexo(e.target.value)}
            placeholder="Masculino / Femenino"
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30"
          />
        </div>

        <div className="space-y-1">
          <div className="text-xs text-white/60">Incompletos</div>
          <select
            value={incompletos}
            onChange={(e) => setIncompletos(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
          >
            <option value="">Todos</option>
            <option value="1">Solo incompletos</option>
          </select>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={reset}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/10"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={apply}
          disabled={!canApply}
          className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/15"
        >
          Aplicar
        </button>
      </div>
    </div>
  );
}