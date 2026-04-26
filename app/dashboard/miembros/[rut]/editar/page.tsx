import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MemberEditForm from "./MemberEditForm";
import BackButton from "@/app/components/BackButton";

type PageProps = { params: Promise<{ rut: string }> };

export default async function EditarMiembroPage({ params }: PageProps) {
  const { rut } = await params;
  const rutDecoded = decodeURIComponent(rut);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("miembros")
    .select("*")
    .eq("rut", rutDecoded)
    .single();

  if (error || !data) {
    redirect("/dashboard/miembros");
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-3">
        <Link href="/dashboard/miembros" className="text-sm text-white/70">
          ← Volver
        </Link>

        <Link
          href={`/dashboard/miembros/${encodeURIComponent(rutDecoded)}`}
          className="text-sm text-white/70"
        >
          Ver detalle →
        </Link>
      </div>

      <div>
        <div className="flex items-center gap-3">
          <BackButton />
          <h1 className="text-3xl font-bold">Editar miembro</h1>
        </div>
        <p className="text-white/60 mt-2">{data.rut}</p>
      </div>

      <MemberEditForm initial={data} />
    </div>
  );
}