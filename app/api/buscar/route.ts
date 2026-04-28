// app/api/buscar/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No auth" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();

  if (q.length < 2) return NextResponse.json({ miembros: [], eventos: [], sesiones: [] });

  const admin = createAdminClient();
  const esRut = /^[\d\-kK.]+$/.test(q);

  // ── Miembros ─────────────────────────────────────────────────────────────
  let miembrosQuery = admin
    .from("miembros")
    .select("rut,nombres,apellidos,ded,foto_url");

  if (esRut) {
    miembrosQuery = miembrosQuery.ilike("rut", `%${q}%`);
  } else {
    miembrosQuery = miembrosQuery.or(
      `nombres.ilike.%${q}%,apellidos.ilike.%${q}%`
    );
  }

  // ── Eventos ───────────────────────────────────────────────────────────────
  const eventosQuery = admin
    .from("eventos")
    .select("id,id_evento,nombre,activo")
    .or(`nombre.ilike.%${q}%,id_evento.ilike.%${q}%`)
    .order("created_at", { ascending: false })
    .limit(5);

  // ── Sesiones ──────────────────────────────────────────────────────────────
  const sesionesQuery = admin
    .from("eventos_sesiones")
    .select("id,nombre,fecha,hora_inicio")
    .ilike("nombre", `%${q}%`)
    .order("fecha", { ascending: false })
    .limit(5);

  const [
    { data: miembrosData },
    { data: eventosData },
    { data: sesionesData },
  ] = await Promise.all([
    miembrosQuery.limit(6),
    eventosQuery,
    sesionesQuery,
  ]);

  const miembros = ((miembrosData ?? []) as any[]).map((m) => ({
    rut: m.rut,
    nombre: [m.nombres, m.apellidos].filter(Boolean).join(" ").trim() || m.rut,
    ded: m.ded ?? null,
    foto_url: m.foto_url ?? null,
  }));

  const eventos = ((eventosData ?? []) as any[]).map((e) => ({
    id: e.id,
    id_evento: e.id_evento,
    nombre: e.nombre ?? e.id_evento,
    activo: !!e.activo,
  }));

  const sesiones = ((sesionesData ?? []) as any[]).map((s) => ({
    id: s.id,
    nombre: s.nombre ?? s.id,
    fecha: s.fecha ?? null,
  }));

  return NextResponse.json({ miembros, eventos, sesiones });
}
