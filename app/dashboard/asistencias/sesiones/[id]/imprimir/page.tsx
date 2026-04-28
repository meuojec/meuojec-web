export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PrintButton from "@/app/dashboard/_components/PrintButton";

function hhmm(t?: string | null) {
  if (!t) return "—";
  return t.slice(0, 5);
}

export default async function ImprimirAsistenciaSesionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

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

  const ruts = Array.from(new Set((rows ?? []).map((r) => r.rut).filter(Boolean))) as string[];
  const miembrosMap = new Map<string, { nombres: string | null; apellidos: string | null }>();
  if (ruts.length > 0) {
    const { data: ms } = await supabase.from("miembros").select("rut,nombres,apellidos").in("rut", ruts);
    (ms ?? []).forEach((m: any) => { if (m?.rut) miembrosMap.set(m.rut, m); });
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <style>{`
        @media print {
          body { background: white; color: black; }
          .print-card { box-shadow: none !important; border: 1px solid #e5e7eb !important; background: white !important; }
          .print-table th, .print-table td { border: 1px solid #e5e7eb; padding: 6px 8px; font-size: 12px; color: black; }
          .print-table th { background: #f3f4f6; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="no-print mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Imprimir asistencia</h1>
          <p className="text-sm text-white/60">Vista optimizada para papel</p>
        </div>
        <PrintButton />
      </div>

      <div className="print-card rounded-2xl border border-white/10 bg-black/20 p-6">
        <div className="mb-4">
          <div className="text-lg font-bold text-white">{sesion?.nombre ?? "Sesión"}</div>
          <div className="text-sm text-white/60 mt-1">
            Fecha: {sesion?.fecha ?? "—"} · Hora: {hhmm(sesion?.hora_inicio)} · Total asistentes: {total}
          </div>
        </div>

        <table className="print-table w-full border-collapse text-left">
          <thead>
            <tr className="text-white/80">
              <th className="border border-white/10 px-3 py-2">#</th>
              <th className="border border-white/10 px-3 py-2">RUT</th>
              <th className="border border-white/10 px-3 py-2">Nombre</th>
              <th className="border border-white/10 px-3 py-2">DED</th>
              <th className="border border-white/10 px-3 py-2">Hora</th>
            </tr>
          </thead>
          <tbody className="text-white/90">
            {(rows ?? []).map((r, idx) => {
              const m = r.rut ? miembrosMap.get(r.rut) : null;
              const nombre = m ? `${(m.nombres ?? "").trim()} ${(m.apellidos ?? "").trim()}`.trim() : "—";
              return (
                <tr key={`${r.rut}-${idx}`}>
                  <td className="border border-white/5 px-3 py-2 text-white/40">{idx + 1}</td>
                  <td className="border border-white/5 px-3 py-2">{r.rut ?? "—"}</td>
                  <td className="border border-white/5 px-3 py-2">{nombre}</td>
                  <td className="border border-white/5 px-3 py-2">{r.ded ?? "—"}</td>
                  <td className="border border-white/5 px-3 py-2">{hhmm(r.hora)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="mt-4 text-xs text-white/40">
          Generado por MEUOJEC APP · {new Date().toLocaleDateString("es-CL")}
        </div>
      </div>
    </div>
  );
}
