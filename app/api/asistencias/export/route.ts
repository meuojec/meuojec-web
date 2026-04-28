// app/api/asistencias/export/route.ts
import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type AsistRow = {
  rut: string | null;
  fecha: string | null;
  hora: string | null;
  ded: string | null;
  evento_sesion_id: string | null;
  id_evento: string | null;
  created_at: string | null;
};

type MiembroMini = {
  rut: string;
  nombres: string | null;
  apellidos: string | null;
  sexo: string | null;
};

type SesionMeta = {
  id: string;
  nombre: string | null;
  fecha: string | null;
};

function safeFormat(v: string | null): "csv" | "xlsx" {
  return v === "csv" ? "csv" : "xlsx";
}

function safeDate(v: string | null) {
  if (!v) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  return v;
}

function csvEscape(val: unknown): string {
  const s = String(val ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function formatNombre(n?: string | null, a?: string | null) {
  return `${(n ?? "").trim()} ${(a ?? "").trim()}`.trim() || "";
}

function hhmm(t?: string | null) {
  if (!t) return "";
  return t.slice(0, 5);
}

const EXPORT_LIMIT = 10000;

export async function GET(req: Request) {
  // Auth
  const supabase = await createClient();
  const { data: userRes } = await supabase.auth.getUser();
  if (!userRes?.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const admin = createAdminClient();
  const url = new URL(req.url);

  const format = safeFormat(url.searchParams.get("format"));
  const rut = url.searchParams.get("rut")?.trim() || null;
  const sesion = url.searchParams.get("sesion")?.trim() || null;
  const from = safeDate(url.searchParams.get("from"));
  const to = safeDate(url.searchParams.get("to"));
  const ded = url.searchParams.get("ded")?.trim() || null;
  const evento = url.searchParams.get("evento")?.trim() || null;

  // Build query
  let q = admin
    .from("asistencias")
    .select("rut,fecha,hora,ded,evento_sesion_id,id_evento,created_at")
    .order("fecha", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(EXPORT_LIMIT);

  if (rut) q = q.eq("rut", rut);
  if (sesion) q = q.eq("evento_sesion_id", sesion);
  if (from) q = q.gte("fecha", from);
  if (to) q = q.lte("fecha", to);
  if (ded) q = q.eq("ded", ded);
  if (evento) q = q.eq("id_evento", evento);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []) as AsistRow[];

  // Resolve member names
  const ruts = Array.from(new Set(rows.map((r) => r.rut).filter(Boolean))) as string[];
  const miembrosMap = new Map<string, MiembroMini>();

  if (ruts.length > 0) {
    const { data: ms } = await admin
      .from("miembros")
      .select("rut,nombres,apellidos,sexo")
      .in("rut", ruts);
    (ms ?? []).forEach((m: any) => {
      if (m?.rut) miembrosMap.set(String(m.rut), m as MiembroMini);
    });
  }

  // Resolve session names
  const sesionIds = Array.from(
    new Set(rows.map((r) => r.evento_sesion_id).filter(Boolean))
  ) as string[];
  const sesionMap = new Map<string, SesionMeta>();

  if (sesionIds.length > 0) {
    const { data: ss } = await admin
      .from("eventos_sesiones")
      .select("id,nombre,fecha")
      .in("id", sesionIds);
    (ss ?? []).forEach((s: any) => {
      if (s?.id) sesionMap.set(String(s.id), s as SesionMeta);
    });
  }

  const today = new Date().toISOString().slice(0, 10);

  // Build output rows
  type ExportRow = {
    rut: string;
    nombre: string;
    sexo: string;
    fecha: string;
    hora: string;
    ded: string;
    sesion: string;
    id_evento: string;
  };

  const exportRows: ExportRow[] = rows.map((r) => {
    const m = r.rut ? miembrosMap.get(r.rut) : null;
    const ses = r.evento_sesion_id ? sesionMap.get(r.evento_sesion_id) : null;
    return {
      rut: r.rut ?? "",
      nombre: m ? formatNombre(m.nombres, m.apellidos) : "",
      sexo: m?.sexo ?? "",
      fecha: r.fecha ?? "",
      hora: hhmm(r.hora),
      ded: r.ded ?? "",
      sesion: ses?.nombre ?? r.evento_sesion_id ?? "",
      id_evento: r.id_evento ?? "",
    };
  });

  // ── CSV ─────────────────────────────────────────────────────────────────────
  if (format === "csv") {
    const headers = ["RUT", "Nombre", "Sexo", "Fecha", "Hora", "DED", "Sesión", "Evento"];
    const lines = [
      headers.map(csvEscape).join(","),
      ...exportRows.map((r) =>
        [r.rut, r.nombre, r.sexo, r.fecha, r.hora, r.ded, r.sesion, r.id_evento]
          .map(csvEscape)
          .join(",")
      ),
    ];
    const csv = "﻿" + lines.join("\r\n");

    const filename = rut
      ? `asistencias_${rut}_${today}.csv`
      : sesion
      ? `asistencias_sesion_${today}.csv`
      : `asistencias_${today}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  }

  // ── XLSX ─────────────────────────────────────────────────────────────────────
  const wb = new ExcelJS.Workbook();
  wb.creator = "Sistema Iglesia";
  wb.created = new Date();

  const ws = wb.addWorksheet("Asistencias");
  ws.columns = [
    { header: "RUT",     key: "rut",       width: 14 },
    { header: "Nombre",  key: "nombre",    width: 32 },
    { header: "Sexo",    key: "sexo",      width: 8  },
    { header: "Fecha",   key: "fecha",     width: 14 },
    { header: "Hora",    key: "hora",      width: 10 },
    { header: "DED",     key: "ded",       width: 12 },
    { header: "Sesión",  key: "sesion",    width: 24 },
    { header: "Evento",  key: "id_evento", width: 16 },
  ];

  // Estilo encabezado
  ws.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A5F" } };
  });

  exportRows.forEach((r) => ws.addRow(r));

  const buf = await wb.xlsx.writeBuffer();
  const filename = rut
    ? `asistencias_${rut}_${today}.xlsx`
    : sesion
    ? `asistencias_sesion_${today}.xlsx`
    : `asistencias_${today}.xlsx`;

  return new NextResponse(buf as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
