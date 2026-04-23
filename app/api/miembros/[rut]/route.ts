import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ rut: string }> }
) {
  const { rut } = await params;
  const rutDecoded = decodeURIComponent(rut);

  // 1) Validar sesion del usuario (anon client con cookies)
  const supabase = await createClient();
  const { data: userRes } = await supabase.auth.getUser();
  if (!userRes?.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const fd = await req.formData();

  const rutBody = String(fd.get("rut") ?? "").trim();
  const rutFinal = rutDecoded || rutBody;

  if (!rutFinal) {
    return NextResponse.json({ error: "RUT faltante" }, { status: 400 });
  }

  // 2) Admin client para Storage (bypass RLS en bucket protegido)
  const admin = createAdminClient();
  const bucket = process.env.SUPABASE_BUCKET || "fotos-identidad";

  let fotoPath: string | null = null;
  let fotoUrl: string | null = null;

  const foto = fd.get("foto");
  if (foto instanceof File && foto.size > 0) {
    const ext = (foto.name.split(".").pop() || "jpg").toLowerCase();
    const safeExt = ["jpg", "jpeg", "png", "webp"].includes(ext) ? ext : "jpg";
    fotoPath = `miembros/${rutFinal}.${safeExt}`;

    const arrayBuffer = await foto.arrayBuffer();
    const { error: upErr } = await admin.storage
      .from(bucket)
      .upload(fotoPath, new Uint8Array(arrayBuffer), {
        upsert: true,
        contentType: foto.type || "image/jpeg",
      });

    if (upErr) {
      return NextResponse.json({ error: `Error subiendo foto: ${upErr.message}` }, { status: 400 });
    }

    const { data: urlData } = admin.storage.from(bucket).getPublicUrl(fotoPath);
    fotoUrl = urlData?.publicUrl ?? null;
  }

  const toBool = (v: FormDataEntryValue | null) => String(v ?? "").toLowerCase() === "true";

  const payload: any = {
    rut: String(fd.get("rut") ?? rutFinal).trim(),
    nombres: String(fd.get("nombres") ?? ""),
    apellidos: String(fd.get("apellidos") ?? ""),
    sexo: String(fd.get("sexo") ?? ""),
    fecha_nacimiento: String(fd.get("fecha_nacimiento") ?? "") || null,
    nacionalidad: String(fd.get("nacionalidad") ?? ""),
    estado_civil: String(fd.get("estado_civil") ?? ""),

    fecha_matrimonio: String(fd.get("fecha_matrimonio") ?? "") || null,
    anio_matrimonio: String(fd.get("anio_matrimonio") ?? "") || null,
    nombre_conyuge: String(fd.get("nombre_conyuge") ?? ""),
    numero_hijos: String(fd.get("numero_hijos") ?? "") || null,

    direccion: String(fd.get("direccion") ?? ""),
    comuna: String(fd.get("comuna") ?? ""),
    telefono: String(fd.get("telefono") ?? ""),
    correo_electronico: String(fd.get("correo_electronico") ?? ""),

    razon_alta: String(fd.get("razon_alta") ?? ""),
    fecha_conversion: String(fd.get("fecha_conversion") ?? "") || null,
    fecha_bautizo: String(fd.get("fecha_bautizo") ?? "") || null,
    asiste_antes_otra_iglesia: toBool(fd.get("asiste_antes_otra_iglesia")),
    nombre_iglesia_anterior: String(fd.get("nombre_iglesia_anterior") ?? ""),

    estado_membresia: String(fd.get("estado_membresia") ?? ""),
    ded: String(fd.get("ded") ?? ""),
    departamento: String(fd.get("departamento") ?? ""),

    profesion_oficio: String(fd.get("profesion_oficio") ?? ""),
    lugar_trabajo_estudio: String(fd.get("lugar_trabajo_estudio") ?? ""),
    nivel_academico: String(fd.get("nivel_academico") ?? ""),
    prevision: String(fd.get("prevision") ?? ""),
    alergia_medicamento: String(fd.get("alergia_medicamento") ?? ""),
    medicacion_permanente: String(fd.get("medicacion_permanente") ?? ""),
    discapacidad_fisica: toBool(fd.get("discapacidad_fisica")),

    tiene_vehiculo: toBool(fd.get("tiene_vehiculo")),
    patente: String(fd.get("patente") ?? ""),
    marca_modelo: String(fd.get("marca_modelo") ?? ""),

    observaciones: String(fd.get("observaciones") ?? ""),
  };

  // Actualizar columnas de foto si se subio una nueva
  if (fotoPath) {
    payload.foto_path = fotoPath;
    if (fotoUrl) payload.foto_url = fotoUrl;
  }

  // Usar admin para el UPDATE tambien (bypass RLS en tabla miembros)
  const { data, error } = await admin
    .from("miembros")
    .update(payload)
    .eq("rut", rutFinal)
    .select("rut")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (!data) {
    return NextResponse.json({ error: "Miembro no encontrado" }, { status: 404 });
  }

  return NextResponse.json({ rut: data.rut });
}
