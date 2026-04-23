// app/dashboard/reportes/inventario/actions.ts
"use server";

import "server-only";
import { createClient } from "@/lib/supabase/server";

type AnyRow = Record<string, any>;

function asISO(d: Date) {
  return d.toISOString().slice(0, 10);
}

function ymKey(iso: string) {
  // "2026-02-18" => "2026-02"
  return iso.slice(0, 7);
}

function getFecha(row: AnyRow): string {
  // prioriza fecha (date), si no created_at
  const f = row.fecha ?? row.date ?? null;
  if (typeof f === "string" && f.length >= 10) return f.slice(0, 10);
  const c = row.created_at ?? row.inserted_at ?? null;
  if (typeof c === "string" && c.length >= 10) return c.slice(0, 10);
  return asISO(new Date());
}

function getTipo(row: AnyRow): string {
  const t = (row.tipo ?? row.type ?? "").toString().toUpperCase();
  // normaliza (ENTRADA/SALIDA/TRANSFERENCIA)
  if (t.includes("ENTR")) return "ENTRADA";
  if (t.includes("SAL")) return "SALIDA";
  if (t.includes("TRANS")) return "TRANSFERENCIA";
  return t || "—";
}

function getCant(row: AnyRow): number {
  const v = row.cantidad ?? row.qty ?? row.cant ?? 0;
  const n = typeof v === "number" ? v : Number(v || 0);
  return Number.isFinite(n) ? n : 0;
}

function getProductoId(row: AnyRow): string | null {
  return (row.producto_id ?? row.product_id ?? row.id_producto ?? null) as string | null;
}
function getUbicacionId(row: AnyRow): string | null {
  return (row.ubicacion_id ?? row.location_id ?? row.id_ubicacion ?? null) as string | null;
}

export type InventarioReportParams = {
  from: string; // YYYY-MM-DD
  to: string;   // YYYY-MM-DD
  ubicacion?: string;
  producto?: string;
};

export type InventarioReport = {
  kpis: {
    movimientos: number;
    entradas: number; // suma cantidades
    salidas: number;  // suma cantidades
    neto: number;     // entradas - salidas
  };

  serieMensual: Array<{
    mes: string; // YYYY-MM
    entradas: number;
    salidas: number;
    neto: number;
    movs: number;
  }>;

  stockBajo: Array<{
    producto_id: string;
    producto_nombre: string;
    ubicacion_id: string;
    ubicacion_nombre: string;
    cantidad: number;
    minimo: number;
  }>;

  rotacionTop: Array<{
    producto_id: string;
    producto_nombre: string;
    salidas: number;
  }>;

  kardex: Array<{
    fecha: string;
    tipo: string;
    cantidad: number;
    ubicacion: string;
    referencia: string;
    descripcion: string;
    saldo: number;
  }>;
};

export async function getInventarioReport(p: InventarioReportParams): Promise<InventarioReport> {
  const supabase = await createClient();

  // 1) Catálogos
  const [{ data: productosRaw }, { data: ubicacionesRaw }] = await Promise.all([
    supabase.from("inv_productos").select("*"),
    supabase.from("inv_ubicaciones").select("*"),
  ]);

  const productos = (productosRaw ?? []) as AnyRow[];
  const ubicaciones = (ubicacionesRaw ?? []) as AnyRow[];

  const prodName = new Map<string, string>();
  for (const r of productos) {
    const id = (r.id ?? r.producto_id ?? r.product_id) as string | undefined;
    if (!id) continue;
    const nombre = (r.nombre ?? r.name ?? r.titulo ?? r.descripcion ?? "—").toString();
    prodName.set(id, nombre);
  }

  const prodMin = new Map<string, number>();
  for (const r of productos) {
    const id = (r.id ?? r.producto_id ?? r.product_id) as string | undefined;
    if (!id) continue;
    const m = r.stock_minimo ?? r.stock_min ?? r.minimo ?? r.min ?? null;
    const n = typeof m === "number" ? m : Number(m ?? 0);
    prodMin.set(id, Number.isFinite(n) ? n : 0);
  }

  const ubName = new Map<string, string>();
  for (const r of ubicaciones) {
    const id = (r.id ?? r.ubicacion_id ?? r.location_id) as string | undefined;
    if (!id) continue;
    const nombre = (r.nombre ?? r.name ?? r.descripcion ?? "—").toString();
    ubName.set(id, nombre);
  }

  // 2) Movimientos en rango
  let qMov = supabase
    .from("inv_movimientos")
    .select("*")
    .gte("fecha", p.from)
    .lte("fecha", p.to);

  // Si tu tabla no tiene columna "fecha" y usa created_at, esto puede fallar.
  // En ese caso te lo ajusto a created_at. Por ahora seguimos tu estándar de usar fecha.
  if (p.ubicacion) qMov = qMov.eq("ubicacion_id", p.ubicacion);
  if (p.producto) qMov = qMov.eq("producto_id", p.producto);

  const { data: movRaw } = await qMov;
  const movs = (movRaw ?? []) as AnyRow[];

  // KPIs
  let entradas = 0;
  let salidas = 0;
  for (const m of movs) {
    const tipo = getTipo(m);
    const c = getCant(m);
    if (tipo === "ENTRADA") entradas += c;
    else if (tipo === "SALIDA") salidas += c;
  }

  // Serie mensual
  const serieMap = new Map<string, { entradas: number; salidas: number; movs: number }>();
  for (const m of movs) {
    const f = getFecha(m);
    const key = ymKey(f);
    const tipo = getTipo(m);
    const c = getCant(m);
    const cur = serieMap.get(key) ?? { entradas: 0, salidas: 0, movs: 0 };
    cur.movs += 1;
    if (tipo === "ENTRADA") cur.entradas += c;
    if (tipo === "SALIDA") cur.salidas += c;
    serieMap.set(key, cur);
  }

  const serieMensual = Array.from(serieMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([mes, v]) => ({
      mes,
      entradas: v.entradas,
      salidas: v.salidas,
      neto: v.entradas - v.salidas,
      movs: v.movs,
    }));

  // 3) Stock bajo
  // inv_stock: asumimos producto_id, ubicacion_id, cantidad
  const { data: stockRaw } = await supabase.from("inv_stock").select("*");
  const stock = (stockRaw ?? []) as AnyRow[];

  const stockBajo: InventarioReport["stockBajo"] = [];
  for (const s of stock) {
    const pid = (s.producto_id ?? s.product_id) as string | undefined;
    const uid = (s.ubicacion_id ?? s.location_id) as string | undefined;
    if (!pid || !uid) continue;

    if (p.ubicacion && uid !== p.ubicacion) continue;
    if (p.producto && pid !== p.producto) continue;

    const cant = typeof s.cantidad === "number" ? s.cantidad : Number(s.cantidad ?? 0);
    const minimo = prodMin.get(pid) ?? 0;

    // mostramos “bajo” solo si minimo > 0 y cant <= minimo
    if (minimo > 0 && cant <= minimo) {
      stockBajo.push({
        producto_id: pid,
        producto_nombre: prodName.get(pid) ?? pid,
        ubicacion_id: uid,
        ubicacion_nombre: ubName.get(uid) ?? uid,
        cantidad: Number.isFinite(cant) ? cant : 0,
        minimo,
      });
    }
  }

  stockBajo.sort((a, b) => (a.cantidad - a.minimo) - (b.cantidad - b.minimo));

  // 4) Rotación (top salidas por producto)
  const rotMap = new Map<string, number>();
  for (const m of movs) {
    if (getTipo(m) !== "SALIDA") continue;
    const pid = getProductoId(m);
    if (!pid) continue;
    rotMap.set(pid, (rotMap.get(pid) ?? 0) + getCant(m));
  }

  const rotacionTop = Array.from(rotMap.entries())
    .map(([pid, sal]) => ({
      producto_id: pid,
      producto_nombre: prodName.get(pid) ?? pid,
      salidas: sal,
    }))
    .sort((a, b) => b.salidas - a.salidas)
    .slice(0, 10);

  // 5) Kardex simple (si viene producto, armamos listado con saldo acumulado)
  const kardex: InventarioReport["kardex"] = [];
  if (p.producto) {
    const filtered = movs
      .filter((m) => getProductoId(m) === p.producto)
      .sort((a, b) => getFecha(a).localeCompare(getFecha(b)));

    let saldo = 0;
    for (const m of filtered) {
      const tipo = getTipo(m);
      const c = getCant(m);
      if (tipo === "ENTRADA") saldo += c;
      else if (tipo === "SALIDA") saldo -= c;

      const uid = getUbicacionId(m);
      kardex.push({
        fecha: getFecha(m),
        tipo,
        cantidad: c,
        ubicacion: uid ? (ubName.get(uid) ?? uid) : "—",
        referencia: (m.referencia ?? m.ref ?? "—").toString(),
        descripcion: (m.descripcion ?? m.detalle ?? "—").toString(),
        saldo,
      });
    }
  }

  return {
    kpis: {
      movimientos: movs.length,
      entradas,
      salidas,
      neto: entradas - salidas,
    },
    serieMensual,
    stockBajo,
    rotacionTop,
    kardex,
  };
}