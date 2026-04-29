export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import BackButton from "@/app/components/BackButton";
import { getPresupuesto } from "./actions";
import PresupuestoClient from "./PresupuestoClient";

function mesActual() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function mesLabel(mes: string) {
  const [y, m] = mes.split("-");
  const nombres = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  return `${nombres[parseInt(m) - 1]} ${y}`;
}

function mesesOpciones() {
  const now = new Date();
  const meses = [];
  for (let i = 5; i >= -2; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = mesLabel(val);
    meses.push({ val, label });
  }
  return meses;
}

export default async function PresupuestoPage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: prof } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  const isAdmin = prof?.role === "admin";

  const spRaw = await Promise.resolve(props.searchParams ?? {});
  const get1 = (k: string) => { const v = spRaw[k]; return Array.isArray(v) ? v[0] : (v ?? ""); };
  const mes = get1("mes") || mesActual();

  const data = await getPresupuesto(mes);
  const opciones = mesesOpciones();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <BackButton />
          <div>
            <h1 className="text-2xl font-bold text-white">Presupuesto</h1>
            <p className="text-sm text-white/50 mt-0.5">{mesLabel(mes)} · Presupuestado vs ejecutado por categoría</p>
          </div>
        </div>
        <Link href="/dashboard/finanzas/reportes"
          className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10">
          Ver reportes →
        </Link>
      </div>

      {/* Selector de mes */}
      <form method="get" className="flex items-center gap-2">
        <label className="text-sm text-white/60">Mes:</label>
        <select name="mes" defaultValue={mes} onChange="this.form.submit()"
          className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none">
          {opciones.map(o => (
            <option key={o.val} value={o.val}>{o.label}</option>
          ))}
        </select>
        <button type="submit"
          className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10">
          Ver
        </button>
      </form>

      <PresupuestoClient
        rows={data.rows}
        mes={mes}
        isAdmin={isAdmin}
        totalPresupuestadoIngreso={data.totalPresupuestadoIngreso}
        totalPresupuestadoEgreso={data.totalPresupuestadoEgreso}
        totalEjecutadoIngreso={data.totalEjecutadoIngreso}
        totalEjecutadoEgreso={data.totalEjecutadoEgreso}
      />
    </div>
  );
}
