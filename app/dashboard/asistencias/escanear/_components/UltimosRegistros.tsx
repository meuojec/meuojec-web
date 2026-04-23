export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createClient } from "@/lib/supabase/server";

function toHHMM(h?: string | null) {
  if (!h) return "—";
  return h.length >= 5 ? h.slice(0, 5) : h;
}

type Row = {
  rut: string;
  hora: string | null;
  ded: string | null;
  id_evento: string | null;
  created_at: string;
  miembros: { nombres: string | null; apellidos: string | null } | null;
};

export default async function UltimosRegistros() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("asistencias")
    .select(
      `
      rut,
      hora,
      ded,
      id_evento,
      created_at,
      miembros (
        nombres,
        apellidos
      )
    `
    )
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-white">
        <div className="font-semibold">Error cargando últimos registros</div>
        <div className="text-sm text-white/70 mt-1">{error.message}</div>
      </div>
    );
  }

  const rows = (data ?? []) as any as Row[];

  // 🔥 Traer nombres de eventos para esos 10 registros
  const ids = Array.from(new Set(rows.map((r) => r.id_evento).filter(Boolean))) as string[];

  const eventosMap = new Map<string, string>();
  if (ids.length > 0) {
    const { data: evs } = await supabase
      .from("eventos")
      .select("id_evento,nombre")
      .in("id_evento", ids);

    (evs ?? []).forEach((e: any) => {
      if (e?.id_evento) eventosMap.set(String(e.id_evento), e?.nombre ?? "");
    });
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="text-base font-semibold text-white">Últimos registros</div>
        <div className="text-xs text-white/60">Últimos 10</div>
      </div>

      <div className="border-t border-white/10" />

      <div className="overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="text-xs text-white/60">
              <th className="px-4 py-2">Hora</th>
              <th className="px-4 py-2">RUT</th>
              <th className="px-4 py-2">Nombre</th>
              <th className="px-4 py-2">DED</th>
              <th className="px-4 py-2">Evento</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((r) => {
              const m = r.miembros;
              const nombre =
                (m ? `${m.nombres ?? ""} ${m.apellidos ?? ""}`.trim() : "") || "—";

              const eventoNombre =
                (r.id_evento ? eventosMap.get(r.id_evento) : null)?.trim() || "—";

              return (
                <tr key={`${r.rut}-${r.created_at}`} className="border-t border-white/5">
                  <td className="px-4 py-2 text-sm text-white/85">{toHHMM(r.hora)}</td>
                  <td className="px-4 py-2 text-sm text-white/85">{r.rut}</td>
                  <td className="px-4 py-2 text-sm text-white">{nombre}</td>
                  <td className="px-4 py-2 text-sm text-white/85">{r.ded ?? "—"}</td>
                  <td className="px-4 py-2 text-sm text-white/85">{eventoNombre}</td>
                </tr>
              );
            })}

            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-sm text-white/60">
                  Sin registros
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}