"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function actualizarNombre(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado." };

  const displayName = String(formData.get("display_name") ?? "").trim();
  if (!displayName) return { ok: false, error: "El nombre no puede estar vacío." };

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName })
    .eq("id", user.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/perfil");
  return { ok: true };
}

export async function cambiarPassword(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado." };

  const nueva = String(formData.get("nueva") ?? "").trim();
  const confirmar = String(formData.get("confirmar") ?? "").trim();

  if (nueva.length < 6) return { ok: false, error: "La contraseña debe tener al menos 6 caracteres." };
  if (nueva !== confirmar) return { ok: false, error: "Las contraseñas no coinciden." };

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(user.id, { password: nueva });

  if (error) return { ok: false, error: error.message };

  return { ok: true };
}
