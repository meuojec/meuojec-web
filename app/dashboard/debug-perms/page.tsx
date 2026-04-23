export const dynamic = "force-dynamic";
export const revalidate = 0;

import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function hasCap(supabase: any, cap: string) {
  const { data, error } = await supabase.rpc("has_capability_current", {
    p_capability: cap,
  });
  return { cap, ok: !error, value: !!data, error: error?.message ?? null };
}

export default async function DebugPermsPage() {
  const supabase = await createClient();

  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;

  // Solo admins pueden acceder a esta pagina de diagnostico
  if (!user) redirect("/login");

  const { data: prof } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (prof?.role !== "admin") redirect("/dashboard");

  const checks = await Promise.all([
    hasCap(supabase, "admin.access"),
    hasCap(supabase, "miembros.read"),
    hasCap(supabase, "asist.read"),
    hasCap(supabase, "eventos.read"),
    hasCap(supabase, "fin.read"),
    hasCap(supabase, "inv.read"),
    hasCap(supabase, "ded.read"),
  ]);

  return (
    <div className="min-h-screen bg-[#0b0b0b] text-white p-6">
      <h1 className="text-2xl font-bold">Debug Permisos</h1>
      <p className="text-sm text-white/40 mt-1">Solo visible para administradores.</p>

      <div className="mt-4 rounded-2xl border border-white/10 bg-black/40 p-4">
        <div className="text-white/70 text-sm">Usuario</div>
        <div className="font-mono text-sm mt-2">
          <div><span className="text-white/50">id:</span> {user.id}</div>
          <div><span className="text-white/50">email:</span> {user.email}</div>
          <div><span className="text-white/50">role:</span> {prof?.role ?? "—"}</div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-black/40 p-4">
        <div className="text-white/70 text-sm mb-2">Capabilities</div>
        <pre className="text-xs overflow-auto">{JSON.stringify(checks, null, 2)}</pre>
      </div>
    </div>
  );
}
