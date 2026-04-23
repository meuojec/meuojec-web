"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type FinTipoCategoria = "INGRESO" | "EGRESO" | string;

export type CategoriaRow = {
  id: string;
  area: string | null;
  nombre: string | null; // citext
  tipo: FinTipoCategoria | null;
  tipo_default: string | null; // texto (puede ser null)
  orden: number | null;
  activa: boolean | null;
  created_at?: string | null;
};

const AREA_FIJA = "IGLESIA";

function s(v: FormDataEntryValue | null) {
  return (typeof v === "string" ? v : "").trim();
}
function n(v: FormDataEntryValue | null) {
  const raw = s(v);
  if (!raw) return null;
  const num = Number(raw);
  return Number.isFinite(num) ? num : null;
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

export async function listCategoriasIGLESIA() {
  const { supabase } = await requireUser();

  const { data, error } = await supabase
    .from("fin_categorias")
    .select("id,area,nombre,tipo,tipo_default,orden,activa,created_at")
    .eq("area", AREA_FIJA)
    .order("orden", { ascending: true })
    .order("nombre", { ascending: true });

  if (error) return { ok: false, error: error.message, data: [] as CategoriaRow[] };
  return { ok: true, data: (data ?? []) as CategoriaRow[] };
}

export async function getCategoriaIGLESIA(id: string) {
  const { supabase } = await requireUser();

  const { data, error } = await supabase
    .from("fin_categorias")
    .select("id,area,nombre,tipo,tipo_default,orden,activa,created_at")
    .eq("id", id)
    .eq("area", AREA_FIJA)
    .maybeSingle();

  if (error) return { ok: false, error: error.message, data: null as CategoriaRow | null };
  return { ok: true, data: (data ?? null) as CategoriaRow | null };
}

export async function createCategoria(formData: FormData) {
  const { supabase } = await requireAdmin();

  const nombre = s(formData.get("nombre"));
  const tipo = s(formData.get("tipo"));
  const tipo_default = s(formData.get("tipo_default")) || null; // puede quedar null
  const orden = n(formData.get("orden"));

  if (!nombre) return { ok: false, error: "Nombre es obligatorio." };
  if (!tipo) return { ok: false, error: "Tipo es obligatorio." };

  const { error } = await supabase.from("fin_categorias").insert({
    area: AREA_FIJA,
    nombre,
    tipo,
    tipo_default,
    orden: orden ?? 0,
    activa: true,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function updateCategoria(id: string, formData: FormData) {
  const { supabase } = await requireAdmin();

  const nombre = s(formData.get("nombre"));
  const tipo = s(formData.get("tipo"));
  const tipo_default = s(formData.get("tipo_default")) || null;
  const orden = n(formData.get("orden"));

  if (!id) return { ok: false, error: "ID inválido." };
  if (!nombre) return { ok: false, error: "Nombre es obligatorio." };
  if (!tipo) return { ok: false, error: "Tipo es obligatorio." };

  const { error } = await supabase
    .from("fin_categorias")
    .update({
      nombre,
      tipo,
      tipo_default,
      orden: orden ?? 0,
    })
    .eq("id", id)
    .eq("area", AREA_FIJA);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function deleteCategoria(id: string) {
  const { supabase } = await requireAdmin();

  if (!id) return { ok: false, error: "ID inválido." };

  // Si hay movimientos asociados, puede fallar por FK.
  const { error } = await supabase
    .from("fin_categorias")
    .delete()
    .eq("id", id)
    .eq("area", AREA_FIJA);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function setCategoriaActiva(id: string, activa: boolean) {
  const { supabase } = await requireAdmin();

  if (!id) return { ok: false, error: "ID inválido." };

  const { error } = await supabase
    .from("fin_categorias")
    .update({ activa })
    .eq("id", id)
    .eq("area", AREA_FIJA);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
