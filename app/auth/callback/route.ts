// app/auth/callback/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  // Si Supabase manda un error, lo mostramos en una redirección simple
  const error = url.searchParams.get("error");
  const error_code = url.searchParams.get("error_code");
  const error_description = url.searchParams.get("error_description");

  if (error || error_code) {
    const msg = encodeURIComponent(error_description ?? error ?? error_code ?? "Error");
    return NextResponse.redirect(new URL(`/login?error=${msg}`, url.origin));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/login", url.origin));
  }

  const supabase = await createClient();
  const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);

  if (exErr) {
    const msg = encodeURIComponent(exErr.message);
    return NextResponse.redirect(new URL(`/login?error=${msg}`, url.origin));
  }

  // Si fue una invitación o confirmación, lo mandamos al dashboard
  return NextResponse.redirect(new URL("/dashboard", url.origin));
}
