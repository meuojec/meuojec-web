// app/dashboard/reportes/asistencia/actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";

type AsistenciaRow = {
  rut: string | null;
  fecha: string | null; // YYYY-MM-DD (date)
  hora: string | null;  // time
  ded: string | null;
  id_evento: string | null; // según tu tabla
  evento_sesion_id: string | null; // ✅ en tu screenshot
  created_at: string | null;
};

type SesionRow = {
  id: string; // uuid
  nombre: string | null;
  fecha: string | null; // si existe
  hora: string | null;  // si existe
};

function safeISO(s?: string | null) {
  if (!s) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  return s;
}

function yyyymm(d: string) {
  return d.slice(0, 7); // YYYY-MM
}

function weekKeyISO(dateISO: string) {
  // Week key as "YYYY-Www" based on Monday week start (ISO-like)
  // We'll compute the Monday of the week, then format as YYYY-MM-DD (week start)
  const d = new Date(dateISO + "T00:00:00Z");
  const day = d.getUTCDay(); // 0..6 (Sun..Sat)
  const diffToMonday = (day === 0 ? -6 : 1) - day; // move back to Monday
  d.setUTCDate(d.getUTCDate() + diffToMonday);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`; // week start (Monday)
}

function escCsv(v: any) {
  const s = String(v ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function getAsistenciaReport(params: {
  from: string;
  to: string;
  ded?: string;
  evento?: string; // id_evento
  sesion?: string; // evento_sesion_id
}) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const from = safeISO(params.from);
  const to = safeISO(params.to);
  if (!from || !to || from > to) throw new Error("Rango de fechas inválido");

  let q = supabase
    .from("asistencias")
    .select("rut,fecha,hora,ded,id_evento,evento_sesion_id,created_at")
    .gte("fecha", from)
    .lte("fecha", to);

  if (params.ded) q = q.eq("ded", params.ded);
  if (params.evento) q = q.eq("id_evento", params.evento);
  if (params.sesion) q = q.eq("evento_sesion_id", params.sesion);

  const { data, error } = await q;
  if (error) throw error;

  const rows = (data ?? []) as AsistenciaRow[];

  // KPIs
  const totalRegistros = rows.length;
  const rutSet = new Set(rows.map(r => r.rut).filter(Boolean) as string[]);
  const totalUnicos = rutSet.size;

  // Tendencias
  const byDay = new Map<string, number>();
  const byWeek = new Map<string, number>();   // key = monday YYYY-MM-DD
  const byMonth = new Map<string, number>();  // key = YYYY-MM

  for (const r of rows) {
    const f = r.fecha;
    if (!f) continue;

    byDay.set(f, (byDay.get(f) || 0) + 1);

    const wk = weekKeyISO(f);
    byWeek.set(wk, (byWeek.get(wk) || 0) + 1);

    const mo = yyyymm(f);
    byMonth.set(mo, (byMonth.get(mo) || 0) + 1);
  }

  const trendDay = [...byDay.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([fecha, total]) => ({ key: fecha, total }));

  const trendWeek = [...byWeek.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([weekStart, total]) => ({ key: weekStart, total }));

  const trendMonth = [...byMonth.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, total]) => ({ key: month, total }));

  // Top DED
  const byDed = new Map<string, number>();
  for (const r of rows) {
    const k = (r.ded || "SIN DED").trim() || "SIN DED";
    byDed.set(k, (byDed.get(k) || 0) + 1);
  }
  const topDed = [...byDed.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([ded, total]) => ({ ded, total }));

  // Comparativo por sesión (evento_sesion_id)
  const bySesion = new Map<string, { total: number; ruts: Set<string> }>();
  for (const r of rows) {
    const sid = r.evento_sesion_id;
    if (!sid) continue;
    const cur = bySesion.get(sid) || { total: 0, ruts: new Set<string>() };
    cur.total += 1;
    if (r.rut) cur.ruts.add(r.rut);
    bySesion.set(sid, cur);
  }

  const sesionIds = [...bySesion.keys()];

  // Traer metadata de sesiones (si existe tabla eventos_sesiones)
  let sesionesMeta = new Map<string, SesionRow>();
  if (sesionIds.length > 0) {
    const { data: sesData } = await supabase
      .from("eventos_sesiones")
      .select("id,nombre,fecha,hora")
      .in("id", sesionIds);

    for (const s of (sesData ?? []) as any[]) {
      if (s?.id) sesionesMeta.set(s.id, s as SesionRow);
    }
  }

  const comparativoSesiones = sesionIds
    .map((id) => {
      const agg = bySesion.get(id)!;
      const meta = sesionesMeta.get(id);
      return {
        id,
        nombre: meta?.nombre ?? "Sesión",
        fecha: meta?.fecha ?? null,
        hora: meta?.hora ?? null,
        total: agg.total,
        unicos: agg.ruts.size,
      };
    })
    .sort((a, b) => b.total - a.total);

  // Nuevos vs recurrentes (v2: primera fecha histórica por rut, tomando solo columnas mínimas)
  let nuevos = 0;
  let recurrentes = 0;
  const ruts = [...rutSet];

  if (ruts.length > 0) {
    const { data: firsts, error: e2 } = await supabase
      .from("asistencias")
      .select("rut,fecha")
      .in("rut", ruts)
      .order("rut", { ascending: true })
      .order("fecha", { ascending: true });

    if (!e2 && firsts) {
      const firstDateByRut = new Map<string, string>();
      for (const r of firsts as any[]) {
        const rut = r.rut as string | null;
        const fecha = r.fecha as string | null;
        if (!rut || !fecha) continue;
        if (!firstDateByRut.has(rut)) firstDateByRut.set(rut, fecha);
      }
      for (const rut of ruts) {
        const fd = firstDateByRut.get(rut);
        if (fd && fd >= from && fd <= to) nuevos++;
        else recurrentes++;
      }
    } else {
      recurrentes = totalUnicos;
    }
  }

  return {
    kpis: { totalRegistros, totalUnicos, nuevos, recurrentes },
    trendDay,
    trendWeek,
    trendMonth,
    topDed,
    comparativoSesiones,
    rows,
  };
}

export async function exportAsistenciaCsv(params: {
  from: string;
  to: string;
  ded?: string;
  evento?: string;
  sesion?: string;
}) {
  const rep = await getAsistenciaReport(params);

  const header = [
    "rut",
    "fecha",
    "hora",
    "ded",
    "id_evento",
    "evento_sesion_id",
    "created_at",
  ];
  const lines = [header.join(",")];

  for (const r of rep.rows) {
    lines.push(
      [
        escCsv(r.rut),
        escCsv(r.fecha),
        escCsv(r.hora),
        escCsv(r.ded),
        escCsv(r.id_evento),
        escCsv(r.evento_sesion_id),
        escCsv(r.created_at),
      ].join(",")
    );
  }

  return { csv: lines.join("\n") };
}