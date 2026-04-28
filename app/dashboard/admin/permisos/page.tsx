export const dynamic = "force-dynamic";

import BackButton from "@/app/components/BackButton";
import { ShieldCheck, Check, Minus } from "lucide-react";

type ModuleRow = {
  modulo: string;
  admin: boolean;
  diacono: boolean;
  ujier: boolean;
  pastor: boolean;
};

const MODULOS: ModuleRow[] = [
  { modulo: "Dashboard",        admin: true,  diacono: true,  ujier: true,  pastor: true  },
  { modulo: "Miembros",         admin: true,  diacono: true,  ujier: false, pastor: true  },
  { modulo: "Asistencias",      admin: true,  diacono: true,  ujier: true,  pastor: true  },
  { modulo: "Eventos",          admin: true,  diacono: true,  ujier: true,  pastor: true  },
  { modulo: "Visitantes",       admin: true,  diacono: true,  ujier: false, pastor: true  },
  { modulo: "Pastoral",         admin: true,  diacono: false, ujier: false, pastor: true  },
  { modulo: "Ministerios",      admin: true,  diacono: false, ujier: false, pastor: false },
  { modulo: "Agenda",           admin: true,  diacono: false, ujier: true,  pastor: true  },
  { modulo: "Anuncios",         admin: true,  diacono: false, ujier: true,  pastor: true  },
  { modulo: "Esc. Dominical",   admin: true,  diacono: true,  ujier: false, pastor: false },
  { modulo: "Contribuciones",   admin: true,  diacono: false, ujier: false, pastor: false },
  { modulo: "Finanzas",         admin: true,  diacono: false, ujier: false, pastor: false },
  { modulo: "Inventario",       admin: true,  diacono: false, ujier: false, pastor: false },
  { modulo: "Reportes",         admin: true,  diacono: false, ujier: false, pastor: false },
  { modulo: "Administración",   admin: true,  diacono: false, ujier: false, pastor: false },
];

const ROLES = [
  { key: "admin",   label: "Admin",    color: "text-emerald-300", desc: "Acceso total al sistema" },
  { key: "pastor",  label: "Pastor",   color: "text-violet-300",  desc: "Pastoral y miembros" },
  { key: "diacono", label: "Diácono",  color: "text-sky-300",     desc: "Operativo y asistencias" },
  { key: "ujier",   label: "Ujier",    color: "text-amber-300",   desc: "Asistencia y agenda" },
];

function Cell({ ok }: { ok: boolean }) {
  return ok
    ? <Check className="h-4 w-4 text-emerald-400 mx-auto" />
    : <Minus className="h-3 w-3 text-white/15 mx-auto" />;
}

export default function PermisosPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BackButton />
        <h1 className="text-2xl font-bold">Permisos por rol</h1>
      </div>

      {/* Leyenda de roles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {ROLES.map((r) => (
          <div key={r.key} className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className={`h-4 w-4 ${r.color}`} />
              <span className={`font-semibold text-sm ${r.color}`}>{r.label}</span>
            </div>
            <p className="text-xs text-white/50">{r.desc}</p>
          </div>
        ))}
      </div>

      {/* Matriz de permisos */}
      <div className="rounded-2xl border border-white/10 bg-black/20 overflow-hidden">
        <div className="px-5 py-3 border-b border-white/10 text-sm font-semibold text-white/70">
          Matriz de acceso por módulo
        </div>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-black/30">
              <tr className="border-b border-white/10">
                <th className="text-left font-medium px-5 py-3 text-white/60">Módulo</th>
                {ROLES.map((r) => (
                  <th key={r.key} className={`text-center font-medium px-4 py-3 ${r.color}`}>
                    {r.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MODULOS.map((m, i) => (
                <tr key={m.modulo} className={`border-t border-white/10 ${i % 2 === 0 ? "" : "bg-white/[0.02]"}`}>
                  <td className="px-5 py-2.5 text-white/80 font-medium">{m.modulo}</td>
                  <td className="px-4 py-2.5 text-center"><Cell ok={m.admin} /></td>
                  <td className="px-4 py-2.5 text-center"><Cell ok={m.pastor} /></td>
                  <td className="px-4 py-2.5 text-center"><Cell ok={m.diacono} /></td>
                  <td className="px-4 py-2.5 text-center"><Cell ok={m.ujier} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-white/30">
        Nota: Los permisos exactos se configuran en la base de datos mediante la tabla <code className="bg-white/5 px-1 rounded">role_permissions</code>.
        Esta tabla refleja la configuración por defecto del sistema.
        Para cambiar los permisos de un usuario específico, ve a{" "}
        <a href="/dashboard/admin/usuarios" className="underline text-white/50 hover:text-white/80">Administración → Usuarios</a>.
      </p>
    </div>
  );
}
