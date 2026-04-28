import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import MemberForm, { type MemberRow } from "@/app/components/MemberForm";
import HistorialMiembro from "./HistorialMiembro";
import AsistenciasMiembro from "./AsistenciasMiembro";
import PastoralMiembro from "./PastoralMiembro";

type PageProps = {
  params: Promise<{ rut: string }>;
  searchParams?: Promise<{ edit?: string }>;
};

const BUCKET = "fotos-identidad";

export default async function Page({ params, searchParams }: PageProps) {
  const { rut } = await params;
  const rutDecoded = decodeURIComponent(rut);

  const sp = (await searchParams) ?? {};
  const isEdit = sp.edit === "1" || sp.edit === "true";

  const supabase = await createClient();

  // 1) Traer miembro completo
  const { data: miembro, error } = await supabase
    .from("miembros")
    .select("*")
    .eq("rut", rutDecoded)
    .maybeSingle<MemberRow>();

  if (error) throw error;
  if (!miembro) notFound();

  // 2) Resolver foto desde Storage
  let initialFotoUrl: string | null = null;

  const fromDb =
    (miembro as any)?.foto_identidad_url ||
    (miembro as any)?.foto_url ||
    null;

  if (typeof fromDb === "string" && fromDb.startsWith("http")) {
    initialFotoUrl = fromDb;
  } else {
    const prefix = `${rutDecoded}.FOTO DE IDENTIDAD.`;

    const { data: files } = await supabase.storage
      .from(BUCKET)
      .list("", { limit: 2000, search: prefix });

    const found = (files ?? []).find((f) => f?.name?.startsWith(prefix));

    if (found?.name) {
      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(found.name);
      initialFotoUrl = pub?.publicUrl ?? null;

      await supabase
        .from("miembros")
        .update({ foto_path: found.name, foto_url: initialFotoUrl })
        .eq("rut", rutDecoded);
    }
  }

  return (
    <div className="space-y-4">
      {/* Barra superior */}
      <div className="flex items-center justify-between gap-2">
        <Link
          href="/dashboard/miembros"
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
        >
          ← Regresar
        </Link>

        <div className="flex items-center gap-2">
          {!isEdit && (
            <a
              href={`/api/miembros/${encodeURIComponent(rutDecoded)}/carnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10 text-white/70"
            >
              🪪 Carnet PDF
            </a>
          )}

          {!isEdit ? (
            <Link
              href={`/dashboard/miembros/${encodeURIComponent(rutDecoded)}?edit=1`}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white px-3 py-2 text-sm text-black hover:bg-white/90"
            >
              ✏️ Editar
            </Link>
          ) : (
            <Link
              href={`/dashboard/miembros/${encodeURIComponent(rutDecoded)}`}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
            >
              ✖ Cancelar
            </Link>
          )}
        </div>
      </div>

      {/* Formulario */}
      <MemberForm
        mode={isEdit ? "edit" : "detail"}
        initialData={miembro}
        initialFotoUrl={initialFotoUrl}
      />

      {/* Asistencias */}
      {!isEdit && <AsistenciasMiembro rut={rutDecoded} />}

      {/* Seguimiento Pastoral */}
      {!isEdit && <PastoralMiembro rut={rutDecoded} />}

      {/* Historial de cambios */}
      {!isEdit && <HistorialMiembro rut={rutDecoded} />}
    </div>
  );
}
