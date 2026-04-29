export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import BackButton from "@/app/components/BackButton";
import FinanzasDashboardClient from "./FinanzasDashboardClient";

function mesLabel(iso: string) {
  const [y, m] = iso.split("-");
  const nombres = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  return `${nombres[parseInt(m) - 1]} ${y.slice(2)}`;
}

export default async function FinanzasDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Rango: últimos 12 meses
  const now = new Date();
  const desde = new Date(now.getFullYear(), now.getMonth() - 11, 1)
    .toISOString().slice(0, 10);

  // Movimientos del período
  const { data: movs } = await supabase
    .from("fin_movimientos")
    .select("id,fecha,tipo,monto,descripcion,cuenta_id,categoria_id")
    .gte("fecha", desde)
    .order("fecha", { ascending: false });

  const movList = (movs ?? []) as {
    id: string; fecha: string | null; tipo: string | null;
    monto: number | null; descripcion: string | null;
    cuenta_id: string | null; categoria_id: string | null;
  }[];

  // Cuentas
  const { data: cuentasData } = await supabase
    .from("fin_cuentas")
    .select("id,nombre,saldo_inicial")
    .eq("activa", true);
  const cuentas = (cuentasData ?? []) as { id: string; nombre: string | null; saldo_inicial: number | null }[];

  // Categorías
  const { data: catsData } = await supabase
    .from("fin_categorias")
    .select("id,nombre,tipo");
  const cats = (catsData ?? []) as { id: string; nombre: string | null; tipo: string | null }[];
  const catMap = new Map(cats.map(c => [c.id, c.nombre ?? "Sin categoría"]));
  const cuentaMap = new Map(cuentas.map(c => [c.id, c.nombre ?? "—"]));

  // KPIs anuales
  const totalIngresos = movList
    .filter(m => m.tipo === "ingreso")
    .reduce((s, m) => s + (m.monto ?? 0), 0);
  const totalEgresos = movList
    .filter(m => m.tipo === "egreso")
    .reduce((s, m) => s + (m.monto ?? 0), 0);
  const balanceNeto = totalIngresos - totalEgresos;

  // Saldo por cuenta (saldo_inicial + movimientos)
  const cuentasConSaldo = cuentas.map(c => {
    const ingresos = movList
      .filter(m => m.cuenta_id === c.id && m.tipo === "ingreso")
      .reduce((s, m) => s + (m.monto ?? 0), 0);
    const egresos = movList
      .filter(m => m.cuenta_id === c.id && m.tipo === "egreso")
      .reduce((s, m) => s + (m.monto ?? 0), 0);
    return { nombre: c.nombre ?? "—", saldo: (c.saldo_inicial ?? 0) + ingresos - egresos };
  });

  // Datos por mes
  const mesesMap = new Map<string, { ingresos: number; egresos: number }>();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    mesesMap.set(key, { ingresos: 0, egresos: 0 });
  }
  for (const m of movList) {
    if (!m.fecha) continue;
    const key = m.fecha.slice(0, 7);
    const entry = mesesMap.get(key);
    if (!entry) continue;
    if (m.tipo === "ingreso") entry.ingresos += m.monto ?? 0;
    if (m.tipo === "egreso") entry.egresos += m.monto ?? 0;
  }
  const meses = Array.from(mesesMap.entries()).map(([key, v]) => ({
    mes: mesLabel(key), ...v
  }));

  // Top categorías de egreso
  const catTotals = new Map<string, number>();
  for (const m of movList.filter(m => m.tipo === "egreso")) {
    const cat = m.categoria_id ? catMap.get(m.categoria_id) ?? "Sin categoría" : "Sin categoría";
    catTotals.set(cat, (catTotals.get(cat) ?? 0) + (m.monto ?? 0));
  }
  const categorias = Array.from(catTotals.entries())
    .map(([nombre, total]) => ({ nombre, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  // Recientes con nombres
  const recientes = movList.slice(0, 15).map(m => ({
    id: m.id,
    fecha: m.fecha ?? "—",
    tipo: m.tipo,
    monto: m.monto,
    descripcion: m.descripcion,
    categoria: m.categoria_id ? catMap.get(m.categoria_id) ?? null : null,
    cuenta: m.cuenta_id ? cuentaMap.get(m.cuenta_id) ?? "—" : "—",
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <BackButton />
            <h1 className="text-3xl font-bold">Dashboard Financiero</h1>
          </div>
          <p className="mt-1 text-white/60">Resumen de los últimos 12 meses</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/finanzas/transacciones"
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10">
            Ver transacciones →
          </Link>
          <Link href="/dashboard/finanzas/reportes"
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10">
            Reportes →
          </Link>
        </div>
      </div>

      <FinanzasDashboardClient
        meses={meses}
        categorias={categorias}
        recientes={recientes}
        totalIngresos={totalIngresos}
        totalEgresos={totalEgresos}
        balanceNeto={balanceNeto}
        cuentas={cuentasConSaldo}
      />
    </div>
  );
}
