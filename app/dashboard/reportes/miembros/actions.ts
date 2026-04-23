// app/dashboard/reportes/miembros/actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";

type MiembroRow = {
  rut: string;
  nombres: string | null;
  apellidos: string | null;
  ded: string | null;
  sexo: string | null;
  fecha_nacimiento: string | null; // YYYY-MM-DD (ideal) o null
  edad: number | string | null;
  foto_url: string | null;
  foto_path: string | null;
  created_at: string | null;
};

function safeISO(s?: string | null) {
  if (!s) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  return s;
}

function monthDay(fechaISO: string) {
  // "YYYY-MM-DD" -> "MM-DD"
  return fechaISO.slice(5, 10);
}

function currentMonthStr() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return m; // "02"
}

function missingFields(m: MiembroRow) {
  const faltantes: string[] = [];
  if (!m.nombres?.trim()) faltantes.push("nombres");
  if (!m.apellidos?.trim()) faltantes.push("apellidos");
  if (!m.sexo?.trim()) faltantes.push("sexo");
  if (!m.ded?.trim()) faltantes.push("ded");
  // fecha_nacimiento o edad (con que tenga uno)
  if (!m.fecha_nacimiento && (m.edad === null || m.edad === "")) faltantes.push("fecha_nacimiento/edad");
  // foto
  if (!m.foto_url && !m.foto_path) faltantes.push("foto");
  return faltantes;
}

export async function getMiembrosReport(params: {
  from: string;
  to: string;
  ded?: string;
  sexo?: string;
  incompletos?: boolean;
}) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const from = safeISO(params.from);
  const to = safeISO(params.to);
  if (!from || !to) throw new Error("Rango inválido");
  if (from > to) throw new Error("Rango inválido");

  // Base query
  let q = supabase
    .from("miembros")
    .select("rut,nombres,apellidos,ded,sexo,fecha_nacimiento,edad,foto_url,foto_path,created_at");

  if (params.ded) q = q.eq("ded", params.ded);
  if (params.sexo) q = q.eq("sexo", params.sexo);

  const { data, error } = await q;
  if (error) throw error;

  const rows = (data ?? []) as MiembroRow[];

  // KPIs
  const totalMiembros = rows.length;

  // Nuevos en el rango: created_at dentro [from,to]
  const nuevosRango = rows.filter((m) => {
    const c = m.created_at?.slice(0, 10);
    return c ? c >= from && c <= to : false;
  }).length;

  // Incompletos
  const incompletosDetalleAll = rows
    .map((m) => {
      const faltantes = missingFields(m);
      return {
        rut: m.rut,
        nombre: `${m.nombres ?? ""} ${m.apellidos ?? ""}`.trim() || "—",
        ded: m.ded,
        faltantes,
      };
    })
    .filter((x) => x.faltantes.length > 0);

  const incompletos = incompletosDetalleAll.length;

  const completos = totalMiembros - incompletos;
  const pctCompletos = totalMiembros === 0 ? 0 : Math.round((completos / totalMiembros) * 100);

  // Si filtro incompletos = true, devolvemos detalle solo incompletos, pero KPIs se mantienen del set filtrado
  const incompletosDetalle = params.incompletos ? incompletosDetalleAll : incompletosDetalleAll;

  // Top DED
  const byDed = new Map<string, number>();
  for (const m of rows) {
    const k = (m.ded || "SIN DED").trim() || "SIN DED";
    byDed.set(k, (byDed.get(k) || 0) + 1);
  }
  const topDed = [...byDed.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([ded, total]) => ({ ded, total }));

  // Cumples del mes (mes actual) — usa fecha_nacimiento
  const mes = currentMonthStr(); // "02"
  const cumplesMes = rows
    .filter((m) => m.fecha_nacimiento && m.fecha_nacimiento.slice(5, 7) === mes)
    .map((m) => {
      const dia = m.fecha_nacimiento!.slice(8, 10);
      return {
        dia,
        rut: m.rut,
        nombre: `${m.nombres ?? ""} ${m.apellidos ?? ""}`.trim() || "—",
        ded: m.ded,
      };
    })
    .sort((a, b) => a.dia.localeCompare(b.dia));

  // Si el usuario puso filtro incompletos=1, la tabla principal se centra en incompletos,
  // pero NO ocultamos cumples/topded porque siguen siendo valiosos.
  let incompletosDetalleOut = incompletosDetalleAll;
  if (params.incompletos) incompletosDetalleOut = incompletosDetalleAll;

  return {
    kpis: {
      totalMiembros,
      nuevosRango,
      incompletos,
      pctCompletos,
    },
    topDed,
    cumplesMes,
    incompletosDetalle: incompletosDetalleOut,
    rows, // útil para export si quieres
  };
}

function escCsv(v: any) {
  const s = String(v ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function exportMiembrosCsv(params: {
  from: string;
  to: string;
  ded?: string;
  sexo?: string;
  incompletos?: boolean;
}) {
  const rep = await getMiembrosReport(params);

  const header = [
    "rut",
    "nombres",
    "apellidos",
    "ded",
    "sexo",
    "fecha_nacimiento",
    "edad",
    "foto_url",
    "foto_path",
    "created_at",
  ];
  const lines = [header.join(",")];

  for (const m of rep.rows) {
    lines.push(
      [
        escCsv(m.rut),
        escCsv(m.nombres),
        escCsv(m.apellidos),
        escCsv(m.ded),
        escCsv(m.sexo),
        escCsv(m.fecha_nacimiento),
        escCsv(m.edad),
        escCsv(m.foto_url),
        escCsv(m.foto_path),
        escCsv(m.created_at),
      ].join(",")
    );
  }

  return { csv: lines.join("\n") };
}