export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const DEPARTAMENTOS = [
  "Administracion", "Aseo y Decoracion", "Coro de Adoracion",
  "Comunicaciones", "Damas", "Diaconos", "Escuela Dominical",
  "Evangelistas", "Juventud", "Musicos", "Ninez",
  "Recepcion / Acogida", "Soldados", "Theillah", "Varones", "Vigilantes",
] as const;

const DED_OPTIONS = ["Varones", "Damas", "Jovenes", "Creyentes", "Aspirantes"] as const;

const COLORS_DEPTO = [
  "#6366f1","#0ea5e9","#10b981","#f59e0b","#ef4444",
  "#8b5cf6","#ec4899","#14b8a6","#f97316","#84cc16",
  "#06b6d4","#a855f7","#f43f5e","#22c55e","#eab308","#64748b",
];
const COLORS_DED = ["#0ea5e9","#ec4899","#8b5cf6","#10b981","#f59e0b"];

function normalize(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export default async function MinisteriosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Contar miembros por departamento (campo departamento, separado por coma)
  const { data: deptoRows } = await supabase
    .from("miembros")
    .select("departamento")
    .not("departamento", "is", null)
    .neq("departamento", "");

  const conteoPorDepto: Record<string, number> = {};
  for (const row of deptoRows ?? []) {
    const parts = (row.departamento as string).split(",").map((s: string) => s.trim()).filter(Boolean);
    for (const p of parts) {
      conteoPorDepto[normalize(p)] = (conteoPorDepto[normalize(p)] ?? 0) + 1;
    }
  }

  // Contar miembros por DED
  const { data: dedRows } = await supabase
    .from("miembros")
    .select("ded")
    .not("ded", "is", null)
    .neq("ded", "");

  const conteoPorDed: Record<string, number> = {};
  for (const row of dedRows ?? []) {
    const d = (row.ded as string).trim();
    if (d) conteoPorDed[normalize(d)] = (conteoPorDed[normalize(d)] ?? 0) + 1;
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold">Departamentos / Ministerios</h1>
        <p className="mt-2 text-white/60">Vista de departamentos, ministerios y grupos DED de la iglesia.</p>
      </div>

      {/* ── DEPARTAMENTOS / MINISTERIOS ── */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-1">Departamentos / Ministerios</h2>
        <p className="text-sm text-white/40 mb-4">
          Extraidos de la planilla de miembros. Haz clic para ver sus integrantes.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {DEPARTAMENTOS.map((nombre, i) => {
            const count = conteoPorDepto[normalize(nombre)] ?? 0;
            return (
              <Link
                key={nombre}
                href={`/dashboard/ministerios/depto/${encodeURIComponent(nombre)}`}
                className="rounded-2xl border border-white/10 bg-black/20 p-5 flex flex-col gap-3 hover:bg-white/5 transition group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS_DEPTO[i % COLORS_DEPTO.length] }} />
                    <span className="font-semibold text-white group-hover:text-emerald-300 transition text-sm">{nombre}</span>
                  </div>
                  <span className="text-xs text-white/40 tabular-nums shrink-0">{count} miembros</span>
                </div>
                <div className="text-xs text-white/30 mt-auto">Ver integrantes →</div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── DEPARTAMENTO DED ── */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-1">Departamento DED</h2>
        <p className="text-sm text-white/40 mb-4">
          Agrupacion por Division / Extension / Departamento. Haz clic para ver sus integrantes.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {DED_OPTIONS.map((ded, i) => {
            const count = conteoPorDed[normalize(ded)] ?? 0;
            return (
              <Link
                key={ded}
                href={`/dashboard/ministerios/ded/${encodeURIComponent(ded)}`}
                className="rounded-2xl border border-white/10 bg-black/20 p-5 flex flex-col gap-3 hover:bg-white/5 transition group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS_DED[i % COLORS_DED.length] }} />
                    <span className="font-semibold text-white group-hover:text-emerald-300 transition text-sm">{ded}</span>
                  </div>
                  <span className="text-xs text-white/40 tabular-nums shrink-0">{count} miembros</span>
                </div>
                <div className="text-xs text-white/30 mt-auto">Ver integrantes →</div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
