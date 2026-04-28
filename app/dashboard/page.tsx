// app/dashboard/page.tsx
export const dynamic = "force-dynamic";
export const revalidate = 0;

import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { LucideIcon } from "lucide-react";
import {
  Users,
  Car,
  CalendarDays,
  TrendingUp,
  AlertTriangle,
  UserPlus,
  ClipboardList,
  HandCoins,
  UserCheck,
  Megaphone,
  CalendarRange,
} from "lucide-react";
import DashboardCharts from "./_components/DashboardCharts";

type DedItem = { ded: string; count: number };
type SexoItem = { sexo: string; count: number };
type UltimoMiembro = { rut: string; nombre: string; created_at: string | null };

type CumpleItem = {
  rut: string;
  nombres: string | null;
  apellidos: string | null;
  foto_url: string | null;
  foto_path: string | null;
  fecha_nacimiento: string | null;
  mes: number | null;
  dia: number | null;
};

type EventoEnCurso = {
  id_evento: string | null;
  nombre: string | null;
  activated_at: string | null;
} | null;

type Metrics = {
  total_miembros: number;
  total_autos: number;
  delta_miembros_mes: number;
  asistencia_ultimo_domingo: { fecha: string | null; total: number };
  asistencia_promedio_mes: number;
  nuevos_mes: number;
  ultimos_miembros: UltimoMiembro[];
  miembros_por_ded: DedItem[];
  miembros_por_sexo: SexoItem[];
  alertas: { sin_ded: number; sin_sexo: number; sin_telefono?: number };
};

const CL_TZ = "America/Santiago";

function todayISO() {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: CL_TZ }).format(new Date());
}

function fmtDateCL(dateStr: string) {
  const d = new Date(dateStr);
  return new Intl.DateTimeFormat("es-CL", {
    timeZone: CL_TZ,
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(d);
}

function fmtDateTimeCL(dateStr: string) {
  const d = new Date(dateStr);
  return new Intl.DateTimeFormat("es-CL", {
    timeZone: CL_TZ,
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

const MESES_ES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];

function fmtDayMonthCL(dateStr?: string | null) {
  if (!dateStr) return "—";
  const [yy, mm, dd] = dateStr.split("-").map(Number);
  if (!yy || !mm || !dd) return "—";
  const mes = MESES_ES[mm - 1] ?? "";
  return `${String(dd).padStart(2, "0")} de ${mes}`;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const admin = createAdminClient();

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

  // 2) Cumpleaños (VIEW)
  const { data: cumplesData, error: cumplesErr } = await supabase
    .from("vw_cumples_mes")
    .select("rut,nombres,apellidos,foto_url,foto_path,fecha_nacimiento,mes,dia")
    .order("dia", { ascending: true })
    .limit(60);

  const cumples = (cumplesData ?? []) as CumpleItem[];

  // Cumpleaños de hoy (filtrar por día actual en zona CL)
  const todayDay = parseInt(todayISO().slice(8, 10), 10);
  const cumpleaHoy = cumples.filter((x) => x.dia === todayDay);

  // 3) Evento en curso
  const { data: eventoData, error: eventoErr } = await supabase
    .from("eventos")
    .select("id_evento,nombre,activated_at")
    .eq("activo", true)
    .order("activated_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

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
    supabase.from("agenda").select("id,titulo,fecha,hora_inicio,tipo").eq("activo", true).gte("fecha", hoy).order("fecha").order("hora_inicio").limit(3),
  ]);

  const totalContribMes = (contribData ?? []).reduce((acc: number, r: any) => acc + (Number(r.monto) || 0), 0);
  const nuevosVisitantesMes = (visitantesData ?? []).length;
  const anunciosActivos = (anunciosData ?? []).length;
  const proximasActividades = (agendaData ?? []) as any[];

  // 5) Datos para gráficos de tendencia
  // Últimas 24 sesiones (ordenadas por fecha)
  const { data: sesionesData } = await admin
    .from("eventos_sesiones")
    .select("id,nombre,fecha,hora_inicio")
    .order("fecha", { ascending: false })
    .order("hora_inicio", { ascending: false })
    .limit(24);

  const sesiones = ((sesionesData ?? []) as { id: string; nombre: string | null; fecha: string | null }[]).reverse();

  // Contar asistentes por sesión
  let asistenciaTrend: { label: string; total: number }[] = [];
  if (sesiones.length > 0) {
    const sesionIds = sesiones.map((s) => s.id);
    const { data: countData } = await admin
      .from("asistencias")
      .select("evento_sesion_id")
      .in("evento_sesion_id", sesionIds);

    const countMap = new Map<string, number>();
    for (const r of (countData ?? []) as { evento_sesion_id: string }[]) {
      countMap.set(r.evento_sesion_id, (countMap.get(r.evento_sesion_id) ?? 0) + 1);
    }

    asistenciaTrend = sesiones.map((s) => {
      const fecha = s.fecha ?? "";
      const label = fecha.length >= 10 ? fecha.slice(5) : (s.nombre?.slice(0, 8) ?? "");
      return { label, total: countMap.get(s.id) ?? 0 };
    });
  }

  // Crecimiento mensual de miembros (últimos 12 meses)
  const hace12Meses = (() => {
    const d = new Date(new Date().toLocaleString("en-US", { timeZone: CL_TZ }));
    d.setFullYear(d.getFullYear() - 1);
    d.setDate(1);
    return new Intl.DateTimeFormat("sv-SE", { timeZone: CL_TZ }).format(d).slice(0, 7) + "-01";
  })();

  const { data: miembrosNuevosData } = await admin
    .from("miembros")
    .select("created_at")
    .gte("created_at", hace12Meses)
    .order("created_at");

  const byMonth = new Map<string, number>();
  for (const r of (miembrosNuevosData ?? []) as { created_at: string }[]) {
    const mes = r.created_at?.slice(0, 7);
    if (mes) byMonth.set(mes, (byMonth.get(mes) ?? 0) + 1);
  }

  const mesLabels = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  const miembrosTrend = [...byMonth.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([ym, total]) => {
      const [, mm] = ym.split("-");
      return { label: mesLabels[parseInt(mm, 10) - 1] ?? mm, total };
    });

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="mt-2 text-white/60">
          Resumen rápido: miembros, autos, asistencia y calidad de datos.
        </p>
      </div>

      {/* KPIs — fila 1 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <Kpi title="Total miembros" value={m.total_miembros} icon={Users} subtitle={`+${m.delta_miembros_mes} este mes`} prominent />
        <Kpi title="Total autos" value={m.total_autos} icon={Car} subtitle="Con patente registrada" />
        <Kpi
          title="Asistencia último domingo"
          value={m.asistencia_ultimo_domingo?.total ?? 0}
          icon={ClipboardList}
          subtitle={m.asistencia_ultimo_domingo?.fecha ? fmtDateCL(m.asistencia_ultimo_domingo.fecha) : "Sin registros"}
        />
        <Kpi title="Nuevos miembros (mes)" value={m.nuevos_mes} icon={UserPlus} subtitle="Altas en el mes actual" />
      </div>

      {/* KPIs — fila 2 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <KpiCLP title="Contribuciones (mes)" value={totalContribMes} icon={HandCoins} subtitle="Diezmos + ofrendas del mes" href="/dashboard/contribuciones" />
        <Kpi title="Visitantes nuevos (mes)" value={nuevosVisitantesMes} icon={UserCheck} subtitle="Primera visita este mes" href="/dashboard/visitantes" />
        <Kpi title="Anuncios activos" value={anunciosActivos} icon={Megaphone} subtitle="Publicados y vigentes" href="/dashboard/anuncios" />
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
      <DashboardCharts
        asistenciaTrend={asistenciaTrend}
        miembrosTrend={miembrosTrend}
      />

      {/* Cumpleaños */}
      <BirthdaysGridCard
        title="Cumpleaños del mes"
        icon={CalendarDays}
        todayDay={todayDay}
        errorText={cumplesErr ? `No se pudieron cargar los cumpleaños: ${cumplesErr.message}` : undefined}
        items={cumples.map((x) => {
          const name = [x.nombres, x.apellidos].filter(Boolean).join(" ").trim() || x.rut;
          return { id: x.rut, name, dateLabel: fmtDayMonthCL(x.fecha_nacimiento), photoUrl: x.foto_url || null, dia: x.dia };
        })}
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
            title="Últimos miembros registrados"
            icon={Users}
            items={(m.ultimos_miembros ?? []).map((x) => ({
              id: x.rut,
              primary: x.nombre || "(Sin nombre)",
              secondary: x.created_at ? fmtDateTimeCL(x.created_at) : "",
            }))}
            emptyText="Aún no hay registros recientes."
          />
        </div>

        <SmallInfoCard
          title="Evento en curso"
          icon={CalendarDays}
          lines={
            eventoEnCurso
              ? [
                  { label: eventoEnCurso.nombre ?? "(Sin nombre)", value: "" },
                  { label: "ID", value: eventoEnCurso.id_evento ?? "—" },
                  { label: "Activado", value: eventoEnCurso.activated_at ? fmtDateTimeCL(eventoEnCurso.activated_at) : "—" },
                ]
              : [{ label: "No hay evento activo", value: "" }]
          }
        />

        <SmallInfoCard
          title="Alertas de datos"
          icon={AlertTriangle}
          lines={[
            { label: "Sin DED", value: String(m.alertas?.sin_ded ?? 0) },
            { label: "Sin sexo", value: String(m.alertas?.sin_sexo ?? 0) },
            ...(typeof m.alertas?.sin_telefono === "number"
              ? [{ label: "Sin teléfono", value: String(m.alertas.sin_telefono) }]
              : []),
            { label: "Asistencia promedio (mes)", value: String(m.asistencia_promedio_mes ?? 0) },
          ]}
        />
      </div>
    </div>
  );
}

/* ========= UI Components ========= */

function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
      {children}
    </div>
  );
}

function Kpi({
  title, value, icon: Icon, subtitle, prominent, href,
}: {
  title: string; value: number; icon?: LucideIcon; subtitle?: string; prominent?: boolean; href?: string;
}) {
  const inner = (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="text-sm text-white/70">{title}</div>
        <div className="mt-2 text-4xl font-bold tracking-tight text-white tabular-nums">{value}</div>
        {subtitle ? <div className="mt-2 text-sm text-white/50">{subtitle}</div> : null}
      </div>
      {Icon ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <Icon className="h-5 w-5 text-white/80" />
        </div>
      ) : null}
    </div>
  );

  const cls = [
    "rounded-2xl border p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]",
    prominent ? "border-white/15 bg-white/10" : "border-white/10 bg-black/20",
    href ? "hover:bg-white/5 transition block" : "",
  ].join(" ");

  if (href) return <Link href={href} className={cls}>{inner}</Link>;
  return <div className={cls}>{inner}</div>;
}

function KpiCLP({
  title, value, icon: Icon, subtitle, href,
}: {
  title: string; value: number; icon?: LucideIcon; subtitle?: string; href?: string;
}) {
  const formatted = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(value);
  const inner = (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="text-sm text-white/70">{title}</div>
        <div className="mt-2 text-2xl font-bold tracking-tight text-emerald-300 tabular-nums">{formatted}</div>
        {subtitle ? <div className="mt-2 text-sm text-white/50">{subtitle}</div> : null}
      </div>
      {Icon ? (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3">
          <Icon className="h-5 w-5 text-emerald-400" />
        </div>
      ) : null}
    </div>
  );
  const cls = "rounded-2xl border border-white/10 bg-black/20 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]" + (href ? " hover:bg-white/5 transition block" : "");
  if (href) return <Link href={href} className={cls}>{inner}</Link>;
  return <div className={cls}>{inner}</div>;
}

function ProximasActividadesKpi({
  title, icon: Icon, items, href,
}: {
  title: string; icon?: LucideIcon; items: { id: string; titulo: string; fecha: string; hora_inicio?: string | null; tipo: string }[]; href?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="text-sm text-white/70">{title}</div>
        {Icon ? <div className="rounded-xl border border-white/10 bg-white/5 p-3"><Icon className="h-5 w-5 text-white/80" /></div> : null}
      </div>
      {items.length === 0 ? (
        <div className="text-sm text-white/40">Sin actividades próximas</div>
      ) : (
        <ul className="space-y-2">
          {items.map((ev) => (
            <li key={ev.id}>
              <div className="text-sm text-white truncate">{ev.titulo}</div>
              <div className="text-xs text-white/40">{ev.fecha}{ev.hora_inicio ? ` · ${ev.hora_inicio.slice(0, 5)}` : ""}</div>
            </li>
          ))}
        </ul>
      )}
      {href && <Link href={href} className="mt-3 inline-block text-xs text-white/40 hover:text-white/60 transition">Ver agenda →</Link>}
    </div>
  );
}

function ListCard({ title, icon: Icon, rows, showBars, totalForPercent }: {
  title: string; icon?: LucideIcon; rows: { label: string; value: number }[]; showBars?: boolean; totalForPercent?: number;
}) {
  return (
    <CardShell>
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <div className="text-sm font-semibold text-white">{title}</div>
        {Icon ? <div className="rounded-lg border border-white/10 bg-white/5 p-2"><Icon className="h-4 w-4 text-white/70" /></div> : null}
      </div>
      <div className="px-6 py-2">
        {rows.length === 0 ? (
          <div className="py-6 text-sm text-white/50">Sin datos</div>
        ) : (
          <ul className="divide-y divide-white/10">
            {rows.map((r) => {
              const pct = totalForPercent && totalForPercent > 0 ? Math.round((r.value / totalForPercent) * 100) : null;
              return (
                <li key={r.label} className="py-3 transition hover:bg-white/5 -mx-2 px-2 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/85">{r.label}</span>
                    <span className="text-sm font-semibold tabular-nums text-white">
                      {r.value}{pct !== null ? <span className="text-white/40"> ({pct}%)</span> : null}
                    </span>
                  </div>
                  {showBars && totalForPercent && totalForPercent > 0 ? (
                    <div className="mt-2 h-2 w-full rounded-full bg-white/5">
                      <div className="h-2 rounded-full bg-white/25" style={{ width: `${Math.min(100, (r.value / totalForPercent) * 100)}%` }} />
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </CardShell>
  );
}

function SimpleListCard({ title, icon: Icon, items, emptyText }: {
  title: string; icon?: LucideIcon; items: { id: string; primary: string; secondary?: string }[]; emptyText: string;
}) {
  return (
    <CardShell>
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <div className="text-sm font-semibold text-white">{title}</div>
        {Icon ? <div className="rounded-lg border border-white/10 bg-white/5 p-2"><Icon className="h-4 w-4 text-white/70" /></div> : null}
      </div>
      <div className="px-6 py-3">
        {items.length === 0 ? (
          <div className="py-6 text-sm text-white/50">{emptyText}</div>
        ) : (
          <ul className="divide-y divide-white/10">
            {items.map((it) => (
              <li key={it.id} className="py-3">
                <div className="text-sm text-white/90">{it.primary}</div>
                {it.secondary ? <div className="mt-1 text-xs text-white/50">{it.secondary}</div> : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </CardShell>
  );
}

function SmallInfoCard({ title, icon: Icon, lines }: {
  title: string; icon?: LucideIcon; lines: { label: string; value: string }[];
}) {
  return (
    <CardShell>
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <div className="text-sm font-semibold text-white">{title}</div>
        {Icon ? <div className="rounded-lg border border-white/10 bg-white/5 p-2"><Icon className="h-4 w-4 text-white/70" /></div> : null}
      </div>
      <div className="px-6 py-3">
        <ul className="space-y-3">
          {lines.map((l) => (
            <li key={l.label} className="flex items-start justify-between gap-4">
              <span className="text-sm text-white/80">{l.label}</span>
              <span className="text-sm font-semibold tabular-nums text-white">{l.value}</span>
            </li>
          ))}
        </ul>
      </div>
    </CardShell>
  );
}

function TodayBirthdayBanner({ items }: { items: { id: string; name: string; photoUrl: string | null }[] }) {
  const plural = items.length !== 1;
  return (
    <div className="relative overflow-hidden rounded-2xl border border-yellow-500/30 bg-gradient-to-r from-yellow-500/10 via-amber-500/5 to-transparent p-5">
      {/* Decorativo */}
      <div className="pointer-events-none absolute -right-6 -top-6 text-7xl opacity-10 select-none">🎂</div>

      <div className="flex flex-wrap items-center gap-4">
        {/* Texto */}
        <div className="flex-1 min-w-[160px]">
          <p className="text-xs font-semibold uppercase tracking-widest text-yellow-400/80 mb-1">🎂 Hoy</p>
          <p className="text-base font-bold text-white">
            {plural
              ? `${items.length} personas cumplen años hoy`
              : `${items[0].name} cumple años hoy`}
          </p>
          {plural && (
            <p className="mt-0.5 text-sm text-white/50">{items.map((i) => i.name).join(", ")}</p>
          )}
        </div>

        {/* Avatares */}
        <div className="flex -space-x-3">
          {items.slice(0, 6).map((it) => (
            <Link
              key={it.id}
              href={`/dashboard/miembros/${encodeURIComponent(it.id)}`}
              title={it.name}
              className="relative h-11 w-11 overflow-hidden rounded-full border-2 border-yellow-500/50 bg-white/10 hover:z-10 hover:scale-110 transition-transform"
            >
              {it.photoUrl ? (
                <Image src={it.photoUrl} alt={it.name} fill sizes="44px" className="object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-yellow-300">
                  {it.name.charAt(0).toUpperCase()}
                </div>
              )}
            </Link>
          ))}
          {items.length > 6 && (
            <div className="relative h-11 w-11 overflow-hidden rounded-full border-2 border-yellow-500/30 bg-white/10 flex items-center justify-center text-xs font-semibold text-white/60">
              +{items.length - 6}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BirthdaysGridCard({ title, icon: Icon, items, errorText, todayDay }: {
  title: string; icon?: LucideIcon; items: { id: string; name: string; dateLabel: string; photoUrl?: string | null; dia?: number | null }[]; errorText?: string; todayDay?: number;
}) {
  return (
    <CardShell>
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <div className="text-sm font-semibold text-white tracking-wide">{title}</div>
        {Icon ? <div className="rounded-lg border border-white/10 bg-white/5 p-2"><Icon className="h-4 w-4 text-white/70" /></div> : null}
      </div>
      <div className="px-6 py-5">
        {errorText ? (
          <div className="text-sm text-red-400">{errorText}</div>
        ) : items.length === 0 ? (
          <div className="text-sm text-white/50">No hay cumpleaños este mes.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
            {items.map((it) => {
              const isToday = todayDay !== undefined && it.dia === todayDay;
              return (
                <Link
                  key={it.id}
                  href={`/dashboard/miembros/${encodeURIComponent(it.id)}`}
                  className={`group rounded-xl border p-4 transition hover:bg-white/[0.06] ${isToday ? "border-yellow-500/50 bg-yellow-500/10" : "border-white/10 bg-white/[0.04]"}`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`relative h-12 w-12 shrink-0 overflow-hidden rounded-full border bg-white/5 ${isToday ? "border-yellow-500/50" : "border-white/20"}`}>
                      {it.photoUrl ? (
                        <Image src={it.photoUrl} alt={it.name} fill sizes="48px" className="object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white/50">
                          {it.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-white truncate leading-tight">{it.name}</div>
                      <div className={`text-xs mt-0.5 ${isToday ? "text-yellow-400 font-medium" : "text-white/50"}`}>
                        {isToday ? "🎂 Hoy" : it.dateLabel}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </CardShell>
  );
}
