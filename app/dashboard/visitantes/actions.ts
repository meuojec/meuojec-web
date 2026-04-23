"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function registrarVisitante(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const admin = createAdminClient();
  await admin.from("visitantes").insert({
    nombres: String(formData.get("nombres") || "").trim(),
    apellidos: String(formData.get("apellidos") || "").trim() || null,
    telefono: String(formData.get("telefono") || "").trim() || null,
    email: String(formData.get("email") || "").trim() || null,
    fecha_primera_visita: String(formData.get("fecha_primera_visita") || new Date().toISOString().slice(0, 10)),
    origen: String(formData.get("origen") || "invitado"),
    notas: String(formData.get("notas") || "").trim() || null,
  });

  revalidatePath("/dashboard/visitantes");
  redirect("/dashboard/visitantes");
}

export async function actualizarEstado(id: string, estado: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const admin = createAdminClient();
  await admin.from("visitantes").update({ estado }).eq("id", id);
  revalidatePath(`/dashboard/visitantes/${id}`);
  revalidatePath("/dashboard/visitantes");
}

export async function agregarSeguimiento(visitanteId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const admin = createAdminClient();
  await admin.from("visitantes_seguimiento").insert({
    visitante_id: visitanteId,
    fecha: String(formData.get("fecha") || new Date().toISOString().slice(0, 10)),
    tipo: String(formData.get("tipo") || "contacto"),
    descripcion: String(formData.get("descripcion") || "").trim(),
    registrado_por: user.id,
  });

  revalidatePath(`/dashboard/visitantes/${visitanteId}`);
}

export async function eliminarVisitante(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const admin = createAdminClient();
  await admin.from("visitantes").delete().eq("id", id);
  revalidatePath("/dashboard/visitantes");
  redirect("/dashboard/visitantes");
}
