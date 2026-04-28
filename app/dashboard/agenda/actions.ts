"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function crearActividadAgenda(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const admin = createAdminClient();
  await admin.from("agenda").insert({
    titulo: String(formData.get("titulo") || "").trim(),
    descripcion: String(formData.get("descripcion") || "").trim() || null,
    fecha: String(formData.get("fecha") || ""),
    hora_inicio: String(formData.get("hora_inicio") || "").trim() || null,
    hora_fin: String(formData.get("hora_fin") || "").trim() || null,
    tipo: String(formData.get("tipo") || "reunion"),
    lugar: String(formData.get("lugar") || "").trim() || null,
    activo: true,
  });

  revalidatePath("/dashboard/agenda");
  redirect("/dashboard/agenda");
}

export async function eliminarActividad(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const admin = createAdminClient();
  await admin.from("agenda").update({ activo: false }).eq("id", id);
  revalidatePath("/dashboard/agenda");
}

export async function actualizarActividad(id: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const admin = createAdminClient();
  await admin.from("agenda").update({
    titulo: String(formData.get("titulo") || "").trim(),
    descripcion: String(formData.get("descripcion") || "").trim() || null,
    fecha: String(formData.get("fecha") || ""),
    hora_inicio: String(formData.get("hora_inicio") || "").trim() || null,
    hora_fin: String(formData.get("hora_fin") || "").trim() || null,
    tipo: String(formData.get("tipo") || "reunion"),
    lugar: String(formData.get("lugar") || "").trim() || null,
  }).eq("id", id);

  revalidatePath("/dashboard/agenda");
  redirect("/dashboard/agenda");
}
