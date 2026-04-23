// app/dashboard/reportes/finanzas/export-client.tsx
"use client";

import ExportButtons from "../_components/ExportButtons";
import { exportFinanzasCsv } from "./actions";

export default function ExportClient(props: {
  from: string;
  to: string;
  tipo?: "INGRESO" | "EGRESO";
  cuenta?: string;
  categoria?: string;
}) {
  const filename = `reporte_finanzas_${props.from}_a_${props.to}.csv`;

  return (
    <ExportButtons
      filename={filename}
      onExportCsv={() => exportFinanzasCsv(props)}
    />
  );
}