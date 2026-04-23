// app/api/miembros/min/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function calcEdad(fechaISO: string) {
  const d = new Date(fechaISO);
  if (Number.isNaN(d.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  if (age < 0 || age > 130) return null;
  return age;
}

function normalizeRutNoDotsWithHyphen(input: string) {
  const raw = (input || "").trim();
  if (!raw) return "";
  // deja solo numeros y K, y arma body-dv
  const clean = raw.replace(/[^0-9kK]/g, "").toUpperCase();
  if (clean.length < 2) return "";
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  return `${body}-${dv}`;
}

export async function POST(req: Request) {
  // 1) Validar sesión real (cookies)
  const supabase = await createClient();
  const { data: userRes } = await supabase.auth.getUser();

  if (!userRes?.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  // 2) Admin client (service role) para insertar sin RLS
  const admin = createAdminClient();


  const body = await req.json().catch(() => ({} as any));

  const rut = normalizeRutNoDotsWithHyphen(String(body.rut ?? ""));
  const nombres = String(body.nombres ?? "").trim();
  const apellidos = String(body.apellidos ?? "").trim();
  const sexo = body.sexo ? String(body.sexo) : null;
  const fecha_nacimiento = body.fecha_nacimiento ? String(body.fecha_nacimiento) : "";
  const ded = body.ded ? String(body.ded) : null;

  if (!rut) return NextResponse.json({ error: "RUT inválido" }, { status: 400 });
  if (!nombres) return NextResponse.json({ error: "Nombres requerido" }, { status: 400 });
  if (!apellidos) return NextResponse.json({ error: "Apellidos requerido" }, { status: 400 });
  if (!fecha_nacimiento) {
    return NextResponse.json({ error: "Fecha de nacimiento requerida" }, { status: 400 });
  }

  const edad = calcEdad(fecha_nacimiento);
  if (edad === null) {
    return NextResponse.json(
      { error: "Fecha de nacimiento inválida (usa el calendario)" },
      { status: 400 }
    );
  }

  // ✅ Validación de duplicado antes del insert (mensaje amigable)
  const { data: existing } = await admin
    .from("miembros")
    .select("rut")
    .eq("rut", rut)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "El RUT ya está registrado." }, { status: 400 });
  }

  const payload = {
    rut,
    nombres,
    apellidos,
    sexo,
    fecha_nacimiento,
    edad,
    ded,
  };

  const { error } = await admin.from("miembros").insert(payload);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true, rut }, { status: 200 });
}