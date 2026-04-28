export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getNavPermissions } from "@/app/lib/auth/permissions";
import MovilAsistenciaClient from "./MovilAsistenciaClient";

export default async function MovilAsistenciaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/movil/asistencia");

  const perms = await getNavPermissions();
  if (!perms.asist) redirect("/movil");

  return <MovilAsistenciaClient />;
}
