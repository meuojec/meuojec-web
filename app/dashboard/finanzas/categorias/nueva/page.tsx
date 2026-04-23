export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CategoriaForm from "../_components/CategoriaForm";

export default async function NuevaCategoriaPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: prof } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (prof?.role !== "admin") redirect("/dashboard/finanzas/categorias");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-white">Nueva categoría (IGLESIA)</h1>
        <p className="text-sm text-white/60">Nombre y tipo son obligatorios.</p>
      </div>

      <CategoriaForm mode="create" />
    </div>
  );
}
