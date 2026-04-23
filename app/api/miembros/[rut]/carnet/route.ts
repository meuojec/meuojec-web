import React from "react";
import { NextResponse } from "next/server";
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
    const num = s.slice(0, -1);
    const dv = s.slice(-1);
    s = `${num}-${dv}`;
  }
  return s;
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "No auth" }, { status: 401 });

  const p = (await ctx.params) as Params;
  const rutRaw = p?.rut ?? "";
  const rut = normalizeRut(rutRaw);

  if (!rut) {
    return NextResponse.json({ error: "RUT vacío", rutRaw, params: p }, { status: 400 });
  }

  const { data: miembro, error } = await supabase
    .from("miembros")
    .select("rut,nombres,apellidos,foto_path,foto_url")
    .eq("rut", rut)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "DB error", detail: error.message, rut_buscado: rut },
      { status: 500 }
    );
  }

  if (!miembro) {
    return NextResponse.json({ error: "Miembro no encontrado", rut_buscado: rut }, { status: 404 });
  }

  // Foto
  let fotoUrl: string | null = miembro.foto_url ?? null;
  if (!fotoUrl && miembro.foto_path) {
    const { data } = supabase.storage.from("fotos-identidad").getPublicUrl(miembro.foto_path);
    fotoUrl = data.publicUrl ?? null;
  }

  // Base URL (para QR + para tomar logo desde /public)
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:3000";

  // QR
  const qrText = `${baseUrl}/verificar/miembro/${encodeURIComponent(miembro.rut)}`;
  const qr = await qrDataUrl(qrText);

  // Branding
  const iglesiaNombre =
    process.env.NEXT_PUBLIC_IGLESIA_NOMBRE ||
    "MISIÓN DE LA IGLESIA UNIVERSAL DE JESUCRISTO";

  const logoPath = process.env.NEXT_PUBLIC_IGLESIA_LOGO_PATH || "/logo-iglesia.png";
  const watermarkPath = process.env.NEXT_PUBLIC_IGLESIA_WATERMARK_PATH || "/logo-iglesia.png";

  const logoUrl = await fetchAsDataUrl(`${baseUrl}${logoPath}`);
  const watermarkUrl = await fetchAsDataUrl(`${baseUrl}${watermarkPath}`);

  // ✅ SIN JSX (evita errores parsing)
  const doc = React.createElement(CarnetPdf as any, {
    iglesiaNombre,
    logoUrl,
    watermarkUrl,
    miembro: {
      rut: miembro.rut,
      nombres: miembro.nombres,
      apellidos: miembro.apellidos,
    },
    fotoUrl,
    qrDataUrl: qr,
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