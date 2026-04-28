"use client";

import { useTransition } from "react";

interface DeleteConfirmButtonProps {
  /** Server action to call on confirm. Should be a bound server action, e.g. eliminar.bind(null, id) */
  action: () => Promise<void>;
  /** Message shown in the confirm dialog */
  confirmMessage?: string;
  /** Label shown on the button */
  label?: string;
  className?: string;
}

export default function DeleteConfirmButton({
  action,
  confirmMessage = "¿Estás seguro de que quieres eliminar este registro? Esta acción no se puede deshacer.",
  label = "Eliminar",
  className,
}: DeleteConfirmButtonProps) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm(confirmMessage)) return;
    startTransition(async () => {
      await action();
    });
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={handleClick}
      className={
        className ??
        "rounded border border-red-500/20 bg-red-500/10 px-2 py-1 text-xs text-red-300 hover:bg-red-500/20 transition disabled:opacity-40 disabled:cursor-not-allowed"
      }
    >
      {pending ? "Eliminando…" : label}
    </button>
  );
}
