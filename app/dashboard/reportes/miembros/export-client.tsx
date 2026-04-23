// app/dashboard/reportes/miembros/export-client.tsx
"use client";

import ExportButtons from "../_components/ExportButtons";
import { exportMiembrosCsv } from "./actions";

export default function ExportClient(props: {
  from: string;
  to: string;
  ded?: string;
  sexo?: string;
  incompletos?: boolean;
}) {
  const filename = `reporte_miembros_${props.from}_a_${props.to}.csv`;

  return (
    <ExportButtons
      filename={filename}
      onExportCsv={() => exportMiembrosCsv(props)}
    />
  );
}