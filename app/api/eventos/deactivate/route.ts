// app/api/eventos/deactivate/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  // 1) Validar sesion
  const supabase = await createClient();
  const { data: userRes, error: userErr } = await supabase.auth.getUser();

  if (userErr || !userRes?.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  // 2) Leer body (formData o JSON)
  let id_evento: string | null = null;

  const ct = req.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    const body = await req.json().catch(() => ({}));
    id_evento = typeof body?.id_evento === "string" ? body.id_evento.trim() : null;
  } else {
    const form = await req.formData().catch(() => null);
    if (form) id_evento = String(form.get("id_evento") ?? "").trim();
  }

  if (!id_evento) {
    return NextResponse.json({ error: "id_evento requerido" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { error } = await admin
    .from("eventos")
    .update({ activo: false })
    .eq("id_evento", id_evento);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Retornar JSON — el cliente es responsable de navegar/actualizar la UI
  return NextResponse.json({ ok: true, id_evento }, { status: 200 });
}
