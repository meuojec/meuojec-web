"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const AREA_FIJA = "IGLESIA";

type Tipo = "TODOS" | "INGRESO" | "EGRESO" | "TRANSFERENCIA";

type MovLite = {
  id: string;
  fecha: string | null; // YYYY-MM-DD
  tipo: string | null; // INGRESO|EGRESO|TRANSFERENCIA
  monto: number | null; // numeric -> lo recibimos como number
  categoria_id: string | null;
};

type Categoria = {
  id: string;
  nombre: string | null;
  tipo: string | null; // INGRESO|EGRESO
  orden: number | null;
  activa: boolean | null;
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function firstDayOfMonthISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}

async function requireUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data?.user) redirect("/login");
  return { supabase, user: data.user };
}

export type ReportFilters = {
  desde?: string; // YYYY-MM-DD
  hasta?: string; // YYYY-MM-DD
  tipo?: Tipo;
};

export type Kpis = {
  totalIngresos: number;
  totalEgresos: number;
  totalTransferencias: number;
  saldo: number;
  count: number;
};

export type CategoriaTotalRow = {
  categoria_id: string;
  nombre: string;
  tipo: "INGRESO" | "EGRESO";
  total: number;
  porcentaje: number; // 0..100 dentro de su grupo
};

export type SerieMesRow = {
  mes: string; // YYYY-MM
  ingresos: number;
  egresos: number;
  transferencias: number;
  saldo: number;
};

export type ReportData = {
  filters: Required<Pick<ReportFilters, "desde" | "hasta" | "tipo">>;
  kpis: Kpis;
  totalesPorCategoria: CategoriaTotalRow[];
  serieMensual: SerieMesRow[];
  // para export
  export_categoria: Array<{ mes?: string; categoria?: string; tipo?: string; total?: number; porcentaje?: number }>;
  export_serie: Array<{ mes: string; ingresos: number; egresos: number; transferencias: number; saldo: number }>;
};

export async function getReportesIGLESIA(filters?: ReportFilters): Promise<ReportData> {
  const { supabase } = await requireUser();

  const desde = (filters?.desde || firstDayOfMonthISO()).slice(0, 10);
  const hasta = (filters?.hasta || todayISO()).slice(0, 10);
  const tipo = (filters?.tipo || "TODOS") as Tipo;

  // 1) Traer movimientos mínimos (para cálculos en JS)
  let q = supabase
    .from("fin_movimientos")
    .select("id,fecha,tipo,monto,categoria_id", { count: "exact" })
    .eq("area", AREA_FIJA)
    .gte("fecha", desde)
    .lte("fecha", hasta);

  if (tipo !== "TODOS") q = q.eq("tipo", tipo);

  const { data: movsData, error: movErr, count } = await q.order("fecha", { ascending: true });

  if (movErr) {
    // devolvemos vacío pero con filtros para que la UI muestre el error arriba si quieres
    return {
      filters: { desde, hasta, tipo },
      kpis: { totalIngresos: 0, totalEgresos: 0, totalTransferencias: 0, saldo: 0, count: 0 },
      totalesPorCategoria: [],
      serieMensual: [],
      export_categoria: [],
      export_serie: [],
    };
  }

  const movs = (movsData ?? []) as MovLite[];

  // 2) Traer categorías (para nombres/tipo/orden)
  const { data: catsData } = await supabase
    .from("fin_categorias")
    .select("id,nombre,tipo,orden,activa")
    .eq("area", AREA_FIJA);

  const cats = (catsData ?? []) as Categoria[];
  const catMap = new Map(cats.map((c) => [c.id, c]));

  // 3) KPIs
  let totalIngresos = 0;
  let totalEgresos = 0;
  let totalTransferencias = 0;

  for (const m of movs) {
    const monto = typeof m.monto === "number" ? m.monto : 0;
    if (m.tipo === "INGRESO") totalIngresos += monto;
    else if (m.tipo === "EGRESO") totalEgresos += monto;
    else if (m.tipo === "TRANSFERENCIA") totalTransferencias += monto;
  }

  const saldo = totalIngresos - totalEgresos;

  // 4) Totales por categoría (solo movimientos NO transferencia y con categoria_id)
  const sumByCatIngreso = new Map<string, number>();
  const sumByCatEgreso = new Map<string, number>();

  for (const m of movs) {
    if (!m.categoria_id) continue;
    if (m.tipo !== "INGRESO" && m.tipo !== "EGRESO") continue;

    const monto = typeof m.monto === "number" ? m.monto : 0;
    if (m.tipo === "INGRESO") sumByCatIngreso.set(m.categoria_id, (sumByCatIngreso.get(m.categoria_id) ?? 0) + monto);
    if (m.tipo === "EGRESO") sumByCatEgreso.set(m.categoria_id, (sumByCatEgreso.get(m.categoria_id) ?? 0) + monto);
  }

  const totalesPorCategoria: CategoriaTotalRow[] = [];

  const pushCatRows = (map: Map<string, number>, groupTotal: number, forcedTipo: "INGRESO" | "EGRESO") => {
    for (const [categoria_id, total] of map.entries()) {
      const cat = catMap.get(categoria_id);
      const nombre = (cat?.nombre ?? "Sin nombre").toString();
      const tipoCat = (cat?.tipo ?? forcedTipo) as "INGRESO" | "EGRESO";

      const porcentaje = groupTotal > 0 ? (total / groupTotal) * 100 : 0;

      totalesPorCategoria.push({
        categoria_id,
        nombre,
        tipo: tipoCat,
        total,
        porcentaje,
      });
    }
  };

  // porcentaje dentro de su grupo
  pushCatRows(sumByCatIngreso, totalIngresos, "INGRESO");
  pushCatRows(sumByCatEgreso, totalEgresos, "EGRESO");

  // ordenar: por tipo, luego por "orden" (si existe), luego por total desc
  totalesPorCategoria.sort((a, b) => {
    if (a.tipo !== b.tipo) return a.tipo === "INGRESO" ? -1 : 1;
    const oa = catMap.get(a.categoria_id)?.orden ?? 999999;
    const ob = catMap.get(b.categoria_id)?.orden ?? 999999;
    if (oa !== ob) return oa - ob;
    return b.total - a.total;
  });

  // 5) Serie mensual (YYYY-MM)
  const byMes = new Map<string, SerieMesRow>();

  for (const m of movs) {
    const fecha = m.fecha;
    if (!fecha || fecha.length < 7) continue;
    const mes = fecha.slice(0, 7);
    const monto = typeof m.monto === "number" ? m.monto : 0;

    if (!byMes.has(mes)) {
      byMes.set(mes, { mes, ingresos: 0, egresos: 0, transferencias: 0, saldo: 0 });
    }
    const row = byMes.get(mes)!;

    if (m.tipo === "INGRESO") row.ingresos += monto;
    else if (m.tipo === "EGRESO") row.egresos += monto;
    else if (m.tipo === "TRANSFERENCIA") row.transferencias += monto;

    row.saldo = row.ingresos - row.egresos;
  }

  // orden cronológico
  const serieMensual = Array.from(byMes.values()).sort((a, b) => a.mes.localeCompare(b.mes));

  // 6) Export data (CSV)
  const export_categoria = totalesPorCategoria.map((r) => ({
    categoria: r.nombre,
    tipo: r.tipo,
    total: r.total,
    porcentaje: Math.round(r.porcentaje * 100) / 100,
  }));

  const export_serie = serieMensual.map((r) => ({
    mes: r.mes,
    ingresos: r.ingresos,
    egresos: r.egresos,
    transferencias: r.transferencias,
    saldo: r.saldo,
  }));

  return {
    filters: { desde, hasta, tipo },
    kpis: {
      totalIngresos,
      totalEgresos,
      totalTransferencias,
      saldo,
      count: count ?? movs.length,
    },
    totalesPorCategoria,
    serieMensual,
    export_categoria,
    export_serie,
  };
}
