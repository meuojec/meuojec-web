export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PrintButton from "@/app/dashboard/_components/PrintButton";

function hhmm(t?: string | null) {
  if (!t) return "—";
  return t.slice(0, 5);
}

export default async function ImprimirAsistenciaSesionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Ajusta: si tu sesión tiene otra tabla/estructura, cambia el query
  const { data: sesion } = await supabase
    .from("eventos_sesiones")
    .select("id, id_evento, nombre, fecha, hora_inicio")
    .eq("id", id)
    .maybeSingle();

  const { data: rows } = await supabase
    .from("asistencias")
    .select("rut,fecha,hora,ded,created_at")
    .eq("evento_sesion_id", id)
    .order("created_at", { ascending: true });

  const total = rows?.length ?? 0;

  return (
    <div className="mx-auto max-w-5xl p-6">
      {/* Estilos de impresión */}
      <style>{`
        @media print {
          body { background: white; }
          .print-card { box-shadow: none !important; border: 1px solid #e5e7eb !important; }
          .print-table th, .print-table td { border: 1px solid #e5e7eb; padding: 6px 8px; font-size: 12px; }
          .print-table th { background: #f3f4f6; }
        }
      `}</style>

      <div className="mb-4 flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-xl font-semibold text-white">Imprimir asistencia</h1>
          <p className="text-sm text-white/60">Vista optimizada para papel</p>
        </div>
        <PrintButton />
      </div>

      <div className="print-card rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="mb-3">
          <div className="text-lg font-semibold text-white">{sesion?.nombre ?? "Sesión"}</div>
          <div className="text-sm text-white/60">
            Evento: {sesion?.id_evento ?? "—"} · Fecha: {sesion?.fecha ?? "—"} · Hora: {sesion?.hora_inicio ?? "—"} · Total: {total}
          </div>
        </div>

        <table className="print-table w-full border-collapse text-left">
          <thead>
            <tr className="text-white/80">
              <th>RUT</th>
              <th>DED</th>
              <th>Fecha</th>
              <th>Hora</th>
            </tr>
          </thead>
          <tbody className="text-white/90">
            {(rows ?? []).map((r, idx) => (
              <tr key={`${r.rut}-${idx}`}>
                <td>{r.rut ?? "—"}</td>
                <td>{r.ded ?? "—"}</td>
                <td>{r.fecha ?? "—"}</td>
                <td>{hhmm(r.hora)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-3 text-xs text-white/50">
          Generado por MEUOJEC APP
        </div>
      </div>
    </div>
  );
}