import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const supabase = await createClient();

  // opcional: exigir login
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ evento: null, sesion: null }, { status: 200 });

  // 1) Evento activo
  const { data: ev, error: evErr } = await supabase
    .from("eventos")
    .select("id, id_evento, nombre_evento, activated_at")
    .eq("activo", true)
    .maybeSingle();

  if (evErr || !ev?.id) return NextResponse.json({ evento: null, sesion: null }, { status: 200 });

  // 2) Sesión activa (tabla REAL: eventos_sesiones)
  const { data: ses, error: sesErr } = await supabase
    .from("eventos_sesiones")
    .select("id, evento_id, activo, started_at, ended_at")
    .eq("evento_id", ev.id)
    .eq("activo", true)
    .maybeSingle();

  const evento = {
    id: ev.id,
    id_evento: ev.id_evento ?? null,
    nombre: ev.nombre_evento ?? null,
    activated_at: ev.activated_at ?? null,
  };

  if (sesErr || !ses?.id) return NextResponse.json({ evento, sesion: null }, { status: 200 });

  return NextResponse.json({ evento, sesion: ses }, { status: 200 });
}