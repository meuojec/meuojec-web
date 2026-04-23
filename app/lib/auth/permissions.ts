// app/lib/auth/permissions.ts
import "server-only";
import { createClient } from "@/lib/supabase/server";

export type NavPerms = {
  dash: boolean;
  miembros: boolean;
  asist: boolean;
  eventos: boolean;
  fin: boolean;
  inv: boolean;
  ded: boolean;
  reportes: boolean;
  admin: boolean;
  ministerios: boolean;
  contribuciones: boolean;
  visitantes: boolean;
  pastoral: boolean;
  anuncios: boolean;
  agenda: boolean;
};

const DENY_ALL: NavPerms = {
  dash: false, miembros: false, asist: false, eventos: false,
  fin: false, inv: false, ded: false, reportes: false, admin: false,
  ministerios: false, contribuciones: false, visitantes: false,
  pastoral: false, anuncios: false, agenda: false,
};

const ADMIN_ALL: NavPerms = {
  dash: true, miembros: true, asist: true, eventos: true,
  fin: true, inv: true, ded: true, reportes: true, admin: true,
  ministerios: true, contribuciones: true, visitantes: true,
  pastoral: true, anuncios: true, agenda: true,
};

/**
 * Obtiene los permisos de navegacion del usuario autenticado.
 *
 * Orden de resolucion:
 *  1. Si profiles.role = "admin"  -> acceso total (sin depender del RBAC RPC)
 *  2. Si la RPC has_permission existe y responde -> usar sus resultados
 *  3. Fallback por profiles.role para roles conocidos (ujier, etc.)
 */
export async function getNavPermissions(): Promise<NavPerms> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return DENY_ALL;

  // 1) Leer role desde profiles (siempre, es rapido)
  const { data: prof } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = prof?.role ?? null;

  // Admin siempre tiene acceso total
  if (role === "admin") return ADMIN_ALL;

  // 2) Intentar RBAC via RPC para roles no-admin
  try {
    const modules = [
      "dashboard", "miembros", "asistencias", "eventos",
      "finanzas", "inventario", "ded", "reportes", "administracion",
      "ministerios", "contribuciones", "visitantes", "pastoral",
      "anuncios", "agenda",
    ];

    const results = await Promise.all(
      modules.map((m) =>
        supabase.rpc("has_permission", { p_module: m, p_action: "view" })
      )
    );

    const allErrored = results.every((r) => r.error);
    if (allErrored) throw new Error("RPC has_permission no disponible");

    const [
      dash, miembros, asist, eventos, fin, inv, ded, reportes, admin,
      ministerios, contribuciones, visitantes, pastoral, anuncios, agenda,
    ] = results.map((r) => !!r.data);

    return {
      dash, miembros, asist, eventos, fin, inv, ded, reportes, admin,
      ministerios, contribuciones, visitantes, pastoral, anuncios, agenda,
    };
  } catch {
    // 3) Fallback por role legacy
    if (role === "ujier") {
      return {
        dash: true, miembros: false, asist: true, eventos: true,
        fin: false, inv: false, ded: false, reportes: false, admin: false,
        ministerios: false, contribuciones: false, visitantes: false,
        pastoral: false, anuncios: true, agenda: true,
      };
    }
    return { ...DENY_ALL, dash: true, anuncios: true, agenda: true };
  }
}
