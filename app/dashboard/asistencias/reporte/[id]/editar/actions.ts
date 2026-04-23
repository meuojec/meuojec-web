"use server";

import { createClient } from "@/lib/supabase/server";

export async function updateAsistenciaByRutCreatedAt(input: {
  rut: string;
  created_at: string;
  fecha: string;
  hora: string;
  ded: string;
  id_evento: string;
  evento_sesion_id: string;
}) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("asistencias")
    .update({
      fecha: input.fecha || null,
      hora: input.hora || null,
      ded: input.ded || null,
      id_evento: input.id_evento || null,
      evento_sesion_id: input.evento_sesion_id || null,
    })
    .eq("created_at", input.created_at)
    .eq("rut", input.rut);

  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function deleteAsistenciaByRutCreatedAt(input: {
  rut: string;
  created_at: string;
}) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("asistencias")
    .delete()
    .eq("created_at", input.created_at)
    .eq("rut", input.rut);

  if (error) throw new Error(error.message);
  return { ok: true };
}