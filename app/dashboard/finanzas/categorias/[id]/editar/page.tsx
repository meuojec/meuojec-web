export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CategoriaForm from "../../_components/CategoriaForm";
import { getCategoriaIGLESIA } from "../../actions";

export default async function EditarCategoriaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: prof } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (prof?.role !== "admin") redirect("/dashboard/finanzas/categorias");

  const res = await getCategoriaIGLESIA(id);

  if (!res.ok) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-200">
        Error cargando categoría: {res.error}
      </div>
    );
  }

  if (!res.data) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-white/60">
        Categoría no encontrada (o no pertenece a IGLESIA).
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-white">Editar categoría (IGLESIA)</h1>
        <p className="text-sm text-white/60">Edita nombre/tipo/orden/tipo default. El estado “Activa” se cambia también aquí o desde el listado.</p>
      </div>

      <CategoriaForm mode="edit" categoria={res.data} />
    </div>
  );
}
