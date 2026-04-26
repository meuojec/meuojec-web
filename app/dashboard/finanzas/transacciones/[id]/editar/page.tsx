export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import TransaccionForm from "../../_components/TransaccionForm";
import { getTransaccionIGLESIA } from "../../actions";
import BackButton from "@/app/components/BackButton";

export default async function EditarTransaccionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: prof } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (prof?.role !== "admin") redirect("/dashboard/finanzas/transacciones");

  const res = await getTransaccionIGLESIA(id);

  if (!res.ok) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-200">
        Error: {res.error}
      </div>
    );
  }

  if (!res.data) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-white/60">
        Transacción no encontrada (o no pertenece a IGLESIA).
      </div>
    );
  }

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
        <div className="flex items-center gap-3">
          <BackButton />
          <h1 className="text-xl font-semibold text-white">Editar transacción</h1>
        </div>
        <p className="text-sm text-white/60">Área fija: IGLESIA.</p>
      </div>

      <TransaccionForm
        mode="edit"
        movimiento={res.data}
        cuentas={cuentas ?? []}
        categorias={categorias ?? []}
      />
    </div>
  );
}
