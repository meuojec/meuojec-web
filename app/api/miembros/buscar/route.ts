// app/api/miembros/buscar/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function normalizeRut(input: string) {
  let s = (input || "").trim().toUpperCase();
  s = s.replace(/\s+/g, "").replace(/\./g, "");
  s = s.replace(/[^0-9K-]/g, "");
  if (!s.includes("-") && s.length >= 2) s = `${s.slice(0, -1)}-${s.slice(-1)}`;
  return s;
}

export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No auth" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const rutParam = searchParams.get("rut") ?? "";
  const nombreParam = searchParams.get("nombre") ?? "";

  const admin = createAdminClient();
  let query = admin.from("miembros").select("rut,nombres,apellidos,foto_url,ded");

  if (rutParam) {
    query = query.eq("rut", normalizeRut(rutParam));
  } else if (nombreParam.trim()) {
    query = query.or(`nombres.ilike.%${nombreParam.trim()}%,apellidos.ilike.%${nombreParam.trim()}%`);
  } else {
    return NextResponse.json({ miembros: [] });
  }

  const { data, error } = await query.order("apellidos").limit(20);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ miembros: data ?? [] });
}
