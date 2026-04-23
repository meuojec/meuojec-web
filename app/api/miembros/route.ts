// app/api/miembros/route.ts
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
  const clean = raw.replace(/[^0-9kK]/g, "").toUpperCase();
  if (clean.length < 2) return "";
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  return `${body}-${dv}`;
}

function toBool(v: FormDataEntryValue | null) {
  if (v === null) return null;
  const s = String(v);
  return s === "true" || s === "on" || s === "1";
}
function toInt(v: FormDataEntryValue | null) {
  if (v === null) return null;
  const n = Number(String(v));
  return Number.isFinite(n) ? n : null;
}
function toStr(v: FormDataEntryValue | null) {
  if (v === null) return null;
  const s = String(v).trim();
  return s ? s : null;
}

export async function POST(req: Request) {
  // 1) Validar sesión (cookies)
  const supabase = await createClient();
  const { data: userRes } = await supabase.auth.getUser();
  if (!userRes?.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  // 2) Admin para bypass RLS + Storage
  const admin = createAdminClient();
  const bucket = process.env.SUPABASE_BUCKET || "fotos-identidad";

  const form = await req.formData();

  // Campos base
  const rut = normalizeRutNoDotsWithHyphen(String(form.get("rut") ?? ""));
  const nombres = String(form.get("nombres") ?? "").trim();
  const apellidos = String(form.get("apellidos") ?? "").trim();
  const sexo = toStr(form.get("sexo"));
  const ded = toStr(form.get("ded"));

  const fecha_nacimiento = String(form.get("fecha_nacimiento") ?? "").trim();
  if (!rut) return NextResponse.json({ error: "RUT inválido" }, { status: 400 });
  if (!nombres) return NextResponse.json({ error: "Nombres requerido" }, { status: 400 });
  if (!apellidos) return NextResponse.json({ error: "Apellidos requerido" }, { status: 400 });
  if (!fecha_nacimiento) {
    return NextResponse.json({ error: "Fecha de nacimiento requerida" }, { status: 400 });
  }
  const edad = calcEdad(fecha_nacimiento);
  if (edad === null) {
    return NextResponse.json({ error: "Fecha de nacimiento inválida" }, { status: 400 });
  }

  // Duplicado (mensaje bonito)
  const { data: existing } = await admin
    .from("miembros")
    .select("rut")
    .eq("rut", rut)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "El RUT ya está registrado." }, { status: 400 });
  }

  // Subida foto (opcional)
  let foto_path: string | null = null;
  let foto_url: string | null = null;

  const file = form.get("foto") as File | null;
  if (file && file.size > 0) {
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const safeExt = ["jpg", "jpeg", "png", "webp"].includes(ext) ? ext : "jpg";
    foto_path = `miembros/${rut}.${safeExt}`;

    const arrayBuffer = await file.arrayBuffer();
    const { error: upErr } = await admin.storage
      .from(bucket)
      .upload(foto_path, new Uint8Array(arrayBuffer), {
        upsert: true,
        contentType: file.type || "image/jpeg",
      });

    if (upErr) {
      return NextResponse.json({ error: `Error subiendo foto: ${upErr.message}` }, { status: 400 });
    }

    const { data } = admin.storage.from(bucket).getPublicUrl(foto_path);
    foto_url = data?.publicUrl ?? null;
  }

  // Otros campos (según tu tabla)
  const payload: any = {
    rut,
    nombres,
    apellidos,
    sexo,
    ded,
    fecha_nacimiento,
    edad,

    nacionalidad: toStr(form.get("nacionalidad")),
    estado_civil: toStr(form.get("estado_civil")),

    // Familia (solo si aplica en UI; aquí lo aceptamos igual)
    fecha_matrimonio: toStr(form.get("fecha_matrimonio")),
    anio_matrimonio: toInt(form.get("anio_matrimonio")),
    nombre_conyuge: toStr(form.get("nombre_conyuge")),
    numero_hijos: toInt(form.get("numero_hijos")),

    direccion: toStr(form.get("direccion")),
    comuna: toStr(form.get("comuna")),
    telefono: toStr(form.get("telefono")),
    correo_electronico: toStr(form.get("correo_electronico")),

    razon_alta: toStr(form.get("razon_alta")),
    fecha_conversion: toStr(form.get("fecha_conversion")),
    fecha_bautizo: toStr(form.get("fecha_bautizo")),
    departamento: toStr(form.get("departamento")),

    asiste_antes_otra_iglesia: toBool(form.get("asiste_antes_otra_iglesia")),
    nombre_iglesia_anterior: toStr(form.get("nombre_iglesia_anterior")),

    profesion_oficio: toStr(form.get("profesion_oficio")),
    lugar_trabajo_estudio: toStr(form.get("lugar_trabajo_estudio")),

    nivel_academico: toStr(form.get("nivel_academico")),
    prevision: toStr(form.get("prevision")),

    alergia_medicamento: toStr(form.get("alergia_medicamento")),
    medicacion_permanente: toStr(form.get("medicacion_permanente")),
    discapacidad_fisica: toBool(form.get("discapacidad_fisica")),

    tiene_vehiculo: toBool(form.get("tiene_vehiculo")),
    marca_modelo: toStr(form.get("marca_modelo")),
    patente: toStr(form.get("patente")),

    observaciones: toStr(form.get("observaciones")),
    estado_membresia: toStr(form.get("estado_membresia")),

    foto_path,
    foto_url,
  };

  const { error: insErr } = await admin.from("miembros").insert(payload);
  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 400 });

  return NextResponse.json({ ok: true, rut }, { status: 200 });
}