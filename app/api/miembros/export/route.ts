// app/api/miembros/export/route.ts
import React from "react";
import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { MiembrosPdf, type PdfRow } from "./pdf-doc";

type Row = {
  rut: string;
  nombres: string | null;
  apellidos: string | null;
  sexo: string | null;
  ded: string | null;
  patente: string | null;
  marca_modelo: string | null;
  telefono: string | null;
  correo_electronico: string | null;
  estado_membresia: string | null;
  created_at: string | null;
};

function formatNombre(n?: string | null, a?: string | null) {
  const nn = (n ?? "").trim();
  const aa = (a ?? "").trim();
  return `${nn} ${aa}`.trim() || "";
}

function safeDir(v: string | null) {
  return v === "desc" ? "desc" : "asc";
}

function safeSort(v: string | null) {
  const allowed = new Set(["rut", "sexo", "ded", "patente", "marca_modelo", "created_at", "nombre"]);
  return allowed.has(v ?? "") ? (v as string) : "nombre";
}

function safeFormat(v: string | null): "xlsx" | "csv" | "pdf" {
  if (v === "csv" || v === "pdf") return v;
  return "xlsx";
}

// Escapa un valor para CSV (comillas dobles si contiene comas/saltos/comillas)
function csvEscape(val: string): string {
  const s = String(val ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

const EXPORT_LIMIT = 10000;

export async function GET(req: Request) {
  // 1) Validar sesion
  const supabase = await createClient();
  const { data: userRes } = await supabase.auth.getUser();
  if (!userRes?.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const admin = createAdminClient();
  const url = new URL(req.url);

  const format    = safeFormat(url.searchParams.get("format"));
  const rutsParam = url.searchParams.get("ruts");
  const q         = (url.searchParams.get("q") ?? "").trim();
  const ded       = (url.searchParams.get("ded") ?? "").trim();
  const sexo      = (url.searchParams.get("sexo") ?? "").trim();
  const sort      = safeSort(url.searchParams.get("sort"));
  const dir       = safeDir(url.searchParams.get("dir"));

  let query = admin
    .from("miembros")
    .select(
      "rut,nombres,apellidos,sexo,ded,patente,marca_modelo,telefono,correo_electronico,estado_membresia,created_at"
    );

  if (rutsParam) {
    const ruts = rutsParam.split(",").map((s) => s.trim()).filter(Boolean);
    if (ruts.length === 0) return NextResponse.json({ error: "No se enviaron RUTs." }, { status: 400 });
    if (ruts.length > 5000) return NextResponse.json({ error: "Demasiados RUTs." }, { status: 400 });
    query = query.in("rut", ruts);
  } else {
    if (q)    query = query.or(`rut.ilike.%${q}%,nombres.ilike.%${q}%,apellidos.ilike.%${q}%`);
    if (ded)  { if (ded === "__SIN__") query = query.or("ded.is.null,ded.eq."); else query = query.eq("ded", ded); }
    if (sexo) { if (sexo === "__SIN__") query = query.or("sexo.is.null,sexo.eq."); else query = query.eq("sexo", sexo); }
    query = query.limit(EXPORT_LIMIT);
  }

  if (sort === "nombre") {
    query = query.order("nombres", { ascending: dir === "asc", nullsFirst: false });
    query = query.order("apellidos", { ascending: dir === "asc", nullsFirst: false });
  } else {
    query = query.order(sort, { ascending: dir === "asc", nullsFirst: false });
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []) as Row[];
  const today = new Date().toISOString().slice(0, 10);

  // ── CSV ──────────────────────────────────────────────────────────────────
  if (format === "csv") {
    const headers = ["RUT", "Nombre", "Sexo", "DED", "Patente", "Marca/Modelo",
                     "Telefono", "Email", "Estado Membresia", "Fecha Registro"];
    const csvLines = [
      headers.map(csvEscape).join(","),
      ...rows.map((r) =>
        [
          r.rut,
          formatNombre(r.nombres, r.apellidos),
          r.sexo ?? "",
          r.ded ?? "",
          r.patente ?? "",
          r.marca_modelo ?? "",
          r.telefono ?? "",
          r.correo_electronico ?? "",
          r.estado_membresia ?? "",
          r.created_at ? r.created_at.slice(0, 10) : "",
        ].map(csvEscape).join(",")
      ),
    ];

    // BOM UTF-8 para que Excel abra correctamente tildes y ñ
    const csv = "﻿" + csvLines.join("\r\n");
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="miembros_${today}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  }

  // ── PDF ───────────────────────────────────────────────────────────────────
  if (format === "pdf") {
    const pdfRows: PdfRow[] = rows.map((r) => ({
      rut:    r.rut,
      nombre: formatNombre(r.nombres, r.apellidos),
      sexo:   r.sexo ?? "",
      ded:    r.ded ?? "",
      tel:    r.telefono ?? "",
      email:  r.correo_electronico ?? "",
      estado: r.estado_membresia ?? "",
    }));

    const fecha = new Date().toLocaleDateString("es-CL", {
      day: "2-digit", month: "long", year: "numeric",
    });

    const pdfElement = React.createElement(MiembrosPdf, { rows: pdfRows, fecha });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buf = await renderToBuffer(pdfElement as any);

    return new NextResponse(buf as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="miembros_${today}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  }

  // ── XLSX (por defecto) ────────────────────────────────────────────────────
  const wb = new ExcelJS.Workbook();
  wb.creator = "Sistema Iglesia";
  wb.created = new Date();

  const ws = wb.addWorksheet("Miembros");
  ws.columns = [
    { header: "RUT",              key: "rut",              width: 14 },
    { header: "Nombre",           key: "nombre",           width: 30 },
    { header: "Sexo",             key: "sexo",             width: 10 },
    { header: "DED",              key: "ded",              width: 12 },
    { header: "Patente",          key: "patente",          width: 12 },
    { header: "Marca/Modelo",     key: "marca_modelo",     width: 18 },
    { header: "Telefono",         key: "telefono",         width: 16 },
    { header: "Email",            key: "email",            width: 28 },
    { header: "Estado Membresia", key: "estado_membresia", width: 18 },
    { header: "Creado en",        key: "created_at",       width: 20 },
  ];

  ws.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A5F" } };
  });

  rows.forEach((r) => {
    ws.addRow({
      rut:              r.rut,
      nombre:           formatNombre(r.nombres, r.apellidos),
      sexo:             r.sexo ?? "",
      ded:              r.ded ?? "",
      patente:          r.patente ?? "",
      marca_modelo:     r.marca_modelo ?? "",
      telefono:         r.telefono ?? "",
      email:            r.correo_electronico ?? "",
      estado_membresia: r.estado_membresia ?? "",
      created_at:       r.created_at ?? "",
    });
  });

  const xlsxBuf = await wb.xlsx.writeBuffer();
  return new NextResponse(xlsxBuf as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="miembros_${today}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
