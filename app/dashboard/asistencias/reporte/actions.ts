"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// id aquí será created_at (string ISO)
export async function deleteAsistenciaByCreatedAt(input: { rut: string; created_at: string }) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado" };

  const { error } = await supabase
    .from("asistencias")
    .delete()
    .eq("rut", input.rut)
    .eq("created_at", input.created_at);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/asistencias/reporte");
  return { ok: true };
}
