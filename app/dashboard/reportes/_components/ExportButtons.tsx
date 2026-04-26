"use client";

import { useTransition } from "react";

export default function ExportButtons({
  filename,
  onExportCsv,
}: {
  filename: string;
  onExportCsv: () => Promise<{ csv: string }>;
}) {
  const [pendingCsv, startCsv] = useTransition();
  const [pendingXls, startXls] = useTransition();

  function downloadBlob(text: string, name: string, mime: string) {
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function csvToExcelBlob(csv: string): string {
    // Add BOM for Excel to detect UTF-8 properly
    return "\uFEFF" + csv;
  }

  const baseName = filename.replace(/\.csv$/, "");

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        disabled={pendingCsv}
        onClick={() =>
          startCsv(async () => {
            const { csv } = await onExportCsv();
            downloadBlob(csv, filename, "text/csv;charset=utf-8");
          })
        }
        className={[
          "rounded-xl border px-3 py-2 text-sm font-semibold transition",
          pendingCsv
            ? "border-white/10 bg-white/5 text-white/40 cursor-not-allowed"
            : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/15",
        ].join(" ")}
      >
        {pendingCsv ? "Exportando..." : "CSV"}
      </button>

      <button
        type="button"
        disabled={pendingXls}
        onClick={() =>
          startXls(async () => {
            const { csv } = await onExportCsv();
            // Export as Excel-compatible CSV with BOM
            downloadBlob(csvToExcelBlob(csv), `${baseName}.xlsx.csv`, "text/csv;charset=utf-8");
          })
        }
        className={[
          "rounded-xl border px-3 py-2 text-sm font-semibold transition",
          pendingXls
            ? "border-white/10 bg-white/5 text-white/40 cursor-not-allowed"
            : "border-blue-500/30 bg-blue-500/10 text-blue-200 hover:bg-blue-500/15",
        ].join(" ")}
      >
        {pendingXls ? "Exportando..." : "Excel"}
      </button>

      <button
        type="button"
        onClick={() => window.print()}
        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white/70 hover:bg-white/10"
      >
        PDF / Imprimir
      </button>
    </div>
  );
}
