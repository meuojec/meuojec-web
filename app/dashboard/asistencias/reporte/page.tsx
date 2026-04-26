export const dynamic = "force-dynamic";
export const revalidate = 0;

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DeleteClientWrapper from "./_components/DeleteClientWrapper";
import BackButton from "@/app/components/BackButton";

function toHHMM(h?: string | null) {
  if (!h) return null;
  return h.length >= 5 ? h.slice(0, 5) : h;
}

function fmtFecha(f?: string | null) {
  if (!f) return "—";
  // si viene como "2026-02-19T..." corta
  return f.length >= 10 ? f.slice(0, 10) : f;
}

export type RegistroRow = {
  id: string; // usamos created_at como id (mientras no tengas uuid)
  rut: string;
  nombre: string;
  ded: string | null;
  sexo: string | null;
  hora: string | null;
  fecha: string | null;
  id_evento: string | null;
  evento_nombre: string | null;
};

export default async function ReporteAsistenciasPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase
    .from("asistencias")
    .select(
      `
      rut,
      fecha,
      hora,
      ded,
      id_evento,
      created_at,
      miembros (
        nombres,
        apellidos,
        sexo,
        ded
      )
    `
    )
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    return (
      <div className="p-6 text-white">
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
          <div className="font-semibold">Error cargando asistencias</div>
          <div className="text-sm text-white/70 mt-1">{error.message}</div>
        </div>
      </div>
    );
  }

  // Traemos nombres de eventos en 1 query (opcional)
  const eventosIds = Array.from(
    new Set((data ?? []).map((r: any) => r.id_evento).filter(Boolean))
  ) as string[];

  const eventosMap = new Map<string, string>();
  if (eventosIds.length > 0) {
    const { data: evs } = await supabase
      .from("eventos")
      .select("id_evento,nombre")
      .in("id_evento", eventosIds);

    (evs ?? []).forEach((e: any) => {
      if (e?.id_evento) eventosMap.set(String(e.id_evento), e?.nombre ?? "");
    });
  }

  const rows: RegistroRow[] = (data ?? []).map((r: any) => {
    const m = r.miembros;
    const nombre = m
      ? `${m.nombres ?? ""} ${m.apellidos ?? ""}`.trim() || "—"
      : "—";

    const idEvento = r.id_evento ? String(r.id_evento) : null;

    return {
      id: String(r.created_at), // id UI = created_at
      rut: String(r.rut ?? ""),
      nombre,
      ded: (r.ded ?? m?.ded ?? null) as string | null,
      sexo: (m?.sexo ?? null) as string | null,
      hora: toHHMM(r.hora),
      fecha: r.fecha ? String(r.fecha) : null,
      id_evento: idEvento,
      evento_nombre: idEvento ? eventosMap.get(idEvento) ?? null : null,
    };
  });

  return (
    <div className="p-6">
      <div className="flex min-h-[calc(100vh-140px)] flex-col gap-6">
        <div className="min-h-0 flex-1">
          <DeleteClientWrapper rows={rows} />
        </div>
      </div>
    </div>
  );
}