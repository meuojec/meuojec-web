"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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

/** Crea un nuevo evento */
export async function crearEvento(formData: FormData) {
  const nombre      = String(formData.get("nombre")      || "").trim();
  const id_evento   = String(formData.get("id_evento")   || "").trim();
  const fechaRaw    = String(formData.get("fecha_evento") || "").trim();
  const horaRaw     = String(formData.get("hora_evento")  || "").trim();

  if (!nombre || !id_evento) return;

  const fecha_evento = fechaRaw || null;
  const hora_evento  = horaRaw  || null;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const admin = createAdminClient();
  const { error } = await admin.from("eventos").insert({
    nombre,
    id_evento,
    activo: false,
    fecha_evento,
    hora_evento,
  });
  if (error) { console.error("[crearEvento]", error.message); return; }

  revalidatePath("/dashboard/eventos");
  revalidatePath("/dashboard");

  redirect("/dashboard/eventos");
}
