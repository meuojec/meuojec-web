"use client";

import { useState, useTransition } from "react";
import { setCuentaActiva } from "../actions";
import { useRouter } from "next/navigation";

export default function ToggleActiva({
  id,
  activa,
  disabled,
}: {
  id: string;
  activa: boolean;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [local, setLocal] = useState(activa);

  function toggle() {
    if (disabled) return;
    const next = !local;
    setLocal(next);

    startTransition(async () => {
      const res = await setCuentaActiva(id, next);
      if (!res.ok) {
        setLocal(!next);
        alert(res.error || "Error actualizando estado");
        return;
      }
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={disabled || isPending}
      className={[
        "inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold transition",
        disabled || isPending ? "opacity-60 cursor-not-allowed" : "hover:bg-white/5",
        local
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
          : "border-white/10 bg-white/5 text-white/70",
      ].join(" ")}
      title={disabled ? "Solo admin" : "Activar/Desactivar"}
    >
      <span className={["h-2 w-2 rounded-full", local ? "bg-emerald-400" : "bg-white/30"].join(" ")} />
      {local ? "Activa" : "Inactiva"}
    </button>
  );
}
