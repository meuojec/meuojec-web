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
  HandCoins,
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

/* ------------------------------------------------------------------ */
/* Tipos de datos locales                                               */
/* ------------------------------------------------------------------ */
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

/* ------------------------------------------------------------------ */
/* Datos del manual                                                     */
/* ------------------------------------------------------------------ */
const SECTIONS: SectionItem[] = [
  {
    label: "Gestión",
    icon: LayoutDashboard,
    color: "text-sky-300",
    desc: "Núcleo operativo de la iglesia. Aquí se administra el día a día: quiénes somos, quién asiste y qué eventos organizamos.",
    modules: [
      {
        name: "Dashboard",
        desc: "Resumen general con indicadores clave: total de miembros activos, asistencia reciente, próximos eventos y actividad del sistema.",
      },
      {
        name: "Miembros",
        desc: "Registro completo de los miembros de la iglesia. Permite agregar nuevos miembros, editar sus datos, ver su ficha en PDF, asignarlos a departamentos y gestionar su estado activo/inactivo.",
      },
      {
        name: "Asistencias",
        desc: "Control de asistencia a servicios y reuniones. Registro por fecha, visualización de histórico y reportes de presencia por miembro o período.",
      },
      {
        name: "Eventos",
        desc: "Creación y seguimiento de eventos de la congregación: cultos especiales, conferencias, ayunos, etc. Incluye fecha, descripción y control de asistentes.",
      },
    ],
  },
  {
    label: "Pastoral",
    icon: Heart,
    color: "text-rose-300",
    desc: "Área de cuidado y crecimiento espiritual de la congregación. Gestiona el seguimiento de personas, ministerios y ofrendas.",
    modules: [
      {
        name: "Visitantes",
        desc: "Registro de personas que visitan la iglesia pero aún no son miembros. Permite hacer seguimiento pastoral personalizado y convertirlos en miembros cuando corresponda.",
      },
      {
        name: "Pastoral",
        desc: "Herramienta de seguimiento espiritual: visitas pastorales, notas de cuidado, situaciones especiales de miembros y registro de consejería.",
      },
      {
        name: "Ministerios",
        desc: "Administración de los ministerios activos de la iglesia (alabanza, jóvenes, damas, caballeros, Theillah, Vigilantes, etc.). Muestra miembros por ministerio y permite asignaciones.",
      },
      {
        name: "Contribuciones",
        desc: "Registro de diezmos, ofrendas y contribuciones especiales por miembro. Genera reportes individuales y permite la emisión de constancias.",
      },
    ],
  },
  {
    label: "Comunicación",
    icon: Megaphone,
    color: "text-amber-300",
    desc: "Centro de información interna de la congregación. Mantiene a todos informados de la agenda y los avisos importantes.",
    modules: [
      {
        name: "Agenda",
        desc: "Calendario institucional de la iglesia. Muestra todas las actividades programadas, permitiendo una vista semanal/mensual de compromisos.",
      },
      {
        name: "Anuncios",
        desc: "Tablón de avisos internos para comunicar novedades, recordatorios y mensajes a la congregación directamente desde el panel.",
      },
    ],
  },
  {
    label: "Análisis",
    icon: BarChart3,
    color: "text-violet-300",
    desc: "Inteligencia de datos de la iglesia. Transforma la información registrada en gráficos y reportes para la toma de decisiones.",
    modules: [
      {
        name: "Reportes",
        desc: "Generación de reportes estadísticos: crecimiento de membresía, asistencia por período, distribución por departamento, finanzas consolidadas y más. Exportables en PDF o Excel.",
      },
    ],
  },
  {
    label: "Finanzas",
    icon: Wallet,
    color: "text-emerald-300",
    desc: "Control financiero completo de la iglesia. Registra ingresos, egresos y genera cierres de caja con trazabilidad total.",
    modules: [
      {
        name: "Transacciones",
        desc: "Registro de todos los movimientos financieros: ingresos (diezmos, ofrendas, eventos) y egresos (gastos operativos, servicios, compras). Filtros por categoría, cuenta y fecha.",
      },
      {
        name: "Cuentas",
        desc: "Administración de las cuentas financieras de la iglesia (caja chica, cuenta bancaria, etc.). Muestra saldo actual y movimientos por cuenta.",
      },
      {
        name: "Categorías",
        desc: "Clasificación de los conceptos financieros para organizar ingresos y egresos. Permite personalizar las categorías según las necesidades de la congregación.",
      },
      {
        name: "Cierres",
        desc: "Generación de cierres de caja periódicos. Resume los ingresos y egresos de un período definido, firmado digitalmente por el tesorero responsable.",
      },
    ],
  },
  {
    label: "Sistema",
    icon: Settings,
    color: "text-white/70",
    desc: "Configuración y herramientas operativas del sistema. Solo disponible para administradores.",
    modules: [
      {
        name: "Inventario",
        desc: "Control de los bienes e insumos de la iglesia: equipos, mobiliario, materiales de culto, etc. Registra entradas, salidas y el stock disponible.",
      },
      {
        name: "DED (Discipulado)",
        desc: "Módulo para gestionar sesiones de discipulado y educación cristiana. Registra asistencia, temario y avance por grupo.",
      },
      {
        name: "Administración",
        desc: "Panel de control del sistema: gestión de usuarios y contraseñas, asignación de roles, permisos de acceso por sección, auditoría y configuración general.",
      },
    ],
  },
];

const ROLES: RoleRow[] = [
  {
    key: "admin",
    name: "Administrador",
    seccion: "Todo el sistema",
    desc: "Acceso completo a todas las secciones, usuarios, configuración y datos.",
  },
  {
    key: "secretario",
    name: "Secretario",
    seccion: "Gestión",
    desc: "Gestiona miembros, asistencias y eventos. Puede emitir fichas y carnets.",
  },
  {
    key: "tesorero",
    name: "Tesorero",
    seccion: "Finanzas",
    desc: "Acceso total al módulo de finanzas: transacciones, cuentas, categorías y cierres.",
  },
  {
    key: "lider",
    name: "Líder Pastoral",
    seccion: "Pastoral",
    desc: "Gestiona visitantes, seguimiento pastoral, ministerios y contribuciones.",
  },
  {
    key: "comunicador",
    name: "Comunicador",
    seccion: "Comunicación",
    desc: "Publica y edita anuncios y gestiona la agenda institucional.",
  },
  {
    key: "analista",
    name: "Analista",
    seccion: "Análisis",
    desc: "Acceso al módulo de reportes y estadísticas para análisis de datos.",
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

/* ------------------------------------------------------------------ */
/* Componentes                                                          */
/* ------------------------------------------------------------------ */
function SectionCard({ s }: { s: SectionItem }) {
  const Icon = s.icon;
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 overflow-hidden">
      {/* header */}
      <div className="flex items-center gap-3 border-b border-white/10 bg-white/5 px-5 py-4">
        <div className="rounded-xl border border-white/10 bg-black/40 p-2.5">
          <Icon className={`h-5 w-5 ${s.color}`} />
        </div>
        <div>
          <div className="font-semibold text-white">{s.label}</div>
          <div className="text-xs text-white/50">{s.desc}</div>
        </div>
      </div>

      {/* modules */}
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

/* ------------------------------------------------------------------ */
/* Página                                                               */
/* ------------------------------------------------------------------ */
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
          Volver a Administración
        </Link>

        <h1 className="mt-4 text-3xl font-bold text-white">Manual de usuario</h1>
        <p className="mt-2 text-white/60 max-w-2xl">
          MEUOJEC es el sistema de gestión integral de la Iglesia. Centraliza la administración
          de miembros, finanzas, ministerios, comunicaciones y más en un solo panel seguro
          y de acceso controlado por roles.
        </p>

        {/* Metadata pill */}
        <div className="mt-4 flex flex-wrap gap-3">
          {[
            { label: "6 secciones", color: "bg-sky-500/10 border-sky-500/20 text-sky-200" },
            { label: "16+ módulos", color: "bg-violet-500/10 border-violet-500/20 text-violet-200" },
            { label: "8 roles", color: "bg-emerald-500/10 border-emerald-500/20 text-emerald-200" },
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
        <h2 className="mb-4 text-lg font-semibold text-white">Secciones y módulos</h2>
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
          Cada usuario del panel tiene asignado uno o más roles. Los roles determinan qué secciones
          puede ver y qué acciones puede realizar. El administrador asigna los roles desde
          Administración → Usuarios.
        </p>

        <div className="overflow-auto rounded-2xl border border-white/10">
          <table className="min-w-[700px] w-full text-sm text-left">
            <thead className="bg-white/5 text-white/60">
              <tr>
                <th className="px-5 py-3 font-semibold">Rol</th>
                <th className="px-5 py-3 font-semibold">Sección principal</th>
                <th className="px-5 py-3 font-semibold">Acceso y responsabilidades</th>
              </tr>
            </thead>
            <tbody>
              {ROLES.map((r, i) => (
                <tr
                  key={r.key}
                  className={i % 2 === 0 ? "border-t border-white/5" : "border-t border-white/5 bg-white/[0.02]"}
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

      {/* Footer note */}
      <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-white/50">
        Este manual refleja el estado actual del sistema. Algunas secciones pueden estar en
        desarrollo y mostrarse como "Próximamente". Para soporte técnico o reportar errores,
        contacta al administrador del sistema.
      </div>
    </div>
  );
}
