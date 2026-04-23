// app/dashboard/reportes/_components/ExportButtons.tsx
"use client";

import { useTransition } from "react";

export default function ExportButtons({
  filename,
  onExportCsv,
}: {
  filename: string;
  onExportCsv: () => Promise<{ csv: string }>;
}) {
  const [pending, start] = useTransition();

  function download(text: string, name: string) {
    const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const { csv } = await onExportCsv();
            download(csv, filename);
          })
        }
        className={[
          "rounded-xl border px-3 py-2 text-sm font-semibold transition",
          pending
            ? "border-white/10 bg-white/5 text-white/40 cursor-not-allowed"
            : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/15",
        ].join(" ")}
      >
        {pending ? "Exportando..." : "Exportar CSV"}
      </button>

      <button
        type="button"
        disabled
        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white/40 cursor-not-allowed"
        title="Excel lo activamos en la Fase 2"
      >
        Excel (pronto)
      </button>

      <button
        type="button"
        disabled
        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white/40 cursor-not-allowed"
        title="PDF lo activamos en la Fase 2"
      >
        PDF (pronto)
      </button>
    </div>
  );
}