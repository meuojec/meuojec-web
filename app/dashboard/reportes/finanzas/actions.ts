"use server";

import { createClient } from "@/lib/supabase/server";

type AnyRow = Record<string, any>;

function safeISO(s?: string | null) {
  if (!s) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  return s;
}
function yyyymm(dateISO: string) {
  return dateISO.slice(0, 7);
}
function escCsv(v: any) {
  const s = String(v ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
function num(n: any) {
  const x = typeof n === "number" ? n : Number(n);
  return Number.isFinite(x) ? x : 0;
}
function normTipo(t?: any) {
  const s = String(t ?? "").trim().toUpperCase();
  if (s === "INGRESO") return "INGRESO";
  if (s === "EGRESO") return "EGRESO";
  if (s === "INCOME") return "INGRESO";
  if (s === "EXPENSE") return "EGRESO";
  return s || "OTRO";
}
function shortId(id: string) {
  return `${id.slice(0, 8)}…${id.slice(-4)}`;
}

function pickTipoField(r: AnyRow): string {
  const candidates = [
    "tipo_fin_tipo_movimiento",
    "tipo_movimiento",
    "tipo",
    "fin_tipo_movimiento",
  ];
  for (const k of candidates) {
    if (k in r) return k;
  }
  for (const [k, v] of Object.entries(r)) {
    const s = String(v ?? "").toUpperCase();
    if (s === "INGRESO" || s === "EGRESO") return k;
  }
  return "";
}

function pickNameField(sample: AnyRow): string {
  // Priorizamos nombres típicos
  const prefer = ["nombre", "name", "titulo", "title", "descripcion", "detalle", "alias"];
  for (const k of prefer) {
    if (k in sample && typeof sample[k] === "string" && String(sample[k]).trim()) return k;
  }
  // Fallback: primer string no vacío que no sea id/created_at/etc
  for (const [k, v] of Object.entries(sample)) {
    if (
      typeof v === "string" &&
      v.trim() &&
      !["id", "created_at", "updated_at", "user_id"].includes(k)
    ) {
      return k;
    }
  }
  return "";
}

async function buildIdToNameMap(supabase: any, table: string): Promise<Map<string, string>> {
  const map = new Map<string, string>();

  // Traemos pocas columnas para no fallar si no existen:
  // - siempre pedimos "id" y "*" (pero limitamos filas), para detectar el campo nombre.
  const { data, error } = await supabase.from(table).select("*").limit(5000);
  if (error) {
    // si no existe la tabla o no hay permisos, devolvemos vacío sin romper
    return map;
  }
  const rows = (data ?? []) as AnyRow[];
  if (!rows.length) return map;

  const nameField = pickNameField(rows[0]);
  for (const r of rows) {
    const id = String(r.id ?? "");
    if (!id) continue;
    const name = nameField ? String(r[nameField] ?? "").trim() : "";
    if (name) map.set(id, name);
  }
  return map;
}

export async function getFinanzasReport(params: {
  from: string;
  to: string;
  tipo?: "INGRESO" | "EGRESO";
  cuenta?: string;
  categoria?: string;
}) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const from = safeISO(params.from);
  const to = safeISO(params.to);
  if (!from || !to || from > to) throw new Error("Rango inválido");

  // ✅ Construimos mapas id->nombre (robusto)
  const [catMap, cuentaMap] = await Promise.all([
    buildIdToNameMap(supabase, "fin_categorias"),
    buildIdToNameMap(supabase, "fin_cuentas"),
  ]);

  // Movimientos (robusto)
  let q = supabase
    .from("fin_movimientos")
    .select("*")
    .gte("fecha", from)
    .lte("fecha", to)
    .order("fecha", { ascending: true });

  if (params.cuenta) q = q.eq("cuenta_id", params.cuenta);
  if (params.categoria) q = q.eq("categoria_id", params.categoria);

  const { data, error } = await q;
  if (error) throw error;

  const rows = (data ?? []) as AnyRow[];

  const tipoField = rows.length ? pickTipoField(rows[0]) : "";

  const filtered =
    params.tipo && tipoField
      ? rows.filter((r) => normTipo(r[tipoField]) === params.tipo)
      : rows;

  let ingresos = 0;
  let egresos = 0;

  for (const t of filtered) {
    const m = num(t.monto);
    const tipo = tipoField ? normTipo(t[tipoField]) : "OTRO";
    if (tipo === "INGRESO") ingresos += m;
    else if (tipo === "EGRESO") egresos += m;
  }

  const saldo = ingresos - egresos;
  const totalMovs = filtered.length;

  // Serie mensual
  const byMonth = new Map<string, { ingresos: number; egresos: number }>();
  for (const t of filtered) {
    const f = t.fecha as string | null;
    if (!f) continue;
    const k = yyyymm(f);
    const cur = byMonth.get(k) || { ingresos: 0, egresos: 0 };
    const m = num(t.monto);
    const tipo = tipoField ? normTipo(t[tipoField]) : "OTRO";
    if (tipo === "INGRESO") cur.ingresos += m;
    else if (tipo === "EGRESO") cur.egresos += m;
    byMonth.set(k, cur);
  }

  const serieMensual = [...byMonth.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([mes, v]) => ({
      mes, // "YYYY-MM" (lo formateamos en page.tsx)
      ingresos: v.ingresos,
      egresos: v.egresos,
      saldo: v.ingresos - v.egresos,
    }));

  // Top Categorías
  const byCatIn = new Map<string, number>();
  const byCatEg = new Map<string, number>();

  for (const t of filtered) {
    const m = num(t.monto);
    const tipo = tipoField ? normTipo(t[tipoField]) : "OTRO";
    const id = (t.categoria_id as string | null) || "SIN_CATEGORIA";
    if (tipo === "INGRESO") byCatIn.set(id, (byCatIn.get(id) || 0) + m);
    if (tipo === "EGRESO") byCatEg.set(id, (byCatEg.get(id) || 0) + m);
  }

  const topCategoriasIngreso = [...byCatIn.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id, total]) => ({
      id,
      nombre:
        id === "SIN_CATEGORIA"
          ? "SIN CATEGORÍA"
          : (catMap.get(id) || shortId(id)),
      total,
    }));

  const topCategoriasEgreso = [...byCatEg.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id, total]) => ({
      id,
      nombre:
        id === "SIN_CATEGORIA"
          ? "SIN CATEGORÍA"
          : (catMap.get(id) || shortId(id)),
      total,
    }));

  // Por cuenta
  const byCuenta = new Map<string, { ingresos: number; egresos: number; movs: number }>();
  for (const t of filtered) {
    const id = (t.cuenta_id as string | null) || "SIN_CUENTA";
    const cur = byCuenta.get(id) || { ingresos: 0, egresos: 0, movs: 0 };
    const m = num(t.monto);
    const tipo = tipoField ? normTipo(t[tipoField]) : "OTRO";
    if (tipo === "INGRESO") cur.ingresos += m;
    if (tipo === "EGRESO") cur.egresos += m;
    cur.movs += 1;
    byCuenta.set(id, cur);
  }

  const porCuenta = [...byCuenta.entries()]
    .map(([id, v]) => ({
      id,
      nombre:
        id === "SIN_CUENTA"
          ? "SIN CUENTA"
          : (cuentaMap.get(id) || shortId(id)),
      ingresos: v.ingresos,
      egresos: v.egresos,
      saldo: v.ingresos - v.egresos,
      movs: v.movs,
    }))
    .sort((a, b) => Math.abs(b.saldo) - Math.abs(a.saldo));

  return {
    kpis: { ingresos, egresos, saldo, totalMovs },
    serieMensual,
    topCategoriasIngreso,
    topCategoriasEgreso,
    porCuenta,
    rows: filtered,
  };
}

export async function exportFinanzasCsv(params: {
  from: string;
  to: string;
  tipo?: "INGRESO" | "EGRESO";
  cuenta?: string;
  categoria?: string;
}) {
  const rep = await getFinanzasReport(params);

  const header = [
    "id",
    "fecha",
    "tipo",
    "monto",
    "metodo_pago",
    "categoria",
    "cuenta",
    "referencia",
    "descripcion",
  ];
  const lines = [header.join(",")];

  // En export, como el tipoField real puede variar, lo dejamos como "tipo" si existe:
  for (const t of rep.rows as AnyRow[]) {
    const tipo =
      t.tipo_fin_tipo_movimiento ??
      t.tipo_movimiento ??
      t.tipo ??
      "";

    lines.push(
      [
        escCsv(t.id),
        escCsv(t.fecha),
        escCsv(tipo),
        escCsv(t.monto),
        escCsv(t.metodo_pago_fin_metodo_pago),
        escCsv(t.categoria_id), // si quieres, lo cambiamos luego por nombre 100%
        escCsv(t.cuenta_id),
        escCsv(t.referencia),
        escCsv(t.descripcion),
      ].join(",")
    );
  }

  return { csv: lines.join("\n") };
}