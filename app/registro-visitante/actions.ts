"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export type RegistroResult = { ok: true } | { ok: false; error: string };

export async function registrarVisitante(fd: FormData): Promise<RegistroResult> {
  const nombres   = String(fd.get("nombres")    ?? "").trim();
  const apellidos = String(fd.get("apellidos")  ?? "").trim();
  const telefono  = String(fd.get("telefono")   ?? "").trim() || null;
  const origen    = String(fd.get("como_llego") ?? "").trim() || null;
  const direccion = String(fd.get("direccion")  ?? "").trim() || null;

  if (!nombres) return { ok: false, error: "El nombre es obligatorio." };

  const admin = createAdminClient();
  const { error } = await admin.from("visitantes").insert({
    nombres,
    apellidos:            apellidos || null,
    telefono,
    origen,
    notas:                direccion ? `Dirección: ${direccion}` : null,
    fecha_primera_visita: new Date().toISOString().slice(0, 10),
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
