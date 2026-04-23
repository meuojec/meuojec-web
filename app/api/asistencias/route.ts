// app/api/asistencias/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function getTodayISO() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function getCurrentTime() {
  const now = new Date();
  return now.toTimeString().slice(0, 8); // HH:mm:ss
}

function normalizeRut(input: string) {
  const raw = (input || "").trim();
  if (!raw) return "";
  const clean = raw.replace(/[^0-9kK]/g, "").toUpperCase();
  if (clean.length < 2) return "";
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  return `${body}-${dv}`;
}

export async function POST(req: Request) {
  // 1️⃣ Validar sesión
  const supabase = await createClient();
  const { data: userRes } = await supabase.auth.getUser();

  if (!userRes?.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  // 2️⃣ Cliente admin (bypass RLS)
  const admin = createAdminClient();

  const body = await req.json();
  const rut = normalizeRut(body?.rut ?? "");

  if (!rut) {
    return NextResponse.json({ error: "RUT inválido" }, { status: 400 });
  }

  const todayISO = getTodayISO();
  const horaActual = getCurrentTime();

  // 3️⃣ Buscar miembro
  const { data: miembro } = await admin
    .from("miembros")
    .select("rut,ded")
    .eq("rut", rut)
    .maybeSingle();

  if (!miembro) {
    return NextResponse.json({ error: "Miembro no encontrado" }, { status: 404 });
  }

  // 4️⃣ Buscar evento activo
  const { data: eventoActivo } = await admin
    .from("eventos")
    .select("id_evento,nombre")
    .eq("activo", true)
    .maybeSingle();

  if (!eventoActivo) {
    return NextResponse.json(
      { error: "No hay evento activo actualmente" },
      { status: 400 }
    );
  }

  // 5️⃣ Verificar duplicado (mismo rut mismo día mismo evento)
  const { data: existente } = await admin
    .from("asistencias")
    .select("rut")
    .eq("rut", rut)
    .eq("fecha", todayISO)
    .eq("id_evento", eventoActivo.id_evento)
    .maybeSingle();

  if (existente) {
    return NextResponse.json(
      { error: "Asistencia ya registrada hoy para este evento" },
      { status: 409 }
    );
  }

  // 6️⃣ Insertar asistencia guardando ID + nombre del evento
  const { error: insertErr } = await admin.from("asistencias").insert({
    rut: miembro.rut,
    fecha: todayISO,
    hora: horaActual,
    ded: miembro.ded,
    id_evento: eventoActivo.id_evento,
    evento_nombre: eventoActivo.nombre, // 👈 IMPORTANTE
  });

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    rut: miembro.rut,
    evento: eventoActivo.nombre,
    hora: horaActual,
  });
}