export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = await createClient();

    // Auth check
    const { data: userRes } = await supabase.auth.getUser();
    if (!userRes?.user) {
      return NextResponse.json({ evento: null, sesion: null, error: "No autenticado" }, { status: 401 });
    }

    // 1) Evento activo (usa PK uuid: eventos.id)
    const { data: ev, error: evErr } = await supabase
      .from("eventos")
      .select("id, id_evento, nombre_evento, activo, activated_at")
      .eq("activo", true)
      .maybeSingle();

    if (evErr) {
      return NextResponse.json({ evento: null, sesion: null, error: evErr.message }, { status: 500 });
    }

    if (!ev) {
      return NextResponse.json({ evento: null, sesion: null }, { status: 200 });
    }

    // 2) Sesión activa del evento (IMPORTANTE: eventos_sesiones.evento_id = eventos.id)
    const { data: ses, error: sesErr } = await supabase
      .from("eventos_sesiones")
      .select("id, evento_id, activo, started_at, ended_at")
      .eq("activo", true)
      .eq("evento_id", ev.id)
      .maybeSingle();

    if (sesErr) {
      return NextResponse.json({ evento: null, sesion: null, error: sesErr.message }, { status: 500 });
    }

    // Respuesta con forma “amigable” para tu componente (evento.nombre)
    return NextResponse.json(
      {
        evento: {
          id: ev.id,
          id_evento: ev.id_evento,
          nombre: ev.nombre_evento, // 👈 clave: tu tabla es nombre_evento
          activated_at: ev.activated_at,
        },
        sesion: ses
          ? {
              id: ses.id,
              evento_id: ses.evento_id,
              activo: ses.activo,
              started_at: ses.started_at,
              ended_at: ses.ended_at,
            }
          : null,
      },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { evento: null, sesion: null, error: e?.message ?? "Unhandled error" },
      { status: 500 }
    );
  }
}

// POST /api/eventos/activate — activates an event by id_evento (deactivates all others)
export async function POST(req: Request) {
  // 1) Auth check
  const supabase = await createClient();
  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userRes?.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  // 2) Read id_evento from formData or JSON
  let id_evento: string | null = null;
  const ct = req.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    const body = await req.json().catch(() => ({}));
    id_evento = typeof body?.id_evento === "string" ? body.id_evento.trim() : null;
  } else {
    const form = await req.formData().catch(() => null);
    if (form) id_evento = String(form.get("id_evento") ?? "").trim() || null;
  }

  if (!id_evento) {
    return NextResponse.json({ error: "id_evento requerido" }, { status: 400 });
  }

  const admin = createAdminClient();

  // 3) Deactivate all events first
  const { error: deactivateErr } = await admin
    .from("eventos")
    .update({ activo: false })
    .neq("id_evento", id_evento);

  if (deactivateErr) {
    return NextResponse.json({ error: deactivateErr.message }, { status: 500 });
  }

  // 4) Activate the target event
  const { error: activateErr } = await admin
    .from("eventos")
    .update({ activo: true, activated_at: new Date().toISOString() })
    .eq("id_evento", id_evento);

  if (activateErr) {
    return NextResponse.json({ error: activateErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id_evento }, { status: 200 });
}
