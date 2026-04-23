"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

type U = { id: string; nombre: string | null };

export default function LocationFilter({ ubicaciones }: { ubicaciones: U[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const current = sp.get("ubicacion") ?? "";

  function setUbicacion(value: string) {
    const next = new URLSearchParams(sp.toString());
    if (!value) next.delete("ubicacion");
    else next.set("ubicacion", value);
    router.push(`${pathname}?${next.toString()}`);
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
      <div className="text-sm font-semibold">Filtro por ubicación</div>
      <div className="mt-2 text-xs text-white/50">
        Filtra stock y movimientos por una ubicación específica.
      </div>

      <select
        value={current}
        onChange={(e) => setUbicacion(e.target.value)}
        className="mt-3 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm"
      >
        <option value="">Todas las ubicaciones</option>
        {ubicaciones.map((u) => (
          <option key={u.id} value={u.id}>
            {u.nombre ?? "—"}
          </option>
        ))}
      </select>
    </div>
  );
}