"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function crearMinisterio(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const admin = createAdminClient();
  await admin.from("ministerios").insert({
    nombre: String(formData.get("nombre") || "").trim(),
    descripcion: String(formData.get("descripcion") || "").trim() || null,
    color: String(formData.get("color") || "#6366f1"),
    lider_rut: String(formData.get("lider_rut") || "").trim() || null,
  });

  revalidatePath("/dashboard/ministerios");
  redirect("/dashboard/ministerios");
}

export async function actualizarMinisterio(id: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const admin = createAdminClient();
  await admin.from("ministerios").update({
    nombre: String(formData.get("nombre") || "").trim(),
    descripcion: String(formData.get("descripcion") || "").trim() || null,
    color: String(formData.get("color") || "#6366f1"),
    lider_rut: String(formData.get("lider_rut") || "").trim() || null,
  }).eq("id", id);

  revalidatePath("/dashboard/ministerios");
  redirect("/dashboard/ministerios");
}

export async function eliminarMinisterio(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const admin = createAdminClient();
  await admin.from("ministerios").update({ activo: false }).eq("id", id);
  revalidatePath("/dashboard/ministerios");
}

export async function asignarMiembro(ministerioId: string, miembroRut: string, rol: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const admin = createAdminClient();
  const { error } = await admin.from("miembros_ministerios").upsert({
    ministerio_id: ministerioId,
    miembro_rut: miembroRut.trim(),
    rol: rol || "miembro",
    activo: true,
  }, { onConflict: "miembro_rut,ministerio_id" });

  revalidatePath(`/dashboard/ministerios/${ministerioId}`);
  return { ok: !error, error: error?.message };
}

export async function removerMiembro(ministerioId: string, miembroRut: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const admin = createAdminClient();
  await admin.from("miembros_ministerios")
    .update({ activo: false })
    .eq("ministerio_id", ministerioId)
    .eq("miembro_rut", miembroRut);

  revalidatePath(`/dashboard/ministerios/${ministerioId}`);
}
