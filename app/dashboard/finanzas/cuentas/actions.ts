"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type FinTipoCuenta = "CAJA" | "BANCO" | string;

export type CuentaRow = {
  id: string;
  area: string | null;
  nombre: string | null;
  activa: boolean | null;
  tipo: FinTipoCuenta | null;
  moneda: string | null;
  created_at?: string | null;
};

const AREA_FIJA = "IGLESIA";

function s(v: FormDataEntryValue | null) {
  return (typeof v === "string" ? v : "").trim();
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

export async function createCuenta(formData: FormData) {
  const { supabase } = await requireAdmin();

  const nombre = s(formData.get("nombre"));
  const tipo = s(formData.get("tipo"));
  const moneda = s(formData.get("moneda"));

  if (!nombre) return { ok: false, error: "Nombre es obligatorio." };
  if (!tipo) return { ok: false, error: "Tipo es obligatorio." };
  if (!moneda) return { ok: false, error: "Moneda es obligatoria." };

  const { error } = await supabase.from("fin_cuentas").insert({
    area: AREA_FIJA,
    nombre,
    tipo,
    moneda,
    activa: true,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function updateCuenta(id: string, formData: FormData) {
  const { supabase } = await requireAdmin();

  const nombre = s(formData.get("nombre"));
  const tipo = s(formData.get("tipo"));
  const moneda = s(formData.get("moneda"));

  if (!id) return { ok: false, error: "ID inválido." };
  if (!nombre) return { ok: false, error: "Nombre es obligatorio." };
  if (!tipo) return { ok: false, error: "Tipo es obligatorio." };
  if (!moneda) return { ok: false, error: "Moneda es obligatoria." };

  const { error } = await supabase
    .from("fin_cuentas")
    .update({
      nombre,
      tipo,
      moneda,
    })
    .eq("id", id)
    .eq("area", AREA_FIJA);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function deleteCuenta(id: string) {
  const { supabase } = await requireAdmin();

  if (!id) return { ok: false, error: "ID inválido." };

  // Nota: si hay movimientos que referencian esta cuenta, puede fallar por FK.
  const { error } = await supabase.from("fin_cuentas").delete().eq("id", id).eq("area", AREA_FIJA);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function setCuentaActiva(id: string, activa: boolean) {
  const { supabase } = await requireAdmin();

  if (!id) return { ok: false, error: "ID inválido." };

  const { error } = await supabase
    .from("fin_cuentas")
    .update({ activa })
    .eq("id", id)
    .eq("area", AREA_FIJA);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function listCuentasIGLESIA() {
  const { supabase } = await requireUser();

  const { data, error } = await supabase
    .from("fin_cuentas")
    .select("id,area,nombre,activa,tipo,moneda,created_at")
    .eq("area", AREA_FIJA)
    .order("nombre", { ascending: true });

  if (error) return { ok: false, error: error.message, data: [] as CuentaRow[] };
  return { ok: true, data: (data ?? []) as CuentaRow[] };
}

export async function getCuentaIGLESIA(id: string) {
  const { supabase } = await requireUser();

  const { data, error } = await supabase
    .from("fin_cuentas")
    .select("id,area,nombre,activa,tipo,moneda,created_at")
    .eq("id", id)
    .eq("area", AREA_FIJA)
    .maybeSingle();

  if (error) return { ok: false, error: error.message, data: null as CuentaRow | null };
  return { ok: true, data: (data ?? null) as CuentaRow | null };
}
