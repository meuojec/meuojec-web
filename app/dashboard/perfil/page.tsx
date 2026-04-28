export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PerfilClient from "./PerfilClient";

export default async function PerfilPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, email, is_active, perms")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Mi perfil</h1>
        <p className="mt-1 text-sm text-white/50">Actualiza tu nombre y contraseña de acceso.</p>
      </div>
      <PerfilClient
        userId={user.id}
        email={user.email ?? ""}
        displayName={profile?.display_name ?? ""}
      />
    </div>
  );
}
