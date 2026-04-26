// proxy.ts — middleware central de Next.js 16
import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export default async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresca el token y obtiene el usuario autenticado
  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Proteccion central: si no hay sesion, redirigir a /login
  // Excepcion: cron tiene su propio Bearer token
  const isDashboard = pathname.startsWith("/dashboard");
  const isProtectedApi =
    pathname.startsWith("/api/") &&
    !pathname.startsWith("/api/eventos/cron");

  if ((isDashboard || isProtectedApi) && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  // Si ya tiene sesion y visita /login o raiz, redirigir al dashboard
  if (user && (pathname === "/login" || pathname === "/")) {
    const dashUrl = request.nextUrl.clone();
    dashUrl.pathname = "/dashboard";
    return NextResponse.redirect(dashUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/:path*",
    "/auth/:path*",
    "/login",
    "/",
  ],
};
