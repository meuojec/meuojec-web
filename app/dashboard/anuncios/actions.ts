"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function crearAnuncio(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const expira = String(formData.get("expira_en") || "").trim() || null;

  const admin = createAdminClient();
  await admin.from("anuncios").insert({
    titulo: String(formData.get("titulo") || "").trim(),
    contenido: String(formData.get("contenido") || "").trim(),
    tipo: String(formData.get("tipo") || "general"),
    audiencia: String(formData.get("audiencia") || "todos"),
    expira_en: expira,
    autor_id: user.id,
    activo: true,
  });

  revalidatePath("/dashboard/anuncios");
  redirect("/dashboard/anuncios");
}

export async function toggleAnuncio(id: string, activo: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const admin = createAdminClient();
  await admin.from("anuncios").update({ activo }).eq("id", id);
  revalidatePath("/dashboard/anuncios");
}

export async function eliminarAnuncio(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const admin = createAdminClient();
  await admin.from("anuncios").delete().eq("id", id);
  revalidatePath("/dashboard/anuncios");
}
