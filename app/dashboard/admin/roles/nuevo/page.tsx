export const dynamic = "force-dynamic";
import Link from "next/link";
import BackButton from "@/app/components/BackButton";

export default function Page() {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-8">
      <div className="flex items-center gap-3">
        <BackButton />
        <h1 className="text-2xl font-semibold">Nuevo Rol</h1>
      </div>
      <p className="mt-2 text-white/60">Próximamente.</p>
      <Link href="/dashboard/admin/roles" className="mt-4 inline-block rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10">
        Volver
      </Link>
    </div>
  );
}
