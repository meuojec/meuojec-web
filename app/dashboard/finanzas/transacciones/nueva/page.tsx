export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import TransaccionForm from "../_components/TransaccionForm";

export default async function NuevaTransaccionPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: prof } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (prof?.role !== "admin") redirect("/dashboard/finanzas/transacciones");

  const { data: cuentas } = await supabase
    .from("fin_cuentas")
    .select("id,nombre,tipo,moneda,activa")
    .eq("area", "IGLESIA")
    .eq("activa", true)
    .order("nombre", { ascending: true });

  const { data: categorias } = await supabase
    .from("fin_categorias")
    .select("id,nombre,tipo,activa,orden")
    .eq("area", "IGLESIA")
    .eq("activa", true)
    .order("orden", { ascending: true })
    .order("nombre", { ascending: true });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-white">Nueva transacción</h1>
        <p className="text-sm text-white/60">Área fija: IGLESIA.</p>
      </div>

      <TransaccionForm mode="create" cuentas={cuentas ?? []} categorias={categorias ?? []} />
    </div>
  );
}
