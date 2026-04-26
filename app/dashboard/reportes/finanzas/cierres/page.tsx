export const dynamic = "force-dynamic";
export const revalidate = 0;

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SectionCard from "@/app/dashboard/reportes/_components/SectionCard";
import CerrarMesForm from "./CerrarMesForm";
import { getCierres } from "./actions";
import BackButton from "@/app/components/BackButton";

function ymFromDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function moneyCL(n: number) {
  try {
    return n.toLocaleString("es-CL", {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0,
    });
  } catch {
    return String(n);
  }
}

function fmtMesLabel(yyyymmStr: string) {
  const [y, m] = (yyyymmStr || "").split("-");
  const year = Number(y);
  const month = Number(m);
  if (!Number.isFinite(year) || !Number.isFinite(month)) return yyyymmStr || "—";
  const d = new Date(year, month - 1, 1);
  const s = d.toLocaleDateString("es-CL", { month: "long", year: "numeric" });
  return s.replace(/^\p{L}/u, (c) => c.toUpperCase());
}

export default async function FinanzasCierresPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const cierres = await getCierres();
  const defaultMes = ymFromDate(new Date());

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
        <div className="flex items-center gap-3">
          <BackButton />
          <h1 className="text-xl font-bold text-white">Finanzas · Cierres</h1>
        </div>
        <p className="mt-1 text-sm text-white/70">
          Cierres mensuales (snapshot) para control y auditoría.
        </p>
      </div>

      <CerrarMesForm defaultMes={defaultMes} />

      <SectionCard title="Historial de cierres" subtitle="Mes, totales y saldo">
        {cierres.length === 0 ? (
          <div className="text-sm text-white/60">Aún no hay cierres.</div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-white/70">
                <tr className="border-b border-white/10">
                  <th className="py-2 text-left font-semibold">Mes</th>
                  <th className="py-2 text-right font-semibold">Ingresos</th>
                  <th className="py-2 text-right font-semibold">Egresos</th>
                  <th className="py-2 text-right font-semibold">Saldo</th>
                  <th className="py-2 text-left font-semibold">Cerrado</th>
                  <th className="py-2 text-left font-semibold">Nota</th>
                </tr>
              </thead>
              <tbody className="text-white/90">
                {cierres.map((c: any) => (
                  <tr key={c.id} className="border-b border-white/5">
                    <td className="py-2 whitespace-nowrap">{fmtMesLabel(c.mes)}</td>
                    <td className="py-2 text-right">{moneyCL(Number(c.ingresos || 0))}</td>
                    <td className="py-2 text-right">{moneyCL(Number(c.egresos || 0))}</td>
                    <td className="py-2 text-right">{moneyCL(Number(c.saldo || 0))}</td>
                    <td className="py-2 whitespace-nowrap">
                      {c.cerrado_at ? new Date(c.cerrado_at).toLocaleString("es-CL") : "—"}
                    </td>
                    <td className="py-2">{c.nota || "—"}</td>
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