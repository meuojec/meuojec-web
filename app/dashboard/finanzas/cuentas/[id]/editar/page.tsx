export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CuentaForm from "../../_components/CuentaForm";
import { getCuentaIGLESIA } from "../../actions";

export default async function EditarCuentaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: prof } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (prof?.role !== "admin") redirect("/dashboard/finanzas/cuentas");

  const res = await getCuentaIGLESIA(id);

  if (!res.ok) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-200">
        Error cargando cuenta: {res.error}
      </div>
    );
  }

  if (!res.data) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-white/60">
        Cuenta no encontrada (o no pertenece a IGLESIA).
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-white">Editar cuenta (IGLESIA)</h1>
        <p className="text-sm text-white/60">Edita nombre/tipo/moneda. El estado “Activa” lo puedes cambiar en el listado.</p>
      </div>

      <CuentaForm mode="edit" cuenta={res.data} />
    </div>
  );
}
