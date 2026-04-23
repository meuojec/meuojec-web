// app/api/miembros/export/route.ts
import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

const EXPORT_LIMIT = 10000;

export async function GET(req: Request) {
  // 1) Validar sesion (cookies)
  const supabase = await createClient();
  const { data: userRes } = await supabase.auth.getUser();
  if (!userRes?.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  // 2) Admin para bypass RLS
  const admin = createAdminClient();

  const url = new URL(req.url);

  const rutsParam = url.searchParams.get("ruts"); // CSV
  const q = (url.searchParams.get("q") ?? "").trim();
  const ded = (url.searchParams.get("ded") ?? "").trim();
  const sexo = (url.searchParams.get("sexo") ?? "").trim();
  const sort = safeSort(url.searchParams.get("sort"));
  const dir = safeDir(url.searchParams.get("dir"));

  let query = admin
    .from("miembros")
    .select(
      "rut,nombres,apellidos,sexo,ded,patente,marca_modelo,telefono,correo_electronico,estado_membresia,created_at"
    );

  // A) Exportar seleccionados
  if (rutsParam) {
    const ruts = rutsParam
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (ruts.length === 0) {
      return NextResponse.json({ error: "No se enviaron RUTs." }, { status: 400 });
    }
    if (ruts.length > 5000) {
      return NextResponse.json(
        { error: "Demasiados RUTs para exportar en una sola solicitud." },
        { status: 400 }
      );
    }

    query = query.in("rut", ruts);
  } else {
    // B) Exportar todo lo filtrado (con limite de seguridad)
    if (q) {
      query = query.or(`rut.ilike.%${q}%,nombres.ilike.%${q}%,apellidos.ilike.%${q}%`);
    }

    if (ded) {
      if (ded === "__SIN__") query = query.or("ded.is.null,ded.eq.");
      else query = query.eq("ded", ded);
    }

    if (sexo) {
      if (sexo === "__SIN__") query = query.or("sexo.is.null,sexo.eq.");
      else query = query.eq("sexo", sexo);
    }

    // Limite de seguridad para evitar OOM en Vercel
    query = query.limit(EXPORT_LIMIT);
  }

  // Orden
  if (sort === "nombre") {
    query = query.order("nombres", { ascending: dir === "asc", nullsFirst: false });
    query = query.order("apellidos", { ascending: dir === "asc", nullsFirst: false });
  } else {
    query = query.order(sort, { ascending: dir === "asc", nullsFirst: false });
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as Row[];

  // Generar Excel con ExcelJS (ya instalado, no requiere xlsx)
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

  // Estilo de cabecera
  ws.getRow(1).eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1E3A5F" },
    };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
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

  const buf = await wb.xlsx.writeBuffer();
  const filename = `miembros_${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new NextResponse(buf as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
