export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ToggleActiva from "./_components/ToggleActiva";
import { listCategoriasIGLESIA, type CategoriaRow } from "./actions";

export default async function CategoriasPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: prof } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  const isAdmin = prof?.role === "admin";

  const res = await listCategoriasIGLESIA();
  const rows = (res.ok ? res.data : []) as CategoriaRow[];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Finanzas · Categorías (IGLESIA)</h1>
          <p className="text-sm text-white/60">Ingreso / Egreso, orden y estado.</p>
        </div>

        {isAdmin && (
          <Link
            href="/dashboard/finanzas/categorias/nueva"
            className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
          >
            + Nueva categoría
          </Link>
        )}
      </div>

      {!res.ok && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">
          Error: {res.error}
        </div>
      )}

      <div className="rounded-2xl border border-white/10 bg-black/20">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/10 text-white/70">
              <tr>
                <th className="px-4 py-3">Orden</th>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Tipo default</th>
                <th className="px-4 py-3">Activa</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {rows.length === 0 && res.ok && (
                <tr>
                  <td className="px-4 py-6 text-white/60" colSpan={6}>
                    No hay categorías creadas para IGLESIA.
                  </td>
                </tr>
              )}

              {rows.map((c) => (
                <tr key={c.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                  <td className="px-4 py-3 text-white/70">{c.orden ?? 0}</td>
                  <td className="px-4 py-3 font-medium text-white">{c.nombre ?? "—"}</td>
                  <td className="px-4 py-3 text-white/70">{c.tipo ?? "—"}</td>
                  <td className="px-4 py-3 text-white/70">{c.tipo_default ?? "NULL"}</td>
                  <td className="px-4 py-3">
                    <ToggleActiva id={c.id} activa={!!c.activa} disabled={!isAdmin} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    {isAdmin ? (
                      <Link
                        href={`/dashboard/finanzas/categorias/${c.id}/editar`}
                        className="inline-flex items-center rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10"
                      >
                        Editar
                      </Link>
                    ) : (
                      <span className="text-xs text-white/40">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {!isAdmin && (
        <div className="rounded-2xl border border-white/10 bg-black/20 p-3 text-sm text-white/60">
          Tu usuario no es admin: puedes ver categorías, pero no editarlas.
        </div>
      )}
    </div>
  );
}
