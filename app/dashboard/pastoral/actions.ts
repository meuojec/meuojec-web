"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function registrarSeguimiento(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const admin = createAdminClient();
  await admin.from("seguimiento_pastoral").insert({
    miembro_rut: String(formData.get("miembro_rut") || "").trim(),
    fecha: String(formData.get("fecha") || new Date().toISOString().slice(0, 10)),
    tipo: String(formData.get("tipo") || "visita"),
    descripcion: String(formData.get("descripcion") || "").trim(),
    privado: formData.get("privado") === "on",
    pastor_id: user.id,
  });

  revalidatePath("/dashboard/pastoral");
  redirect("/dashboard/pastoral");
}

export async function eliminarSeguimiento(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const admin = createAdminClient();
  await admin.from("seguimiento_pastoral").delete().eq("id", id);
  revalidatePath("/dashboard/pastoral");
}
