"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function ensureSesion(fecha: string) {
  const supabase = await createClient();

  const { data: existing, error: selErr } = await supabase
    .from("ded_sesiones")
    .select("id,fecha")
    .eq("fecha", fecha)
    .maybeSingle();

  if (selErr) throw new Error(selErr.message);
  if (existing?.id) return existing.id as string;

  const { data: ins, error: insErr } = await supabase
    .from("ded_sesiones")
    .insert({ fecha })
    .select("id")
    .single();

  if (insErr) throw new Error(insErr.message);
  return ins.id as string;
}

export type DedDetalleInput = {
  ded_clase_id: string;
  miembros_asistencia: number;
  visitantes: number;
  biblias: number;
  libros_cantos: number;
  dinero: number;
  notas?: string | null;
};

function toInt(n: any) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.trunc(x));
}
function toMoney(n: any) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.round(x * 100) / 100);
}

export async function createDedDetalle(fecha: string, input: DedDetalleInput) {
  const supabase = await createClient();
  const sesionId = await ensureSesion(fecha);

  const payload = {
    sesion_id: sesionId,
    ded_clase_id: input.ded_clase_id,
    miembros_asistencia: toInt(input.miembros_asistencia),
    visitantes: toInt(input.visitantes),
    biblias: toInt(input.biblias),
    libros_cantos: toInt(input.libros_cantos),
    dinero: toMoney(input.dinero),
    notas: (input.notas ?? "").trim() || null,
  };

  const { error } = await supabase.from("ded_sesion_detalle").insert(payload);

  if (error) {
    const msg = (error.message || "").toLowerCase();
    if (msg.includes("duplicate") || msg.includes("unique")) {
      throw new Error("Ya existe un registro para esa clase en esta fecha. Usa Editar.");
    }
    throw new Error(error.message);
  }

  revalidatePath(`/dashboard/ded/sesion/${fecha}`);
}

export async function updateDedDetalle(fecha: string, input: DedDetalleInput) {
  const supabase = await createClient();
  const sesionId = await ensureSesion(fecha);

  const payload = {
    miembros_asistencia: toInt(input.miembros_asistencia),
    visitantes: toInt(input.visitantes),
    biblias: toInt(input.biblias),
    libros_cantos: toInt(input.libros_cantos),
    dinero: toMoney(input.dinero),
    notas: (input.notas ?? "").trim() || null,
  };

  const { error } = await supabase
    .from("ded_sesion_detalle")
    .update(payload)
    .eq("sesion_id", sesionId)
    .eq("ded_clase_id", input.ded_clase_id);

  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/ded/sesion/${fecha}`);
}

export async function deleteDedDetalle(fecha: string, ded_clase_id: string) {
  const supabase = await createClient();
  const sesionId = await ensureSesion(fecha);

  const { data, error } = await supabase
    .from("ded_sesion_detalle")
    .delete()
    .eq("sesion_id", sesionId)
    .eq("ded_clase_id", ded_clase_id)
    .select("ded_clase_id"); // 👈 devuelve lo borrado

  if (error) throw new Error(error.message);
  if (!data || data.length === 0) {
    throw new Error("No se pudo eliminar (0 filas). Revisa RLS/policies.");
  }

  revalidatePath(`/dashboard/ded/sesion/${fecha}`);
}

