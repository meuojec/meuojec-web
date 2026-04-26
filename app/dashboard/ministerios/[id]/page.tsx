export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { asignarMiembro, removerMiembro } from "../actions";
import BackButton from "@/app/components/BackButton";

type Props = { params: Promise<{ id: string }> };

export default async function MinisterioDetallePage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: ministerio } = await supabase
    .from("ministerios")
    .select("id,nombre,descripcion,lider_rut,color,activo")
    .eq("id", id)
    .maybeSingle();

  if (!ministerio) return notFound();

  const { data: miembrosMin } = await supabase
    .from("miembros_ministerios")
    .select("miembro_rut,rol,fecha_ingreso")
    .eq("ministerio_id", id)
    .eq("activo", true)
    .order("fecha_ingreso");

  const ruts = (miembrosMin ?? []).map((r) => r.miembro_rut);
  let miembrosData: any[] = [];
  if (ruts.length > 0) {
    const { data } = await supabase
      .from("miembros")
      .select("rut,nombres,apellidos")
      .in("rut", ruts);
    miembrosData = data ?? [];
  }

  const miembros = (miembrosMin ?? []).map((mm) => {
    const m = miembrosData.find((x) => x.rut === mm.miembro_rut);
    return { ...mm, nombre: m ? `${m.nombres ?? ""} ${m.apellidos ?? ""}`.trim() : mm.miembro_rut };
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            className="h-4 w-4 rounded-full flex-shrink-0"
            style={{ backgroundColor: ministerio.color ?? "#6366f1" }}
          />
          <div>
            <div className="flex items-center gap-3">
              <BackButton />
              <h1 className="text-3xl font-bold">{ministerio.nombre}</h1>
            </div>
            {ministerio.descripcion && (
              <p className="mt-1 text-white/60">{ministerio.descripcion}</p>
            )}
            {ministerio.lider_rut && (
              <p className="mt-1 text-sm text-white/40">Líder: {ministerio.lider_rut}</p>
            )}
          </div>
        </div>
        <Link
          href="/dashboard/ministerios"
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/70 hover:bg-white/10 transition"
        >
          ← Volver
        </Link>
      </div>

      {/* Agregar miembro */}
      <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
        <h2 className="font-semibold mb-3">Agregar miembro</h2>
        <form
          action={async (fd: FormData) => {
            "use server";
            const rut = String(fd.get("rut") || "").trim();
            const rol = String(fd.get("rol") || "miembro");
            if (rut) await asignarMiembro(id, rut, rol);
          }}
          className="flex gap-2 flex-wrap"
        >
          <input
            name="rut"
            required
            placeholder="RUT del miembro"
            className="flex-1 min-w-[180px] rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500/40"
          />
          <select
            name="rol"
            className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
          >
            <option value="miembro">Miembro</option>
            <option value="lider">Líder</option>
            <option value="coordinador">Coordinador</option>
            <option value="apoyo">Apoyo</option>
          </select>
          <button
            type="submit"
            className="rounded-xl border border-emerald-500/30 bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/20 transition"
          >
            Agregar
          </button>
        </form>
      </div>

      {/* Lista de miembros */}
      <div className="rounded-2xl border border-white/10 bg-black/20 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <span className="font-semibold">Miembros activos</span>
          <span className="text-sm text-white/50">{miembros.length}</span>
        </div>
        {miembros.length === 0 ? (
          <div className="px-5 py-8 text-center text-white/40 text-sm">
            Sin miembros asignados aún.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-black/30 text-white/70">
              <tr className="border-b border-white/10">
                <th className="text-left font-medium px-4 py-3">Miembro</th>
                <th className="text-left font-medium px-4 py-3">RUT</th>
                <th className="text-left font-medium px-4 py-3">Rol</th>
                <th className="text-left font-medium px-4 py-3">Desde</th>
                <th className="text-right font-medium px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {miembros.map((m) => (
                <tr key={m.miembro_rut} className="border-t border-white/10 hover:bg-white/5">
                  <td className="px-4 py-3 text-white/90">{m.nombre}</td>
                  <td className="px-4 py-3 text-white/60 tabular-nums">{m.miembro_rut}</td>
                  <td className="px-4 py-3 text-white/70 capitalize">{m.rol}</td>
                  <td className="px-4 py-3 text-white/50">{m.fecha_ingreso ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <form action={removerMiembro.bind(null, id, m.miembro_rut)}>
                      <button
                        type="submit"
                        className="rounded border border-red-500/20 bg-red-500/10 px-2 py-1 text-xs text-red-300 hover:bg-red-500/20 transition"
                      >
                        Quitar
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
