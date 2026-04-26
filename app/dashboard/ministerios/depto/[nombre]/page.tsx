export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BackButton from "@/app/components/BackButton";

type Props = { params: Promise<{ nombre: string }> };

function normalize(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export default async function DeptoDetallePage({ params }: Props) {
  const { nombre } = await params;
  const nombreDecoded = decodeURIComponent(nombre);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Traer todos los miembros que tengan departamento no nulo
  const { data: rows } = await supabase
    .from("miembros")
    .select("rut,nombres,apellidos,departamento,ded,sexo,foto_url,foto_path")
    .not("departamento", "is", null)
    .neq("departamento", "")
    .order("apellidos");

  // Filtrar los que pertenecen a este departamento (coincidencia normalizada)
  const normBusqueda = normalize(nombreDecoded);
  const miembros = (rows ?? []).filter((m) => {
    const partes = (m.departamento as string)
      .split(",")
      .map((s: string) => normalize(s.trim()));
    return partes.some((p) => p === normBusqueda);
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <Link
            href="/dashboard/ministerios"
            className="text-sm text-white/40 hover:text-white/70 transition"
          >
            ← Ministerios y Departamentos
          </Link>
          <div className="flex items-center gap-3">
            <BackButton />
            <h1 className="text-3xl font-bold mt-1">{nombreDecoded}</h1>
          </div>
          <p className="text-white/50 mt-1">
            {miembros.length} {miembros.length === 1 ? "miembro" : "miembros"} en este departamento
          </p>
        </div>
      </div>

      {miembros.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-black/20 p-12 text-center text-white/40">
          No hay miembros registrados en este departamento.
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-black/20 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-white/40 text-xs uppercase tracking-wider">
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">Nombre</th>
                <th className="px-4 py-3 text-left">RUT</th>
                <th className="px-4 py-3 text-left">DED</th>
                <th className="px-4 py-3 text-left">Otros departamentos</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {miembros.map((m, i) => {
                const nombre = [m.nombres, m.apellidos].filter(Boolean).join(" ") || m.rut;
                const otrosDeptos = (m.departamento as string)
                  .split(",")
                  .map((s: string) => s.trim())
                  .filter((s) => normalize(s) !== normBusqueda);

                return (
                  <tr
                    key={m.rut}
                    className="border-b border-white/5 hover:bg-white/5 transition"
                  >
                    <td className="px-4 py-3 text-white/30 tabular-nums">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-white">{nombre}</td>
                    <td className="px-4 py-3 text-white/60 font-mono text-xs">{m.rut}</td>
                    <td className="px-4 py-3 text-white/50">{m.ded ?? "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {otrosDeptos.length === 0 ? (
                          <span className="text-white/20 text-xs">—</span>
                        ) : (
                          otrosDeptos.map((d) => (
                            <span
                              key={d}
                              className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/60"
                            >
                              {d}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/dashboard/miembros/${encodeURIComponent(m.rut)}`}
                        className="text-xs text-emerald-400 hover:text-emerald-300 transition"
                      >
                        Ver ficha
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
