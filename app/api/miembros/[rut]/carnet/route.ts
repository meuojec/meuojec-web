import React from "react";
import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";
import { createClient } from "@/lib/supabase/server";
import { qrDataUrl } from "@/lib/qr";
import CarnetPdf from "@/lib/pdfs/CarnetPdf";
import { pdf } from "@react-pdf/renderer";

export const dynamic = "force-dynamic";

function normalizeRut(input: string) {
  let s = (input || "").trim().toUpperCase();
  s = s.replace(/\s+/g, "").replace(/\./g, "");
  s = s.replace(/[^0-9K-]/g, "");
  if (!s.includes("-") && s.length >= 2) {
    s = `${s.slice(0, -1)}-${s.slice(-1)}`;
  }
  return s;
}

function readPublicAsDataUrl(filePath: string): string | null {
  try {
    const abs = join(process.cwd(), "public", filePath.replace(/^\//, ""));
    const buf = readFileSync(abs);
    const ext = (filePath.split(".").pop() || "png").toLowerCase();
    const mime = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : "image/png";
    return `data:${mime};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

async function fetchAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") || "image/png";
    const buf = Buffer.from(await res.arrayBuffer());
    return `data:${contentType};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

type Params = { rut?: string };

export async function GET(_req: Request, ctx: { params: Params | Promise<Params> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No auth" }, { status: 401 });

  const p = (await ctx.params) as Params;
  const rut = normalizeRut(p?.rut ?? "");
  if (!rut) return NextResponse.json({ error: "RUT vacio" }, { status: 400 });

  const { data: miembro, error } = await supabase
    .from("miembros")
    .select("rut,nombres,apellidos,foto_path,foto_url,fecha_nacimiento,departamento")
    .eq("rut", rut)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!miembro) return NextResponse.json({ error: "Miembro no encontrado" }, { status: 404 });

  // Foto
  let fotoUrl: string | null = miembro.foto_url ?? null;
  if (!fotoUrl && miembro.foto_path) {
    const { data } = supabase.storage.from("fotos-identidad").getPublicUrl(miembro.foto_path);
    fotoUrl = data.publicUrl ?? null;
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:3000";

  // QR frente: URL de verificacion del miembro (para escaneo de asistencia)
  const qrFront = await qrDataUrl(
    `${baseUrl}/verificar/miembro/${encodeURIComponent(miembro.rut)}`
  );

  // QR reverso: sitio web publico
  const qrBack = await qrDataUrl("https://www.meuojec.org");

  const iglesiaFull = process.env.NEXT_PUBLIC_IGLESIA_NOMBRE ||
    "MISION DE LA IGLESIA UNIVERSAL ORGANIZADA DE JESUCRISTO";
  const iglesiaShort = process.env.NEXT_PUBLIC_IGLESIA_SHORT || "MEUOJEC";

  const logoPath      = process.env.NEXT_PUBLIC_IGLESIA_LOGO_PATH      || "/logo-iglesia.png";
  const watermarkPath = process.env.NEXT_PUBLIC_IGLESIA_WATERMARK_PATH || "/logo-iglesia.png";

  const logoUrl      = readPublicAsDataUrl(logoPath);
  const watermarkUrl = readPublicAsDataUrl(watermarkPath);

  const doc = React.createElement(CarnetPdf as any, {
    iglesiaFull,
    iglesiaShort,
    logoUrl,
    watermarkUrl,
    miembro: {
      rut: miembro.rut,
      nombres: miembro.nombres,
      apellidos: miembro.apellidos,
      departamento: miembro.departamento,
      fecha_nacimiento: miembro.fecha_nacimiento,
    },
    fotoUrl,
    qrDataUrl: qrFront,
    backProps: {
      iglesiaFull,
      iglesiaShort,
      logoUrl,
      direccion: "Americo Vespucio 1356, Quilicura",
      telefono: "+56 9 3603 6989",
      web: "www.meuojec.org",
      qrWebDataUrl: qrBack,
      rut: miembro.rut,
    },
  });

  const buf = await (pdf as any)(doc).toBuffer();

  return new NextResponse(buf as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="carnet-${miembro.rut}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
