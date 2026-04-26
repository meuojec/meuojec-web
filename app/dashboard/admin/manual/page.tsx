// app/dashboard/admin/manual/page.tsx
export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  CalendarDays,
  UserCheck,
  Heart,
  Church,
  CalendarRange,
  Megaphone,
  BarChart3,
  Package,
  BookOpen,
  Settings,
  Wallet,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";
import BackButton from "@/app/components/BackButton";

type SectionItem = {
  label: string;
  icon: React.ElementType;
  color: string;
  desc: string;
  modules: { name: string; desc: string }[];
};

type RoleRow = {
  key: string;
  name: string;
  seccion: string;
  desc: string;
};

const SECTIONS: SectionItem[] = [
  {
    label: "Gestion",
    icon: LayoutDashboard,
    color: "text-sky-300",
    desc: "Nucleo operativo de la iglesia. Administra el dia a dia: quienes somos, quien asiste y que eventos organizamos.",
    modules: [
      {
        name: "Dashboard",
        desc: "Resumen general con indicadores clave: total de miembros activos, asistencia reciente, proximos eventos y actividad del sistema.",
      },
      {
        name: "Miembros",
        desc: "Registro completo de los miembros de la iglesia. Permite agregar nuevos miembros, editar sus datos, ver su ficha en PDF, asignarlos a departamentos y gestionar su estado activo/inactivo.",
      },
      {
        name: "Asistencias",
        desc: "Control de asistencia a servicios y reuniones. Registro por fecha, visualizacion de historico y reportes de presencia por miembro o periodo.",
      },
      {
        name: "Eventos",
        desc: "Creacion y seguimiento de eventos de la congregacion: cultos especiales, conferencias, ayunos, etc. Incluye fecha, descripcion y control de asistentes.",
      },
    ],
  },
  {
    label: "Pastoral",
    icon: Heart,
    color: "text-rose-300",
    desc: "Area de cuidado y crecimiento espiritual de la congregacion. Gestiona el seguimiento de personas y ministerios.",
    modules: [
      {
        name: "Visitantes",
        desc: "Registro de personas que visitan la iglesia pero aun no son miembros. Permite hacer seguimiento pastoral personalizado y convertirlos en miembros cuando corresponda.",
      },
      {
        name: "Pastoral",
        desc: "Herramienta de seguimiento espiritual: visitas pastorales, notas de cuidado, situaciones especiales de miembros y registro de consejeria.",
      },
      {
        name: "Ministerios",
        desc: "Administracion de los ministerios activos de la iglesia (alabanza, jovenes, damas, caballeros, Theillah, Vigilantes, etc.). Muestra miembros por ministerio y permite asignaciones.",
      },
    ],
  },
  {
    label: "Comunicacion",
    icon: Megaphone,
    color: "text-amber-300",
    desc: "Centro de informacion interna de la congregacion. Mantiene a todos informados de la agenda y los avisos importantes.",
    modules: [
      {
        name: "Agenda",
        desc: "Calendario institucional de la iglesia. Muestra todas las actividades programadas, permitiendo una vista semanal/mensual de compromisos.",
      },
      {
        name: "Anuncios",
        desc: "Tablon de avisos internos para comunicar novedades, recordatorios y mensajes a la congregacion directamente desde el panel.",
      },
    ],
  },
  {
    label: "Analisis",
    icon: BarChart3,
    color: "text-violet-300",
    desc: "Inteligencia de datos de la iglesia. Transforma la informacion registrada en graficos y reportes para la toma de decisiones.",
    modules: [
      {
        name: "Reportes",
        desc: "Generacion de reportes estadisticos: crecimiento de membresia, asistencia por periodo, distribucion por departamento, finanzas consolidadas y mas. Exportables en PDF o Excel.",
      },
    ],
  },
  {
    label: "Finanzas",
    icon: Wallet,
    color: "text-emerald-300",
    desc: "Control financiero completo de la iglesia. Registra ingresos, egresos, diezmos, ofrendas y genera cierres de caja con trazabilidad total.",
    modules: [
      {
        name: "Transacciones",
        desc: "Registro de todos los movimientos financieros: ingresos (diezmos, ofrendas, contribuciones, eventos) y egresos (gastos operativos, servicios, compras). Filtros por categoria, cuenta y fecha.",
      },
      {
        name: "Cuentas",
        desc: "Administracion de las cuentas financieras de la iglesia (caja chica, cuenta bancaria, etc.). Muestra saldo actual y movimientos por cuenta.",
      },
      {
        name: "Categorias",
        desc: "Clasificacion de los conceptos financieros para organizar ingresos y egresos. Permite personalizar las categorias segun las necesidades de la congregacion.",
      },
      {
        name: "Cierres",
        desc: "Generacion de cierres de caja periodicos. Resume los ingresos y egresos de un periodo definido, firmado digitalmente por el tesorero responsable.",
      },
    ],
  },
  {
    label: "Sistema",
    icon: Settings,
    color: "text-white/70",
    desc: "Configuracion y herramientas operativas del sistema. Solo disponible para administradores.",
    modules: [
      {
        name: "Inventario",
        desc: "Control de los bienes e insumos de la iglesia: equipos, mobiliario, materiales de culto, etc. Registra entradas, salidas y el stock disponible.",
      },
      {
        name: "DED (Discipulado)",
        desc: "Modulo para gestionar sesiones de discipulado y educacion cristiana. Registra asistencia, temario y avance por grupo.",
      },
      {
        name: "Administracion",
        desc: "Panel de control del sistema: gestion de usuarios y contrasenas, asignacion de roles, permisos de acceso por seccion, auditoria y configuracion general.",
      },
    ],
  },
];

const ROLES: RoleRow[] = [
  {
    key: "admin",
    name: "Administrador",
    seccion: "Todo el sistema",
    desc: "Acceso completo a todas las secciones, usuarios, configuracion y datos.",
  },
  {
    key: "secretario",
    name: "Secretario",
    seccion: "Gestion",
    desc: "Gestiona miembros, asistencias y eventos. Puede emitir fichas y carnets.",
  },
  {
    key: "diacono",
    name: "Diacono",
    seccion: "Gestion + DED",
    desc: "Acceso a la gestion de miembros, asistencias, eventos y al modulo de Discipulado (DED).",
  },
  {
    key: "tesorero",
    name: "Tesorero",
    seccion: "Finanzas",
    desc: "Acceso total al modulo de finanzas: transacciones, cuentas, categorias y cierres.",
  },
  {
    key: "lider",
    name: "Lider Pastoral",
    seccion: "Pastoral",
    desc: "Gestiona visitantes, seguimiento pastoral y ministerios.",
  },
  {
    key: "comunicador",
    name: "Comunicador",
    seccion: "Comunicacion",
    desc: "Publica y edita anuncios y gestiona la agenda institucional.",
  },
  {
    key: "analista",
    name: "Analista",
    seccion: "Analisis",
    desc: "Acceso al modulo de reportes y estadisticas para analisis de datos.",
  },
  {
    key: "bodeguero",
    name: "Bodeguero",
    seccion: "Sistema / Inventario",
    desc: "Gestiona el inventario de bienes e insumos de la iglesia.",
  },
  {
    key: "ujier",
    name: "Ujier",
    seccion: "Asistencias",
    desc: "Registra asistencias a servicios y reuniones. Sin acceso a datos sensibles.",
  },
];

function SectionCard({ s }: { s: SectionItem }) {
  const Icon = s.icon;
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 overflow-hidden">
      <div className="flex items-center gap-3 border-b border-white/10 bg-white/5 px-5 py-4">
        <div className="rounded-xl border border-white/10 bg-black/40 p-2.5">
          <Icon className={`h-5 w-5 ${s.color}`} />
        </div>
        <div>
          <div className="font-semibold text-white">{s.label}</div>
          <div className="text-xs text-white/50">{s.desc}</div>
        </div>
      </div>

      <div className="divide-y divide-white/5">
        {s.modules.map((m) => (
          <div key={m.name} className="px-5 py-3">
            <div className="text-sm font-semibold text-white/90">{m.name}</div>
            <div className="mt-0.5 text-sm text-white/55">{m.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ManualPage() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-10">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/admin/usuarios"
          className="mb-4 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/70 hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Administracion
        </Link>

        <div className="flex items-center gap-3">

          <BackButton />

          <h1 className="mt-4 text-3xl font-bold text-white">Manual de usuario</h1>

        </div>
        <p className="mt-2 text-white/60 max-w-2xl">
          MEUOJEC es el sistema de gestion integral de la Iglesia. Centraliza la administracion
          de miembros, finanzas, ministerios, comunicaciones y mas en un solo panel seguro
          y de acceso controlado por roles.
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          {[
            { label: "6 secciones", color: "bg-sky-500/10 border-sky-500/20 text-sky-200" },
            { label: "15+ modulos", color: "bg-violet-500/10 border-violet-500/20 text-violet-200" },
            { label: "9 roles", color: "bg-emerald-500/10 border-emerald-500/20 text-emerald-200" },
          ].map((p) => (
            <span
              key={p.label}
              className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${p.color}`}
            >
              {p.label}
            </span>
          ))}
        </div>
      </div>

      {/* Secciones */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-white">Secciones y modulos</h2>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {SECTIONS.map((s) => (
            <SectionCard key={s.label} s={s} />
          ))}
        </div>
      </div>

      {/* Roles */}
      <div>
        <div className="mb-4 flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-emerald-300" />
          <h2 className="text-lg font-semibold text-white">Roles del sistema</h2>
        </div>
        <p className="mb-4 text-sm text-white/55">
          Cada usuario del panel tiene asignado uno o mas roles. Los roles determinan que secciones
          puede ver y que acciones puede realizar. El administrador asigna los roles desde
          Administracion &rarr; Usuarios.
        </p>

        <div className="overflow-auto rounded-2xl border border-white/10">
          <table className="min-w-[700px] w-full text-sm text-left">
            <thead className="bg-white/5 text-white/60">
              <tr>
                <th className="px-5 py-3 font-semibold">Rol</th>
                <th className="px-5 py-3 font-semibold">Seccion principal</th>
                <th className="px-5 py-3 font-semibold">Acceso y responsabilidades</th>
              </tr>
            </thead>
            <tbody>
              {ROLES.map((r, i) => (
                <tr
                  key={r.key}
                  className={
                    i % 2 === 0
                      ? "border-t border-white/5"
                      : "border-t border-white/5 bg-white/[0.02]"
                  }
                >
                  <td className="px-5 py-3">
                    <div className="font-semibold text-white">{r.name}</div>
                    <div className="text-xs text-white/40 font-mono">{r.key}</div>
                  </td>
                  <td className="px-5 py-3 text-white/70">{r.seccion}</td>
                  <td className="px-5 py-3 text-white/60">{r.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-white/50">
        Este manual refleja el estado actual del sistema. Algunas secciones pueden estar en
        desarrollo y mostrarse como "Proximamente". Para soporte tecnico o reportar errores,
        contacta al administrador del sistema.
      </div>
    </div>
  );
}
