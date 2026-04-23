"use client";

import { useTransition } from "react";

export default function DeleteForm({
  action,
  label = "Eliminar",
  confirmText = "¿Seguro que deseas eliminar esta transacción?",
}: {
  action: (formData: FormData) => void;
  label?: string;
  confirmText?: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={(fd) => {
        if (!confirm(confirmText)) return;
        startTransition(() => action(fd));
      }}
    >
      <button
        type="submit"
        disabled={isPending}
        className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-200 hover:bg-red-500/20 disabled:opacity-50"
      >
        {isPending ? "Eliminando..." : label}
      </button>
    </form>
  );
}
