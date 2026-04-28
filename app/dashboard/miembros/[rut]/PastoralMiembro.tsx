import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { actualizarEstado } from "@/app/dashboard/pastoral/actions";

type Seguimiento = {
  id: string;
  fecha: string;
  tipo: string;
  descripcion: string;
  privado: boolean;
  estado: string;
  pastor_id: string;
};

const TIPO_LABEL: Record<string, string> = {
  visita:    "🏠 Visita",
  llamada:   "📞 Llamada",
  reunion:   "🤝 Reunión",
  oracion:   "🙏 Oración",
  consejeria:"💬 Consejería",
  otro:      "📝 Otro",
};

const ESTADO_STYLE: Record<string, { cls: string; label: string }> = {
  pendiente:  { cls: "border-yellow-500/30 bg-yellow-500/10 text-yellow-300", label: "🟡 Pendiente" },
  contactado: { cls: "border-blue-500/30   bg-blue-500/10   text-blue-300",   label: "🔵 Contactado" },
  resuelto:   { cls: "border-green-500/30  bg-green-500/10  text-green-300",  label: "🟢 Resuelto" },
};

function nextEstado(current: string) {
  if (current === "pendiente")  return "contactado";
  if (current === "contactado") return "resuelto";
  return "pendiente";
}

export default async function PastoralMiembro({ rut }: { rut: string }) {
  const admin = createAdminClient();

  const { data: registros, error } = await admin
    .from("seguimiento_pastoral")
    .select("id, fecha, tipo, descripcion, privado, estado, pastor_id")
    .eq("miembro_rut", rut)
    .order("fecha", { ascending: false })
    .limit(20);

  if (error) {
    console.error("PastoralMiembro error:", error.message);
    return null;
  }

  const seguimientos = (registros ?? []) as Seguimiento[];

  // KPIs rápidas
  const total      = seguimientos.length;
  const pendientes = seguimientos.filter((r) => r.estado === "pendiente").length;
  const resueltos  = seguimientos.filter((r) => r.estado === "resuelto").length;

  return (
    <section className="rounded-xl border border-white/10 bg-white/5 p-5">
      {/* Cabecera */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-white">⛪ Seguimiento Pastoral</h2>
          {total > 0 && (
            <p className="mt-0.5 text-xs text-white/40">
              {total} registro{total !== 1 ? "s" : ""} · {pendientes} pendiente{pendientes !== 1 ? "s" : ""} · {resueltos} resuelto{resueltos !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        <Link
          href={`/dashboard/pastoral/nuevo?rut=${encodeURIComponent(rut)}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors"
        >
          + Nuevo registro
        </Link>
      </div>

      {/* Lista */}
      {seguimientos.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm text-white/30">Sin registros pastorales aún.</p>
          <Link
            href={`/dashboard/pastoral/nuevo?rut=${encodeURIComponent(rut)}`}
            className="mt-3 inline-flex items-center gap-1 text-xs text-blue-400 hover:underline"
          >
            Crear el primero →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {seguimientos.map((r) => {
            const estilo = ESTADO_STYLE[r.estado] ?? ESTADO_STYLE.pendiente;
            const siguiente = nextEstado(r.estado);

            return (
              <div
                key={r.id}
                className="relative rounded-lg border border-white/8 bg-white/[0.03] p-4"
              >
                {/* Línea superior: tipo + fecha + estado */}
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-white/60">
                    {TIPO_LABEL[r.tipo] ?? r.tipo}
                  </span>

                  <span className="text-white/20">·</span>

                  <span className="text-xs text-white/40">
                    {new Date(r.fecha + "T12:00:00").toLocaleDateString("es-CL", {
                      day: "numeric", month: "long", year: "numeric",
                    })}
                  </span>

                  {r.privado && (
                    <>
                      <span className="text-white/20">·</span>
                      <span className="text-xs text-white/30">🔒 Privado</span>
                    </>
                  )}

                  {/* Badge estado — click para ciclar */}
                  <form
                    action={actualizarEstado.bind(null, r.id, siguiente)}
                    className="ml-auto"
                  >
                    <button
                      type="submit"
                      title={`Cambiar a ${siguiente}`}
                      className={`cursor-pointer rounded-full border px-2.5 py-0.5 text-xs font-medium transition-opacity hover:opacity-70 ${estilo.cls}`}
                    >
                      {estilo.label}
                    </button>
                  </form>
                </div>

                {/* Descripción */}
                <p className="text-sm text-white/75 leading-relaxed whitespace-pre-wrap">
                  {r.descripcion}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Link al módulo completo */}
      {total > 0 && (
        <div className="mt-4 text-right">
          <Link
            href={`/dashboard/pastoral?rut=${encodeURIComponent(rut)}`}
            className="text-xs text-white/30 hover:text-white/60 hover:underline"
          >
            Ver en módulo pastoral →
          </Link>
        </div>
      )}
    </section>
  );
}
