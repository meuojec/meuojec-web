"use client";

import { useTransition } from "react";
import { deleteProductoIfNoMovimientos, toggleProductoActivo } from "./actions";

export default function ProductActions({
  id,
  activo,
  isAdmin,
}: {
  id: string;
  activo: boolean;
  isAdmin: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex justify-end gap-2">
      <button
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            try {
              await toggleProductoActivo(id, !activo);
            } catch (e: any) {
              alert(e?.message ?? "Error");
            }
          })
        }
        className={[
          "rounded-lg px-3 py-1.5 text-xs border transition",
          activo
            ? "border-amber-500/30 bg-amber-500/10 text-amber-200 hover:bg-amber-500/15"
            : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/15",
          pending ? "opacity-50 cursor-not-allowed" : "",
        ].join(" ")}
        title={activo ? "Desactivar producto" : "Activar producto"}
      >
        {activo ? "Desactivar" : "Activar"}
      </button>

      {isAdmin ? (
        <button
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const ok = confirm(
                "¿Eliminar producto?\n\nSolo se eliminará si NO tiene movimientos. Si tiene movimientos, usa Desactivar."
              );
              if (!ok) return;

              try {
                await deleteProductoIfNoMovimientos(id);
              } catch (e: any) {
                alert(e?.message ?? "Error");
              }
            })
          }
          className={[
            "rounded-lg px-3 py-1.5 text-xs border border-red-500/30 bg-red-500/10 text-red-200 hover:bg-red-500/15 transition",
            pending ? "opacity-50 cursor-not-allowed" : "",
          ].join(" ")}
          title="Eliminar (solo admin)"
        >
          Eliminar
        </button>
      ) : null}
    </div>
  );
}