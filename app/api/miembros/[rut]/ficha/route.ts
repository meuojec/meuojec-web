import React from "react";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import FichaMiembroPdf from "@/lib/pdfs/FichaMiembroPdf";
import { pdf } from "@react-pdf/renderer";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ rut: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No auth" }, { status: 401 });

  const { rut: rutRaw } = await params;
  const rut = (rutRaw || "").trim().toUpperCase().replace(/\./g, "");

  const { data: miembro, error } = await supabase
    .from("miembros")
    .select("*")
    .eq("rut", rut)
    .maybeSingle();

  if (error || !miembro) {
    return NextResponse.json({ error: "Miembro no encontrado" }, { status: 404 });
  }

  let fotoUrl: string | null = miembro.foto_url ?? null;
  if (!fotoUrl && miembro.foto_path) {
    const { data } = supabase.storage.from("fotos-identidad").getPublicUrl(miembro.foto_path);
    fotoUrl = data.publicUrl ?? null;
  }

  const doc = React.createElement(FichaMiembroPdf as any, { miembro, fotoUrl });
  const buf = await (pdf as any)(doc).toBuffer();

  return new NextResponse(buf as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="ficha-${miembro.rut}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
