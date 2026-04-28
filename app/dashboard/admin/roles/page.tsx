export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BackButton from "@/app/components/BackButton";
import { ShieldCheck, Plus } from "lucide-react";

type Role = { id: string; key: string; name: string; description: string | null };

const ROLE_COLOR: Record<string, string> = {
  admin:   "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  pastor:  "border-violet-500/30 bg-violet-500/10 text-violet-200",
  diacono: "border-sky-500/30 bg-sky-500/10 text-sky-200",
  ujier:   "border-amber-500/30 bg-amber-500/10 text-amber-200",
};

export default async function RolesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase
    .from("roles")
    .select("id,key,name,description")
    .order("name", { ascending: true });

  const roles = (data ?? []) as Role[];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <BackButton />
            <h1 className="text-2xl font-bold">Roles del sistema</h1>
          </div>
          <p className="mt-1 text-white/60">Roles disponibles para asignar a los usuarios.</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard/admin/permisos"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 hover:bg-white/10 transition"
          >
            Ver matriz de permisos →
          </Link>
          <Link
            href="/dashboard/admin/roles/nuevo"
            className="rounded-xl border border-emerald-500/30 bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/20 transition flex items-center gap-1"
          >
            <Plus className="h-3.5 w-3.5" /> Nuevo rol
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          Error cargando roles: {error.message}
        </div>
      )}

      {roles.length === 0 && !error && (
        <div className="rounded-2xl border border-white/10 bg-black/20 p-8 text-center text-white/40 text-sm">
          No hay roles configurados en el sistema.
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {roles.map((r) => (
          <Link
            key={r.id}
            href={`/dashboard/admin/roles/${r.id}`}
            className="rounded-2xl border border-white/10 bg-black/20 p-5 hover:bg-white/5 transition group"
          >
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${ROLE_COLOR[r.key] ?? "border-white/10 bg-white/5 text-white/60"}`}>
                {r.key}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-white/40 group-hover:text-white/70 transition" />
                  <span className="font-semibold text-white truncate">{r.name}</span>
                </div>
                {r.description && (
                  <p className="mt-1 text-xs text-white/50 line-clamp-2">{r.description}</p>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>

      <p className="text-xs text-white/30">
        Para asignar roles a usuarios ve a{" "}
        <a href="/dashboard/admin/usuarios" className="underline text-white/50 hover:text-white/80">
          Administración → Usuarios
        </a>.
      </p>
    </div>
  );
}
