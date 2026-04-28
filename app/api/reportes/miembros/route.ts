import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type Miembro = {
  rut: string;
  nombres: string | null;
  apellidos: string | null;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  fecha_nacimiento: string | null;
  sexo: string | null;
  estado: string | null;
  ded: string | null;
  fecha_ingreso: string | null;
};

function escapeCsv(v: string | null | undefined): string {
  const s = v ?? "";
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("miembros")
    .select("rut,nombres,apellidos,email,telefono,direccion,fecha_nacimiento,sexo,estado,ded,fecha_ingreso")
    .order("apellidos", { ascending: true })
    .order("nombres",   { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []) as Miembro[];

  const headers = ["RUT","Nombres","Apellidos","Email","Teléfono","Dirección","Fecha Nacimiento","Sexo","Estado","DED","Fecha Ingreso"];
  const lines = [
    headers.join(","),
    ...rows.map((m) =>
      [
        escapeCsv(m.rut),
        escapeCsv(m.nombres),
        escapeCsv(m.apellidos),
        escapeCsv(m.email),
        escapeCsv(m.telefono),
        escapeCsv(m.direccion),
        escapeCsv(m.fecha_nacimiento),
        escapeCsv(m.sexo),
        escapeCsv(m.estado),
        escapeCsv(m.ded),
        escapeCsv(m.fecha_ingreso),
      ].join(",")
    ),
  ];

  const csv = "﻿" + lines.join("\r\n"); // BOM para Excel en español

  const fecha = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="miembros_${fecha}.csv"`,
    },
  });
}
