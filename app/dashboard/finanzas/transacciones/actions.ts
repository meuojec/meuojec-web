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
