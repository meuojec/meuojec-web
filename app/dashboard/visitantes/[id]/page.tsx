export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { actualizarEstado, agregarSeguimiento } from "../actions";
import BackButton from "@/app/components/BackButton";

type Props = { params: Promise<{ id: string }> };

const ESTADOS = ["nuevo", "en_proceso", "integrado", "inactivo"];
const ESTADO_LABEL: Record<string, string> = { nuevo: "Nuevo", en_proceso: "En proceso", integrado: "Integrado", inactivo: "Inactivo" };
const ESTADO_STYLE: Record<string, string> = {
  nuevo: "border-sky-500/30 bg-sky-500/10 text-sky-200",
  en_proceso: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  integrado: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  inactivo: "border-white/10 bg-white/5 text-white/50",
};
const TIPO_SEG_LABEL: Record<string, string> = { contacto: "Contacto", visita_domiciliar: "Visita domiciliar", llamada: "Llamada", asistio_culto: "Asistió al culto", otro: "Otro" };

export default async function VisitanteDetallePage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: v } = await supabase.from("visitantes").select("*").eq("id", id).maybeSingle();
  if (!v) return notFound();

  const { data: seguimiento } = await supabase
    .from("visitantes_seguimiento")
    .select("id,fecha,tipo,descripcion,created_at")
    .eq("visitante_id", id)
    .order("fecha", { ascending: false });

  const hoy = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <BackButton />
            <h1 className="text-3xl font-bold">{v.nombres} {v.apellidos ?? ""}</h1>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${ESTADO_STYLE[v.estado] ?? ""}`}>
              {ESTADO_LABEL[v.estado] ?? v.estado}
            </span>
            <span className="text-sm text-white/50">Primera visita: {v.fecha_primera_visita}</span>
          </div>
        </div>
        <Link href="/dashboard/visitantes" className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/70 hover:bg-white/10 transition">
          ← Volver
        </Link>
      </div>

      {/* Info */}
      <div className="rounded-2xl border border-white/10 bg-black/20 p-5 grid grid-cols-2 gap-4 text-sm">
        {[
          { label: "Teléfono", valor: v.telefono },
          { label: "Email", valor: v.email },
          { label: "Origen", valor: (v.origen ?? "").replace("_", " ") },
          { label: "Discipulador", valor: v.discipulador_rut },
        ].map((f) => (
          <div key={f.label}>
            <div className="text-white/40 text-xs">{f.label}</div>
            <div className="text-white/80 mt-0.5">{f.valor || "—"}</div>
          </div>
        ))}
        {v.notas && (
          <div className="col-span-2">
            <div className="text-white/40 text-xs">Notas</div>
            <div className="text-white/70 mt-0.5">{v.notas}</div>
          </div>
        )}
      </div>

      {/* Cambiar estado */}
      <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
        <div className="font-semibold mb-3 text-sm">Cambiar estado</div>
        <div className="flex flex-wrap gap-2">
          {ESTADOS.filter((e) => e !== v.estado).map((estado) => (
            <form key={estado} action={actualizarEstado.bind(null, id, estado)}>
              <button type="submit" className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${ESTADO_STYLE[estado]}`}>
                → {ESTADO_LABEL[estado]}
              </button>
            </form>
          ))}
        </div>
      </div>

      {/* Seguimiento */}
      <div className="rounded-2xl border border-white/10 bg-black/20 p-5 space-y-4">
        <div className="font-semibold">Historial de seguimiento</div>

        <form
          action={async (fd: FormData) => {
            "use server";
            await agregarSeguimiento(id, fd);
          }}
          className="grid gap-3"
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-white/50">Fecha</label>
              <input type="date" name="fecha" defaultValue={hoy} className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-sm text-white" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-white/50">Tipo</label>
              <select name="tipo" className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-sm text-white">
                <option value="contacto">Contacto</option>
                <option value="llamada">Llamada</option>
                <option value="visita_domiciliar">Visita domiciliar</option>
                <option value="asistio_culto">Asistió al culto</option>
                <option value="otro">Otro</option>
              </select>
            </div>
          </div>
          <textarea name="descripcion" rows={2} placeholder="Descripción del contacto..." required className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white resize-none" />
          <button type="submit" className="self-start rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/20 transition">
            Agregar registro
          </button>
        </form>

        <div className="space-y-2 mt-2">
          {(seguimiento ?? []).length === 0 && (
            <p className="text-sm text-white/40">Sin registros de seguimiento.</p>
          )}
          {(seguimiento ?? []).map((s: any) => (
            <div key={s.id} className="rounded-xl border border-white/5 bg-white/5 px-4 py-3 text-sm">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-medium text-white/80">{TIPO_SEG_LABEL[s.tipo] ?? s.tipo}</span>
                <span className="text-xs text-white/40 tabular-nums">{s.fecha}</span>
              </div>
              <p className="text-white/60">{s.descripcion}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
