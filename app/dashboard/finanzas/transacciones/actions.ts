"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type FinTipoMovimiento = "INGRESO" | "EGRESO" | "TRANSFERENCIA" | string;
export type FinMetodoPago = "EFECTIVO" | "TRANSFERENCIA" | "TARJETA" | "OTRO" | string;

export type MovimientoRow = {
  id: string;
  area: string | null;
  fecha: string | null; // YYYY-MM-DD
  tipo: FinTipoMovimiento | null;
  monto: number | null;
  cuenta_id: string | null;
  cuenta_destino_id: string | null;
  categoria_id: string | null;
  metodo_pago: FinMetodoPago | null;
  referencia: string | null;
  descripcion: string | null;
  created_at?: string | null;
};

const AREA_FIJA = "IGLESIA";

function s(v: FormDataEntryValue | null) {
  return (typeof v === "string" ? v : "").trim();
}
function num(v: FormDataEntryValue | null) {
  const raw = s(v).replace(/\./g, "").replace(",", ".");
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

async function requireUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data?.user;
  if (!user) redirect("/login");
  return { supabase, user };
}

async function requireAdmin() {
  const { supabase, user } = await requireUser();
  const { data: prof } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (prof?.role !== "admin") throw new Error("No autorizado");
  return { supabase, user };
}

export async function createTransaccion(formData: FormData) {
  const { supabase } = await requireAdmin();

  const fecha = s(formData.get("fecha"));
  const tipo = s(formData.get("tipo")).toUpperCase();
  const monto = num(formData.get("monto"));
  const cuenta_id = s(formData.get("cuenta_id")) || null;
  const cuenta_destino_id = s(formData.get("cuenta_destino_id")) || null;
  const categoria_id = s(formData.get("categoria_id")) || null;
  const metodo_pago = s(formData.get("metodo_pago")) || null;
  const referencia = s(formData.get("referencia")) || null;
  const descripcion = s(formData.get("descripcion")) || null;

  if (!fecha) return { ok: false, error: "Fecha es obligatoria." };
  if (!tipo) return { ok: false, error: "Tipo es obligatorio." };
  if (monto === null || monto <= 0) return { ok: false, error: "Monto debe ser mayor a 0." };
  if (!cuenta_id) return { ok: false, error: "Cuenta es obligatoria." };

  if (tipo === "TRANSFERENCIA") {
    if (!cuenta_destino_id) return { ok: false, error: "Cuenta destino es obligatoria en transferencia." };
    if (cuenta_destino_id === cuenta_id) return { ok: false, error: "Cuenta destino debe ser distinta." };
  } else {
    if (!categoria_id) return { ok: false, error: "Categoría es obligatoria." };
  }

  const payload: any = {
    area: AREA_FIJA,
    fecha,
    tipo,
    monto,
    cuenta_id,
    cuenta_destino_id: tipo === "TRANSFERENCIA" ? cuenta_destino_id : null,
    categoria_id: tipo === "TRANSFERENCIA" ? null : categoria_id,
    metodo_pago,
    referencia,
    descripcion,
  };

  const { error } = await supabase.from("fin_movimientos").insert(payload);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function updateTransaccion(id: string, formData: FormData) {
  const { supabase } = await requireAdmin();

  const fecha = s(formData.get("fecha"));
  const tipo = s(formData.get("tipo")).toUpperCase();
  const monto = num(formData.get("monto"));
  const cuenta_id = s(formData.get("cuenta_id")) || null;
  const cuenta_destino_id = s(formData.get("cuenta_destino_id")) || null;
  const categoria_id = s(formData.get("categoria_id")) || null;
  const metodo_pago = s(formData.get("metodo_pago")) || null;
  const referencia = s(formData.get("referencia")) || null;
  const descripcion = s(formData.get("descripcion")) || null;

  if (!id) return { ok: false, error: "ID inválido." };
  if (!fecha) return { ok: false, error: "Fecha es obligatoria." };
  if (!tipo) return { ok: false, error: "Tipo es obligatorio." };
  if (monto === null || monto <= 0) return { ok: false, error: "Monto debe ser mayor a 0." };
  if (!cuenta_id) return { ok: false, error: "Cuenta es obligatoria." };

  if (tipo === "TRANSFERENCIA") {
    if (!cuenta_destino_id) return { ok: false, error: "Cuenta destino es obligatoria en transferencia." };
    if (cuenta_destino_id === cuenta_id) return { ok: false, error: "Cuenta destino debe ser distinta." };
  } else {
    if (!categoria_id) return { ok: false, error: "Categoría es obligatoria." };
  }

  const payload: any = {
    fecha,
    tipo,
    monto,
    cuenta_id,
    cuenta_destino_id: tipo === "TRANSFERENCIA" ? cuenta_destino_id : null,
    categoria_id: tipo === "TRANSFERENCIA" ? null : categoria_id,
    metodo_pago,
    referencia,
    descripcion,
  };

  const { error } = await supabase
    .from("fin_movimientos")
    .update(payload)
    .eq("id", id)
    .eq("area", AREA_FIJA);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function deleteTransaccion(id: string) {
  try {
    const { supabase } = await requireAdmin();
    if (!id) return { ok: false, error: "ID inválido." };

    const { error } = await supabase
      .from("fin_movimientos")
      .delete()
      .eq("id", id)
      .eq("area", AREA_FIJA);

    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "No autorizado" };
  }
}

export async function getTransaccionIGLESIA(id: string) {
  const { supabase } = await requireUser();

  const { data, error } = await supabase
    .from("fin_movimientos")
    .select("id,area,fecha,tipo,monto,cuenta_id,cuenta_destino_id,categoria_id,metodo_pago,referencia,descripcion,created_at")
    .eq("id", id)
    .eq("area", AREA_FIJA)
    .maybeSingle();

  if (error) return { ok: false, error: error.message, data: null as MovimientoRow | null };
  return { ok: true, data: (data ?? null) as MovimientoRow | null };
}

// ─── Object-based helpers used by TransaccionesClient ────────────────────────
type TxPayload = {
  fecha: string;
  tipo: string;
  area: string;
  monto: number;
  categoria_id?: string | null;
  ded_clase_id?: string | null;
  descripcion?: string | null;
  cuenta_id?: string | null;
  metodo_pago?: string | null;
};

export async function createTx(payload: TxPayload) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("fin_movimientos").insert({
    ...payload,
    tipo: payload.tipo.toUpperCase(),
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function updateTx(payload: TxPayload & { id: string }) {
  const { supabase } = await requireAdmin();
  const { id, ...rest } = payload;
  if (!id) return { ok: false, error: "ID invalido." };
  const { error } = await supabase
    .from("fin_movimientos")
    .update({ ...rest, tipo: rest.tipo.toUpperCase() })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// ─── Export ────────────────────────────────────────────────────────────────

export type ExportRow = {
  fecha: string;
  tipo: string;
  monto: number;
  cuenta: string;
  cuenta_destino: string;
  categoria: string;
  metodo_pago: string;
  referencia: string;
  descripcion: string;
};

export async function exportTransacciones(params: {
  tipo?: string;
  cuenta?: string;
  categoria?: string;
  desde?: string;
  hasta?: string;
  q?: string;
}): Promise<{ ok: true; rows: ExportRow[] } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado" };

  // Cuentas y categorías para resolver nombres
  const [{ data: cuentasData }, { data: catsData }] = await Promise.all([
    supabase.from("fin_cuentas").select("id,nombre").eq("area", AREA_FIJA),
    supabase.from("fin_categorias").select("id,nombre").eq("area", AREA_FIJA),
  ]);
  const cuentaMap = new Map(((cuentasData ?? []) as { id: string; nombre: string | null }[]).map((c) => [c.id, c.nombre ?? "—"]));
  const catMap = new Map(((catsData ?? []) as { id: string; nombre: string | null }[]).map((c) => [c.id, c.nombre ?? "—"]));

  let query = supabase
    .from("fin_movimientos")
    .select("fecha,tipo,monto,cuenta_id,cuenta_destino_id,categoria_id,metodo_pago,referencia,descripcion")
    .eq("area", AREA_FIJA)
    .order("fecha", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(5000);

  if (params.tipo && params.tipo !== "TODOS") query = query.eq("tipo", params.tipo);
  if (params.cuenta) query = query.eq("cuenta_id", params.cuenta);
  if (params.categoria) query = query.eq("categoria_id", params.categoria);
  if (params.desde) query = query.gte("fecha", params.desde);
  if (params.hasta) query = query.lte("fecha", params.hasta);
  if (params.q?.trim()) query = query.or(`referencia.ilike.%${params.q.trim()}%,descripcion.ilike.%${params.q.trim()}%`);

  const { data, error } = await query;
  if (error) return { ok: false, error: error.message };

  const rows: ExportRow[] = ((data ?? []) as any[]).map((r) => ({
    fecha: r.fecha ?? "",
    tipo: r.tipo ?? "",
    monto: typeof r.monto === "number" ? r.monto : 0,
    cuenta: r.cuenta_id ? (cuentaMap.get(r.cuenta_id) ?? "—") : "—",
    cuenta_destino: r.cuenta_destino_id ? (cuentaMap.get(r.cuenta_destino_id) ?? "—") : "",
    categoria: r.categoria_id ? (catMap.get(r.categoria_id) ?? "—") : "—",
    metodo_pago: r.metodo_pago ?? "",
    referencia: r.referencia ?? "",
    descripcion: r.descripcion ?? "",
  }));

  return { ok: true, rows };
}
