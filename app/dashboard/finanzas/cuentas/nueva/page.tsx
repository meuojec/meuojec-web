export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CuentaForm from "../_components/CuentaForm";
import BackButton from "@/app/components/BackButton";

export default async function NuevaCuentaPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: prof } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (prof?.role !== "admin") redirect("/dashboard/finanzas/cuentas");

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-3">
          <BackButton />
          <h1 className="text-xl font-semibold text-white">Nueva cuenta (IGLESIA)</h1>
        </div>
        <p className="text-sm text-white/60">Nombre, tipo y moneda son obligatorios.</p>
      </div>

      <CuentaForm mode="create" />
    </div>
  );
}
