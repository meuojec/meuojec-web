"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** Activa un evento y desactiva los demás */
export async function activarEvento(formData: FormData) {
  const id_evento = String(formData.get("id_evento") || "").trim();
  if (!id_evento) return;

  const supabase = await createClient();
  const { data: userRes } = await supabase.auth.getUser();
  if (!userRes?.user) return;

  const admin = createAdminClient();
  await admin.from("eventos").update({ activo: false }).neq("id_evento", id_evento);
  await admin
    .from("eventos")
    .update({ activo: true, activated_at: new Date().toISOString() })
    .eq("id_evento", id_evento);

  revalidatePath("/dashboard/eventos");
  revalidatePath("/dashboard");
}

/** Desactiva un evento */
export async function desactivarEvento(formData: FormData) {
  const id_evento = String(formData.get("id_evento") || "").trim();
  if (!id_evento) return;

  const supabase = await createClient();
  const { data: userRes } = await supabase.auth.getUser();
  if (!userRes?.user) return;

  const admin = createAdminClient();
  await admin.from("eventos").update({ activo: false }).eq("id_evento", id_evento);

  revalidatePath("/dashboard/eventos");
  revalidatePath("/dashboard");
}

/** Guarda la configuración de horario automático de un evento */
export async function guardarHorarioAuto(
  eventoId: string,
  horarioAuto: { activo: boolean; franjas: { dia: number; hora_inicio: string; hora_fin: string }[] }
) {
  const supabase = await createClient();
  const { data: userRes } = await supabase.auth.getUser();
  if (!userRes?.user) return { ok: false, error: "No autenticado" };

  const admin = createAdminClient();
  const { error } = await admin
    .from("eventos")
    .update({ horario_auto: horarioAuto })
    .eq("id", eventoId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/eventos");
  revalidatePath(`/dashboard/eventos/${eventoId}/editar`);
  return { ok: true };
}
