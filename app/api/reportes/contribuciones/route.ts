import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Contribucion = {
  id: string;
  miembro_rut: string | null;
  anonimo: boolean;
  tipo: string;
  monto: string | number;
  fecha: string;
  notas: string | null;
  created_at: string;
};

function escapeCsv(v: string | null | undefined): string {
  const s = v ?? "";
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const desde = searchParams.get("desde");
  const hasta = searchParams.get("hasta");

  let query = supabase
    .from("contribuciones")
    .select("id,miembro_rut,anonimo,tipo,monto,fecha,notas,created_at")
    .order("fecha", { ascending: false });

  if (desde) query = query.gte("fecha", desde);
  if (hasta) query = query.lte("fecha", hasta);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []) as Contribucion[];

  const totalGeneral = rows.reduce((s, c) => s + Number(c.monto ?? 0), 0);

  const headers = ["Fecha","Miembro RUT","Anónimo","Tipo","Monto (CLP)","Notas","Registrado"];
  const lines = [
    headers.join(","),
    ...rows.map((c) =>
      [
        escapeCsv(c.fecha),
        c.anonimo ? escapeCsv("Anónimo") : escapeCsv(c.miembro_rut),
        escapeCsv(c.anonimo ? "Sí" : "No"),
        escapeCsv(c.tipo),
        String(Number(c.monto ?? 0)),
        escapeCsv(c.notas),
        escapeCsv(c.created_at?.slice(0, 10)),
      ].join(",")
    ),
    "",
    `TOTAL,,,,${totalGeneral},,`,
  ];

  const csv = "﻿" + lines.join("\r\n");

  const fecha = new Date().toISOString().slice(0, 10);
  const filename = desde && hasta
    ? `contribuciones_${desde}_${hasta}.csv`
    : `contribuciones_${fecha}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
