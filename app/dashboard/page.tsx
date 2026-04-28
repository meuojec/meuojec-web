// app/dashboard/page.tsx
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  Users, Car, CalendarDays, TrendingUp, AlertTriangle,
  UserPlus, ClipboardList, HandCoins, UserCheck, Megaphone, CalendarRange,
} from "lucide-react";

import DashboardCharts      from "./_components/DashboardCharts";
import CardShell            from "./_components/CardShell";
import { Kpi, KpiCLP, ProximasActividadesKpi } from "./_components/KpiCards";
import { ListCard, SimpleListCard, SmallInfoCard } from "./_components/DashboardCards";
import TodayBirthdayBanner  from "./_components/TodayBirthdayBanner";
import BirthdaysGridCard    from "./_components/BirthdaysGridCard";
import { todayISO, fmtDateCL, fmtDateTimeCL, fmtDayMonthCL } from "./_components/dashboardUtils";

/* ── Types ──────────────────────────────────────────────────── */
type DedItem      = { ded: string; count: number };
type SexoItem     = { sexo: string; count: number };
type UltimoMiembro = { rut: string; nombre: string; created_at: string | null };
type CumpleItem   = {
  rut: string; nombres: string | null; apellidos: string | null;
  foto_url: string | null; foto_path: string | null;
  fecha_nacimiento: string | null; mes: number | null; dia: number | null;
};
type EventoEnCurso = { id_evento: string | null; nombre: string | null; activated_at: string | null } | null;
type Metrics = {
  total_miembros: number; total_autos: number; delta_miembros_mes: number;
  asistencia_ultimo_domingo: { fecha: string | null; total: number };
  asistencia_promedio_mes: number; nuevos_mes: number;
  ultimos_miembros: UltimoMiembro[];
  miembros_por_ded: DedItem[]; miembros_por_sexo: SexoItem[];
  alertas: { sin_ded: number; sin_sexo: number; sin_telefono?: number };
};

/* ── Page ───────────────────────────────────────────────────── */
export default async function DashboardPage() {
  const supabase = await createClient();
  const admin    = createAdminClient();

  // 1) Métricas principales
  const { data, error } = await supabase.rpc("get_full_dashboard_metrics");
  if (error) {
    return (
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-red-400">Error: {error.message}</p>
      </div>
    );
  }
  const m = data as Metrics;

  // 2) Cumpleaños del mes
  const { data: cumplesData, error: cumplesErr } = await supabase
    .from("vw_cumples_mes")
    .select("rut,nombres,apellidos,foto_url,foto_path,fecha_nacimiento,mes,dia")
    .order("dia", { ascending: true })
    .limit(60);
  const cumples   = (cumplesData ?? []) as CumpleItem[];
  const todayDay  = parseInt(todayISO().slice(8, 10), 10);
  const cumpleaHoy = cumples.filter((x) => x.dia === todayDay);

  // 3) Evento en curso
  const { data: eventoData, error: eventoErr } = await supabase
    .from("eventos")
    .select("id_evento,nombre,activated_at")
    .eq("activo", true)
    .order("activated_at", { ascending: false, nullsFirst: false })
    .order("created_at",   { ascending: false, nullsFirst: false })
    .limit(1).maybeSingle();
  const eventoEnCurso: EventoEnCurso = eventoErr ? null : (eventoData ?? null);

  // 4) KPIs nuevos módulos
  const hoy = todayISO();
  const inicioMes = hoy.slice(0, 7) + "-01";
  const [
    { data: contribData },
    { data: visitantesData },
    { data: anunciosData },
    { data: agendaData },
  ] = await Promise.all([
    supabase.from("contribuciones").select("monto").gte("fecha", inicioMes).lte("fecha", hoy),
    supabase.from("visitantes").select("id").gte("fecha_primera_visita", inicioMes),
    supabase.from("anuncios").select("id").eq("activo", true),
    supabase.from("agenda").select("id,titulo,fecha,hora_inicio,tipo")
      .eq("activo", true).gte("fecha", hoy).order("fecha").order("hora_inicio").limit(3),
  ]);
  const totalContribMes    = (contribData ?? []).reduce((acc: number, r: { monto: string | number }) => acc + (Number(r.monto) || 0), 0);
  const nuevosVisitantesMes = (visitantesData ?? []).length;
  const anunciosActivos     = (anunciosData ?? []).length;
  const proximasActividades = (agendaData ?? []) as { id: string; titulo: string; fecha: string; hora_inicio: string | null; tipo: string }[];

  // 5) Gráficos de tendencia
  const { data: sesionesData } = await admin
    .from("eventos_sesiones").select("id,nombre,fecha,hora_inicio")
    .order("fecha", { ascending: false }).order("hora_inicio", { ascending: false }).limit(24);
  const sesiones = ((sesionesData ?? []) as { id: string; nombre: string | null; fecha: string | null }[]).reverse();

  let asistenciaTrend: { label: string; total: number }[] = [];
  if (sesiones.length > 0) {
    const sesionIds = sesiones.map((s) => s.id);
    const { data: countData } = await admin.from("asistencias").select("evento_sesion_id").in("evento_sesion_id", sesionIds);
    const countMap = new Map<string, number>();
    for (const r of (countData ?? []) as { evento_sesion_id: string }[])
      countMap.set(r.evento_sesion_id, (countMap.get(r.evento_sesion_id) ?? 0) + 1);
    asistenciaTrend = sesiones.map((s) => {
      const fecha = s.fecha ?? "";
      return { label: fecha.length >= 10 ? fecha.slice(5) : (s.nombre?.slice(0, 8) ?? ""), total: countMap.get(s.id) ?? 0 };
    });
  }

  const CL_TZ = "America/Santiago";
  const hace12Meses = (() => {
    const d = new Date(new Date().toLocaleString("en-US", { timeZone: CL_TZ }));
    d.setFullYear(d.getFullYear() - 1); d.setDate(1);
    return new Intl.DateTimeFormat("sv-SE", { timeZone: CL_TZ }).format(d).slice(0, 7) + "-01";
  })();
  const { data: miembrosNuevosData } = await admin.from("miembros").select("created_at").gte("created_at", hace12Meses).order("created_at");
  const byMonth = new Map<string, number>();
  for (const r of (miembrosNuevosData ?? []) as { created_at: string }[]) {
    const mes = r.created_at?.slice(0, 7);
    if (mes) byMonth.set(mes, (byMonth.get(mes) ?? 0) + 1);
  }
  const mesLabels = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
  const miembrosTrend = [...byMonth.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([ym, total]) => ({ label: mesLabels[parseInt(ym.split("-")[1], 10) - 1] ?? ym.split("-")[1], total }));

  /* ── JSX ─────────────────────────────────────────────────── */
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="mt-2 text-white/60">Resumen rápido: miembros, autos, asistencia y calidad de datos.</p>
      </div>

      {/* KPIs fila 1 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <Kpi title="Total miembros"             value={m.total_miembros}                        icon={Users}       subtitle={`+${m.delta_miembros_mes} este mes`} prominent />
        <Kpi title="Total autos"                value={m.total_autos}                           icon={Car}         subtitle="Con patente registrada" />
        <Kpi title="Asistencia último domingo"  value={m.asistencia_ultimo_domingo?.total ?? 0} icon={ClipboardList}
             subtitle={m.asistencia_ultimo_domingo?.fecha ? fmtDateCL(m.asistencia_ultimo_domingo.fecha) : "Sin registros"} />
        <Kpi title="Nuevos miembros (mes)"      value={m.nuevos_mes}                            icon={UserPlus}    subtitle="Altas en el mes actual" />
      </div>

      {/* KPIs fila 2 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <KpiCLP title="Contribuciones (mes)" value={totalContribMes} icon={HandCoins} subtitle="Diezmos + ofrendas del mes" href="/dashboard/contribuciones" />
        <Kpi    title="Visitantes nuevos (mes)" value={nuevosVisitantesMes} icon={UserCheck} subtitle="Primera visita este mes" href="/dashboard/visitantes" />
        <Kpi    title="Anuncios activos" value={anunciosActivos} icon={Megaphone} subtitle="Publicados y vigentes" href="/dashboard/anuncios" />
        <ProximasActividadesKpi title="Próximas actividades" icon={CalendarRange} items={proximasActividades} href="/dashboard/agenda" />
      </div>

      {/* Banner cumpleaños de hoy */}
      {cumpleaHoy.length > 0 && (
        <TodayBirthdayBanner
          items={cumpleaHoy.map((x) => ({
            id: x.rut,
            name: [x.nombres, x.apellidos].filter(Boolean).join(" ").trim() || x.rut,
            photoUrl: x.foto_url || null,
          }))}
        />
      )}

      {/* Gráficos de tendencia */}
      <DashboardCharts asistenciaTrend={asistenciaTrend} miembrosTrend={miembrosTrend} />

      {/* Cumpleaños del mes */}
      <BirthdaysGridCard
        title="Cumpleaños del mes" icon={CalendarDays} todayDay={todayDay}
        errorText={cumplesErr ? `No se pudieron cargar los cumpleaños: ${cumplesErr.message}` : undefined}
        items={cumples.map((x) => ({
          id: x.rut,
          name: [x.nombres, x.apellidos].filter(Boolean).join(" ").trim() || x.rut,
          dateLabel: fmtDayMonthCL(x.fecha_nacimiento),
          photoUrl: x.foto_url || null,
          dia: x.dia,
        }))}
      />

      {/* DED + Sexo */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ListCard title="Miembros por DED" icon={TrendingUp} rows={m.miembros_por_ded.map((x) => ({ label: x.ded, value: x.count }))} showBars totalForPercent={m.total_miembros} />
        </div>
        <ListCard title="Miembros por sexo" icon={Users} rows={m.miembros_por_sexo.map((x) => ({ label: x.sexo, value: x.count }))} showBars totalForPercent={m.total_miembros} />
      </div>

      {/* Últimos miembros + Evento + Alertas */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <SimpleListCard
            title="Últimos miembros registrados" icon={Users}
            items={(m.ultimos_miembros ?? []).map((x) => ({
              id: x.rut,
              primary: x.nombre || "(Sin nombre)",
              secondary: x.created_at ? fmtDateTimeCL(x.created_at) : "",
            }))}
            emptyText="Aún no hay registros recientes."
          />
        </div>
        <SmallInfoCard
          title="Evento en curso" icon={CalendarDays}
          lines={
            eventoEnCurso
              ? [
                  { label: eventoEnCurso.nombre ?? "(Sin nombre)", value: "" },
                  { label: "ID",        value: eventoEnCurso.id_evento ?? "—" },
                  { label: "Activado",  value: eventoEnCurso.activated_at ? fmtDateTimeCL(eventoEnCurso.activated_at) : "—" },
                ]
              : [{ label: "No hay evento activo", value: "" }]
          }
        />
        <SmallInfoCard
          title="Alertas de datos" icon={AlertTriangle}
          lines={[
            { label: "Sin DED",    value: String(m.alertas?.sin_ded ?? 0) },
            { label: "Sin sexo",   value: String(m.alertas?.sin_sexo ?? 0) },
            ...(typeof m.alertas?.sin_telefono === "number"
              ? [{ label: "Sin teléfono", value: String(m.alertas.sin_telefono) }] : []),
            { label: "Asist. promedio (mes)", value: String(m.asistencia_promedio_mes ?? 0) },
          ]}
        />
      </div>
    </div>
  );
}
