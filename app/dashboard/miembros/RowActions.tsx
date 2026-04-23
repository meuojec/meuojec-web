"use client";

import Link from "next/link";

export default function RowActions({
  rut,
}: {
  rut: string;
}) {
  const safe = encodeURIComponent(rut);

  return (
    <td
      className="px-4 py-3 text-right"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="inline-flex gap-2">
        <Link
          href={`/dashboard/miembros/${safe}`}
          className="rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-xs text-white/80 hover:bg-white/5"
        >
          Ver
        </Link>
      </div>
    </td>
  );
}