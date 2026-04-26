// app/dashboard/admin/usuarios/page.tsx
export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import UserRolesTable from "../_components/UserRolesTable";
import { getRoles, getUsersWithRoles } from "../actions";
import { IdCard, Printer, Users, BookOpen, ArrowRight } from "lucide-react";
import BackButton from "@/app/components/BackButton";

function ToolCard({
  title,
  desc,
  href,
  icon,
}: {
  title: string;
  desc: string;
  href: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={[
        "group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5",
        "transition hover:bg-white/10 hover:border-white/20",
      ].join(" ")}
    >
      <div className="flex items-start gap-4">
        <div className="rounded-xl border border-white/10 bg-black/30 p-3">
          {icon}
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-white">{title}</h3>
            <span className="inline-flex items-center gap-1 text-xs text-white/60 group-hover:text-white">
              Abrir <ArrowRight className="h-4 w-4" />
            </span>
          </div>

          <p className="mt-1 text-sm text-white/60">{desc}</p>
        </div>
      </div>

      <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-white/10 blur-2xl opacity-0 transition group-hover:opacity-100" />
    </Link>
  );
}

export default async function AdminUsuariosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [rolesRes, usersRes] = await Promise.all([getRoles(), getUsersWithRoles()]);

  if (!rolesRes.ok) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
          Error cargando roles: {rolesRes.error}
        </div>
      </div>
    );
  }

  if (!usersRes.ok) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
          Error cargando usuarios: {usersRes.error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <BackButton />
          <h1 className="text-2xl font-bold">Administracion &middot; Usuarios</h1>
        </div>
        <p className="text-white/60">
          Crea usuarios, edita nombre/estado, asigna roles y cambia contrasenas (sin emails).
        </p>
      </div>

      {/* Herramientas */}
      <div className="mb-8">
        <div className="mb-3 flex items-center gap-2">
          <div className="text-white/80 font-semibold">Herramientas</div>
          <span className="text-xs text-white/50">Acciones masivas y operativas</span>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <ToolCard
            title="Carnets (Admin)"
            desc="Carnet individual por RUT + acceso directo a impresion masiva."
            href="/dashboard/admin/carnets"
            icon={<IdCard className="h-6 w-6 text-emerald-200" />}
          />

          <ToolCard
            title="Imprimir carnets (A4)"
            desc="PDF con 8 carnets por hoja, filtros por DED y opcion solo con foto."
            href="/dashboard/miembros/imprimir-carnets"
            icon={<Printer className="h-6 w-6 text-sky-200" />}
          />

          <ToolCard
            title="Gestion de miembros"
            desc="Ir al listado de miembros para edicion y revision de datos."
            href="/dashboard/miembros"
            icon={<Users className="h-6 w-6 text-violet-200" />}
          />

          <ToolCard
            title="Manual de usuario"
            desc="Documentacion del sistema: secciones, modulos y tabla de roles."
            href="/dashboard/admin/manual"
            icon={<BookOpen className="h-6 w-6 text-amber-200" />}
          />
        </div>
      </div>

      <UserRolesTable roles={rolesRes.data} users={usersRes.data} />
    </div>
  );
}
