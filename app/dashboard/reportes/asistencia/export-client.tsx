// app/dashboard/reportes/asistencia/export-client.tsx
"use client";

import ExportButtons from "../_components/ExportButtons";
import { exportAsistenciaCsv } from "./actions";

export default function ExportClient(props: {
  from: string;
  to: string;
  ded?: string;
  evento?: string;
  sesion?: string;
}) {
  const filename = `reporte_asistencia_${props.from}_a_${props.to}.csv`;

  return (
    <ExportButtons
      filename={filename}
      onExportCsv={() => exportAsistenciaCsv(props)}
    />
  );
}