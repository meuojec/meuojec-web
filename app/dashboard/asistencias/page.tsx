// app/dashboard/asistencias/page.tsx
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

type EventoActivo = {
  nombre: string | null;
};

type AsistenciaRow = {
  rut: string | null;
  fecha: string | null; // YYYY-MM-DD
  hora: string | null; // HH:mm:ss(.ms)
  ded: string | null;
  id_evento: string | null; // ✅ clave
  created_at: string | null;
};

type MiembroMini = {
  rut: string;
  nombres: string | null;
  apellidos: string | null;
  ded: string | null;
};

function hhmmFromTime(t?: string | null) {
  if (!t) return "—";
  return t.slice(0, 5);
}

function hhmmFromISO(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
}

function formatNombre(n?: string | null, a?: string | null) {
  const nn = (n ?? "").trim();
  const aa = (a ?? "").trim();
  const full = `${nn} ${aa}`.trim();
  return full || "—";
}

function todayISO_CL() {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Santiago" }).format(new Date());
}

export default async function AsistenciasHomePage() {
  const supabase = await createClient();

  // 1) Evento activo (si existe)
  const { data: evData } = await supabase
    .from("eventos")
    .select("nombre")
    .eq("activo", true)
    .order("activated_at", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  const eventoActivo = (evData ?? null) as EventoActivo | null;

  // 2) KPIs del día (Chile)
  const todayISO = todayISO_CL();

  const { count: countHoy } = await supabase
    .from("asistencias")
    .select("rut", { count: "exact", head: true })
    .eq("fecha", todayISO);

  // 3) Último registro + últimos 10
  const { data: lastData } = await supabase
    .from("asistencias")
    .select("rut,fecha,hora,ded,id_evento,created_at")
    .order("created_at", { ascending: false })
    .limit(1);

  const last = (lastData?.[0] ?? null) as AsistenciaRow | null;

  // ✅ OJO: aquí traemos id_evento (y NO intentamos join automático)
  const { data: recentData, error: recErr } = await supabase
    .from("asistencias")
    .select("rut,fecha,hora,ded,id_evento,created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  if (recErr) {
    return (
      <div className="space-y-3">
        <h1 className="text-3xl font-bold">Módulo de Asistencia</h1>
        <p className="text-red-400">Error: {recErr.message}</p>
      </div>
    );
  }

  const recent = (recentData ?? []) as AsistenciaRow[];

  // 4) Buscar nombre del último miembro (lookup simple por rut)
  let lastMiembro: MiembroMini | null = null;
  if (last?.rut) {
    const { data: m } = await supabase
      .from("miembros")
      .select("rut,nombres,apellidos,ded")
      .eq("rut", last.rut)
      .maybeSingle();
    lastMiembro = (m ?? null) as MiembroMini | null;
  }

  // 5) Armar mapa rut -> nombre para la tablita
  const ruts = Array.from(new Set(recent.map((r) => r.rut).filter(Boolean))) as string[];
  const miembrosMap = new Map<string, MiembroMini>();

  if (ruts.length > 0) {
    const { data: ms } = await supabase
      .from("miembros")
      .select("rut,nombres,apellidos,ded")
      .in("rut", ruts);

    (ms ?? []).forEach((x: any) => {
      if (x?.rut) miembrosMap.set(String(x.rut), x as MiembroMini);
    });
  }

  // ✅ 6) Armar mapa id_evento -> nombre_evento
  const idsEvento = Array.from(new Set(recent.map((r) => r.id_evento).filter(Boolean))) as string[];

  const eventosMap = new Map<string, string>();

  if (idsEvento.length > 0) {
    const { data: evs } = await supabase
      .from("eventos")
      .select("id_evento,nombre")
      .in("id_evento", idsEvento);

    (evs ?? []).forEach((e: any) => {
      const id = e?.id_evento ? String(e.id_evento) : null;
      if (!id) return;
      eventosMap.set(id, String(e?.nombre ?? "").trim());
    });
  }

  const hoy = countHoy ?? 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Módulo de Asistencia</h1>
          <p className="mt-2 text-white/70">
            Registro rápido + reporte con filtros por fecha / evento / DED / sexo.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/asistencias/escanear"
            className="rounded-lg border border-white/10 bg-white/10 px-4 py-2 text-sm hover:bg-white/15"
          >
            Escanear Asistencia
          </Link>

          <Link
            href="/dashboard/asistencias/reporte"
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
          >
            Ver reportes →
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <KpiCard title="Asistencias hoy" value={String(hoy)} sub={`Fecha: ${todayISO}`} />

        <KpiCard
          title="Evento activo"
          value={eventoActivo?.nombre ? eventoActivo.nombre : "Ninguno"}
          sub={eventoActivo?.nombre ? "Se usará por defecto" : "Activa uno en Eventos"}
        />

        <KpiCard
          title="Último registro"
          value={
            last
              ? `${hhmmFromISO(last.created_at)} — ${formatNombre(
                  lastMiembro?.nombres ?? null,
                  lastMiembro?.apellidos ?? null
                )}`
              : "—"
          }
          sub={
            last
              ? `RUT: ${last.rut ?? "—"} • DED: ${last.ded ?? lastMiembro?.ded ?? "—"}`
              : "Aún no hay registros"
          }
        />
      </div>

      {/* Acciones principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-[860px]">
        <ActionCard
          title="Escanear Asistencia"
          desc="Registrar asistencia al instante (QR / búsqueda)."
          href="/dashboard/asistencias/escanear"
          primary
        />
        <ActionCard
          title="Reportes y filtros"
          desc="Filtra por fecha, evento, DED y sexo."
          href="/dashboard/asistencias/reporte"
        />
      </div>

      {/* Últimos registros */}
      <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="font-semibold">Últimos registros</div>
          <div className="text-sm text-white/60">Últimos 10</div>
        </div>

        <div className="overflow-auto">
          <table className="min-w-[900px] w-full text-sm">
            <thead className="bg-black/30 text-white/70">
              <tr className="border-b border-white/10">
                <th className="text-left font-medium px-4 py-3">Hora</th>
                <th className="text-left font-medium px-4 py-3">RUT</th>
                <th className="text-left font-medium px-4 py-3">Nombre</th>
                <th className="text-left font-medium px-4 py-3">DED</th>
                <th className="text-left font-medium px-4 py-3">Evento</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((r, i) => {
                const m = r.rut ? miembrosMap.get(r.rut) : null;

                // ✅ SOLO nombre del evento
                const eventoNombre =
                  (r.id_evento ? eventosMap.get(String(r.id_evento)) : null) || "—";

                return (
                  <tr key={i} className="border-t border-white/10 hover:bg-white/5 transition">
                    <td className="px-4 py-3">
                      {r.hora ? hhmmFromTime(r.hora) : hhmmFromISO(r.created_at)}
                    </td>
                    <td className="px-4 py-3 tabular-nums">{r.rut ?? "—"}</td>
                    <td className="px-4 py-3">
                      {formatNombre(m?.nombres ?? null, m?.apellidos ?? null)}
                    </td>
                    <td className="px-4 py-3 text-white/80">{r.ded ?? m?.ded ?? "—"}</td>
                    <td className="px-4 py-3 text-white/80">{eventoNombre}</td>
                  </tr>
                );
              })}

              {recent.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-white/60">
                    Aún no hay asistencias registradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-4 border-t border-white/10 flex items-center justify-end">
          <Link
            href="/dashboard/asistencias/reporte"
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
          >
            Ir a reportes →
          </Link>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ title, value, sub }: { title: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5">
      <div className="text-sm text-white/70">{title}</div>
      <div className="mt-2 text-3xl font-semibold text-white">{value}</div>
      <div className="mt-2 text-sm text-white/60">{sub}</div>
    </div>
  );
}

function ActionCard({
  title,
  desc,
  href,
  primary,
}: {
  title: string;
  desc: string;
  href: string;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={[
        "rounded-xl border border-white/10 p-5 transition block",
        primary ? "bg-blue-600/20 hover:bg-blue-600/25" : "bg-white/5 hover:bg-white/10",
      ].join(" ")}
    >
      <div className="text-lg font-semibold">{title}</div>
      <div className="mt-1 text-sm text-white/70">{desc}</div>
      <div className="mt-4 text-sm text-white/80">
        {primary ? "Abrir scanner →" : "Abrir reportes →"}
      </div>
    </Link>
  );
}