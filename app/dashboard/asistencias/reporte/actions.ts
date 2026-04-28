"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function deleteAsistenciaByCreatedAt(input: {
  rut: string;
  created_at: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado" };

  const { error } = await supabase
    .from("asistencias")
    .delete()
    .eq("rut", input.rut)
    .eq("created_at", input.created_at);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/asistencias/reporte");
  return { ok: true };
}

export type AsistenciaDataRow = {
  rut: string;
  nombre: string;
  sexo: string | null;
  ded: string | null;
  fecha: string | null;
  hora: string | null;
  sesion: string | null;
  sesion_id: string | null;
  evento: string | null;
  created_at: string | null;
};

export type AsistenciasData = {
  kpis: {
    total: number;
    unicos: number;
    nuevos: number;
    recurrentes: number;
    hombres: number;
    mujeres: number;
    sinSexo: number;
  };
  trendDay: { fecha: string; total: number }[];
  topDed: { ded: string; total: number }[];
  rows: AsistenciaDataRow[];
};

export async function getAsistenciasData(params: {
  from: string;
  to: string;
  q?: string;
  ded?: string;
  evento?: string;
  sesion?: string;
}): Promise<AsistenciasData> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const admin = createAdminClient();
  const q = (params.q ?? "").trim();

  let rutsFiltrados: string[] | null = null;
  if (q) {
    const esRut = /^[\d\-kK]+$/.test(q);
    if (esRut) {
      rutsFiltrados = [q.toUpperCase()];
    } else {
      const { data: ms } = await admin
        .from("miembros")
        .select("rut")
        .or(`nombres.ilike.%${q}%,apellidos.ilike.%${q}%`)
        .limit(500);
      rutsFiltrados = ((ms ?? []) as any[]).map((m) => m.rut as string).filter(Boolean);
      if (rutsFiltrados.length === 0) return emptyData();
    }
  }

  let query = admin
    .from("asistencias")
    .select("rut,fecha,hora,ded,evento_sesion_id,id_evento,created_at")
    .gte("fecha", params.from)
    .lte("fecha", params.to)
    .order("fecha", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(5000);

  if (rutsFiltrados) query = query.in("rut", rutsFiltrados);
  if (params.ded) query = query.eq("ded", params.ded);
  if (params.evento) query = query.eq("id_evento", params.evento);
  if (params.sesion) query = query.eq("evento_sesion_id", params.sesion);

  const { data: asist, error } = await query;
  if (error) throw error;

  type RawRow = {
    rut: string | null;
    fecha: string | null;
    hora: string | null;
    ded: string | null;
    evento_sesion_id: string | null;
    id_evento: string | null;
    created_at: string | null;
  };
  const raw = (asist ?? []) as RawRow[];

  const ruts = Array.from(new Set(raw.map((r) => r.rut).filter(Boolean))) as string[];

  type MiembroMini = { rut: string; nombres: string | null; apellidos: string | null; sexo: string | null };
  const miembrosMap = new Map<string, MiembroMini>();
  if (ruts.length > 0) {
    const { data: ms } = await admin.from("miembros").select("rut,nombres,apellidos,sexo").in("rut", ruts);
    ((ms ?? []) as any[]).forEach((m) => { if (m?.rut) miembrosMap.set(String(m.rut), m as MiembroMini); });
  }

  const sesionIds = Array.from(new Set(raw.map((r) => r.evento_sesion_id).filter(Boolean))) as string[];
  type SesionMeta = { id: string; nombre: string | null };
  const sesionMap = new Map<string, SesionMeta>();
  if (sesionIds.length > 0) {
    const { data: ss } = await admin.from("eventos_sesiones").select("id,nombre").in("id", sesionIds);
    ((ss ?? []) as any[]).forEach((s) => { if (s?.id) sesionMap.set(String(s.id), s as SesionMeta); });
  }

  const rows: AsistenciaDataRow[] = raw.map((r) => {
    const m = r.rut ? miembrosMap.get(r.rut) : null;
    const ses = r.evento_sesion_id ? sesionMap.get(r.evento_sesion_id) : null;
    const nombre = m ? `${(m.nombres ?? "").trim()} ${(m.apellidos ?? "").trim()}`.trim() : (r.rut ?? "");
    return {
      rut: r.rut ?? "",
      nombre,
      sexo: m?.sexo ?? null,
      ded: r.ded ?? null,
      fecha: r.fecha,
      hora: r.hora ? r.hora.slice(0, 5) : null,
      sesion: ses?.nombre ?? null,
      sesion_id: r.evento_sesion_id ?? null,
      evento: r.id_evento ?? null,
      created_at: r.created_at,
    };
  });

  const total = rows.length;
  const rutSet = new Set(rows.map((r) => r.rut).filter(Boolean));
  const unicos = rutSet.size;

  let nuevos = 0, recurrentes = 0;
  if (ruts.length > 0 && total > 0) {
    const { data: firsts } = await admin
      .from("asistencias").select("rut,fecha").in("rut", [...rutSet]).order("rut").order("fecha");
    const firstDate = new Map<string, string>();
    ((firsts ?? []) as any[]).forEach((r) => { if (r?.rut && r?.fecha && !firstDate.has(r.rut)) firstDate.set(r.rut, r.fecha); });
    for (const rut of rutSet) {
      const fd = firstDate.get(rut);
      if (fd && fd >= params.from && fd <= params.to) nuevos++;
      else recurrentes++;
    }
  }

  let hombres = 0, mujeres = 0, sinSexo = 0;
  const contados = new Set<string>();
  for (const r of rows) {
    if (!r.rut || contados.has(r.rut)) continue;
    contados.add(r.rut);
    const s = (r.sexo ?? "").trim().toLowerCase();
    if (s === "masculino" || s === "m") hombres++;
    else if (s === "femenino" || s === "f") mujeres++;
    else sinSexo++;
  }

  const byDay = new Map<string, number>();
  for (const r of rows) { if (!r.fecha) continue; byDay.set(r.fecha, (byDay.get(r.fecha) ?? 0) + 1); }
  const trendDay = [...byDay.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([fecha, total]) => ({ fecha, total }));

  const byDed = new Map<string, number>();
  for (const r of rows) { const k = (r.ded ?? "Sin DED").trim() || "Sin DED"; byDed.set(k, (byDed.get(k) ?? 0) + 1); }
  const topDed = [...byDed.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15).map(([ded, total]) => ({ ded, total }));

  return { kpis: { total, unicos, nuevos, recurrentes, hombres, mujeres, sinSexo }, trendDay, topDed, rows };
}

function emptyData(): AsistenciasData {
  return { kpis: { total: 0, unicos: 0, nuevos: 0, recurrentes: 0, hombres: 0, mujeres: 0, sinSexo: 0 }, trendDay: [], topDed: [], rows: [] };
}

export async function getEventosDeds() {
  const supabase = await createClient();
  const [ev, dedData] = await Promise.all([
    supabase.from("eventos").select("id,id_evento,nombre").order("nombre"),
    supabase.from("miembros").select("ded").not("ded", "is", null).order("ded"),
  ]);

  const eventos = ((ev.data ?? []) as any[])
    .filter((e) => e?.id_evento)
    .map((e) => ({ value: String(e.id_evento), label: String(e.nombre ?? e.id_evento) }));

  const dedsSet = new Set<string>();
  ((dedData.data ?? []) as any[]).forEach((r) => { const d = (r.ded ?? "").trim(); if (d) dedsSet.add(d); });
  const deds = [...dedsSet].sort().map((d) => ({ value: d, label: d }));

  return { eventos, deds };
}
