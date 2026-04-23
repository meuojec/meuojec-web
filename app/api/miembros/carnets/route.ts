import React from "react";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { qrDataUrl } from "@/lib/qr";
import CarnetsA4Pdf from "@/lib/pdfs/CarnetsA4Pdf";
import { pdf } from "@react-pdf/renderer";

export const dynamic = "force-dynamic";

function asInt(v: string | null, def: number) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : def;
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

export async function GET(req: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "No auth" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const ded = (searchParams.get("ded") || "").trim();
  const limit = asInt(searchParams.get("limit"), 200);
  const onlyWithPhoto = (searchParams.get("foto") || "") === "1";

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:3000";

  // Branding (UNA vez)
  const iglesiaNombre =
    process.env.NEXT_PUBLIC_IGLESIA_NOMBRE ||
    "MISIÓN DE LA IGLESIA UNIVERSAL DE JESUCRISTO";

  const logoPath = process.env.NEXT_PUBLIC_IGLESIA_LOGO_PATH || "/logo-iglesia.png";
  const watermarkPath = process.env.NEXT_PUBLIC_IGLESIA_WATERMARK_PATH || "/logo-iglesia.png";

  const logoUrl = await fetchAsDataUrl(`${baseUrl}${logoPath}`);
  const watermarkUrl = await fetchAsDataUrl(`${baseUrl}${watermarkPath}`);

  // Query miembros
  let q = supabase
    .from("miembros")
    .select("rut,nombres,apellidos,foto_url,foto_path,created_at,ded")
    .order("created_at", { ascending: false })
    .limit(Math.min(limit, 500));

  if (ded) q = q.eq("ded", ded);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []).filter((m: any) => m?.rut);

  const miembros = await Promise.all(
    rows
      .filter((m: any) => {
        if (!onlyWithPhoto) return true;
        return Boolean(m.foto_url || m.foto_path);
      })
      .map(async (m: any) => {
        // Foto
        let fotoUrl: string | null = m.foto_url ?? null;
        if (!fotoUrl && m.foto_path) {
          const { data } = supabase.storage.from("fotos-identidad").getPublicUrl(m.foto_path);
          fotoUrl = data.publicUrl ?? null;
        }

        // QR
        const qrText = `${baseUrl}/verificar/miembro/${encodeURIComponent(m.rut)}`;
        const qr = await qrDataUrl(qrText);

        return {
          rut: m.rut,
          nombres: m.nombres,
          apellidos: m.apellidos,
          fotoUrl,
          qrDataUrl: qr,
        };
      })
  );

  // ✅ SIN JSX
  const doc = React.createElement(CarnetsA4Pdf as any, {
    titulo: "Carnets de miembros",
    iglesiaNombre,
    logoUrl,
    watermarkUrl,
    miembros,
  });

  const buf = await (pdf as any)(doc).toBuffer();

  const filename = ded ? `carnets-${ded}.pdf` : `carnets.pdf`;

  return new NextResponse(buf as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}