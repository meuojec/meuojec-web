// app/dashboard/reportes/inventario/page.tsx
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import SectionCard from "../_components/SectionCard";
import KpiCard from "../_components/KpiCard";
import ReportFilters from "../_components/ReportFilters";

import InventarioExtraFilters from "./InventarioExtraFilters";
import { getInventarioReport } from "./actions";

function monthStartISO() {
  const d = new Date();
  const first = new Date(d.getFullYear(), d.getMonth(), 1);
  return first.toISOString().slice(0, 10);
}
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function fmtMonthCL(ym: string) {
  // "2026-02" => "Febrero 2026"
  const [y, m] = ym.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString("es-CL", { month: "long", year: "numeric" });
}

export default async function ReporteInventarioPage(props: {
  searchParams?: Promise<{ [k: string]: string | string[] | undefined }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const sp = (props.searchParams ? await props.searchParams : {}) as Record<string, any>;

  const from = (sp.from as string) || monthStartISO();
  const to = (sp.to as string) || todayISO();
  const ubicacion = (sp.ubicacion as string) || "";
  const producto = (sp.producto as string) || "";

  const rep = await getInventarioReport({
    from,
    to,
    ubicacion: ubicacion || undefined,
    producto: producto || undefined,
  });

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/reportes"
              className="inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/5 p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">Reportes &middot; Inventario</h1>
              <p className="mt-1 text-sm text-white/70">
                Movimientos por periodo, stock bajo, rotacion y kardex simple por producto.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <ReportFilters />
          <InventarioExtraFilters initialUbicacion={ubicacion} initialProducto={producto} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard label="Movimientos" value={rep.kpis.movimientos} />
        <KpiCard label="Entradas" value={rep.kpis.entradas} />
        <KpiCard label="Salidas" value={rep.kpis.salidas} />
        <KpiCard label="Neto" value={rep.kpis.neto} hint="Entradas - Salidas" />
      </div>

      <SectionCard title="Movimientos por mes" subtitle="Serie mensual del rango filtrado">
        {rep.serieMensual.length === 0 ? (
          <div className="text-sm text-white/60">Sin movimientos en el rango.</div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-white/70">
                <tr className="border-b border-white/10">
                  <th className="py-2 text-left font-semibold">Mes</th>
                  <th className="py-2 text-right font-semibold">Entradas</th>
                  <th className="py-2 text-right font-semibold">Salidas</th>
                  <th className="py-2 text-right font-semibold">Neto</th>
                  <th className="py-2 text-right font-semibold">Movs</th>
                </tr>
              </thead>
              <tbody className="text-white/90">
                {rep.serieMensual.map((r) => (
                  <tr key={r.mes} className="border-b border-white/5">
                    <td className="py-2 whitespace-nowrap">{fmtMonthCL(r.mes)}</td>
                    <td className="py-2 text-right">{r.entradas}</td>
                    <td className="py-2 text-right">{r.salidas}</td>
                    <td className="py-2 text-right">{r.neto}</td>
                    <td className="py-2 text-right">{r.movs}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Stock bajo" subtitle="Productos con cantidad <= mínimo">
          {rep.stockBajo.length === 0 ? (
            <div className="text-sm text-white/60">Sin stock bajo (o no hay mínimos configurados).</div>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="text-white/70">
                  <tr className="border-b border-white/10">
                    <th className="py-2 text-left font-semibold">Producto</th>
                    <th className="py-2 text-left font-semibold">Ubicación</th>
                    <th className="py-2 text-right font-semibold">Cantidad</th>
                    <th className="py-2 text-right font-semibold">Mínimo</th>
                  </tr>
                </thead>
                <tbody className="text-white/90">
                  {rep.stockBajo.map((r) => (
                    <tr key={`${r.producto_id}-${r.ubicacion_id}`} className="border-b border-white/5">
                      <td className="py-2">{r.producto_nombre}</td>
                      <td className="py-2">{r.ubicacion_nombre}</td>
                      <td className="py-2 text-right">{r.cantidad}</td>
                      <td className="py-2 text-right">{r.minimo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Rotación" subtitle="Top 10 productos por salidas (rango filtrado)">
          {rep.rotacionTop.length === 0 ? (
            <div className="text-sm text-white/60">Sin salidas en el rango.</div>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="text-white/70">
                  <tr className="border-b border-white/10">
                    <th className="py-2 text-left font-semibold">Producto</th>
                    <th className="py-2 text-right font-semibold">Salidas</th>
                  </tr>
                </thead>
                <tbody className="text-white/90">
                  {rep.rotacionTop.map((r) => (
                    <tr key={r.producto_id} className="border-b border-white/5">
                      <td className="py-2">{r.producto_nombre}</td>
                      <td className="py-2 text-right">{r.salidas}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>

      <SectionCard title="Kardex simple" subtitle="Se muestra cuando filtras por Producto (ID)">
        {!producto ? (
          <div className="text-sm text-white/60">
            Ingresa un <b>Producto (ID)</b> en filtros para ver el kardex con saldo acumulado.
          </div>
        ) : rep.kardex.length === 0 ? (
          <div className="text-sm text-white/60">Sin movimientos para ese producto en el rango.</div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-white/70">
                <tr className="border-b border-white/10">
                  <th className="py-2 text-left font-semibold">Fecha</th>
                  <th className="py-2 text-left font-semibold">Tipo</th>
                  <th className="py-2 text-right font-semibold">Cantidad</th>
                  <th className="py-2 text-left font-semibold">Ubicación</th>
                  <th className="py-2 text-left font-semibold">Referencia</th>
                  <th className="py-2 text-left font-semibold">Descripción</th>
                  <th className="py-2 text-right font-semibold">Saldo</th>
                </tr>
              </thead>
              <tbody className="text-white/90">
                {rep.kardex.map((r, idx) => (
                  <tr key={idx} className="border-b border-white/5">
                    <td className="py-2 whitespace-nowrap">{r.fecha}</td>
                    <td className="py-2">{r.tipo}</td>
                    <td className="py-2 text-right">{r.cantidad}</td>
                    <td className="py-2">{r.ubicacion}</td>
                    <td className="py-2">{r.referencia}</td>
                    <td className="py-2">{r.descripcion}</td>
                    <td className="py-2 text-right">{r.saldo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}