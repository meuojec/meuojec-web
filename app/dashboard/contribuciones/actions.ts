"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function registrarContribucion(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const anonimo = formData.get("anonimo") === "on";
  const miembro_rut = anonimo ? null : (String(formData.get("miembro_rut") || "").trim() || null);
  const tipo = String(formData.get("tipo") || "diezmo");
  const monto = parseFloat(String(formData.get("monto") || "0"));
  const fecha = String(formData.get("fecha") || new Date().toISOString().slice(0, 10));
  const notas = String(formData.get("notas") || "").trim() || null;

  const admin = createAdminClient();
  await admin.from("contribuciones").insert({
    miembro_rut,
    anonimo,
    tipo,
    monto,
    fecha,
    notas,
    registrado_por: user.id,
  });

  revalidatePath("/dashboard/contribuciones");
  redirect("/dashboard/contribuciones");
}

export async function eliminarContribucion(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const admin = createAdminClient();
  await admin.from("contribuciones").delete().eq("id", id);
  revalidatePath("/dashboard/contribuciones");
}
