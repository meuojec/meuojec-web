"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteTransaccion } from "../actions";

export default function DeleteButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      className={[
        "inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-semibold transition",
        pending
          ? "border-white/10 bg-white/5 text-white/40 cursor-not-allowed"
          : "border-red-500/30 bg-red-500/10 text-red-200 hover:bg-red-500/20",
      ].join(" ")}
      onClick={() => {
        if (!confirm("¿Eliminar esta transacción?")) return;

        startTransition(async () => {
          const res = await deleteTransaccion(id);
          if (!res?.ok) {
            alert(res?.error ?? "No se pudo eliminar.");
            return;
          }
          router.refresh();
        });
      }}
    >
      Eliminar
    </button>
  );
}
