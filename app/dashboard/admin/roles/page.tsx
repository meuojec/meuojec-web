export const dynamic = "force-dynamic";
import Link from "next/link";

export default function Page() {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-8">
      <h1 className="text-2xl font-semibold">Roles</h1>
      <p className="mt-2 text-white/60">Próximamente.</p>
      <Link href="/dashboard/admin" className="mt-4 inline-block rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10">
        Volver
      </Link>
    </div>
  );
}
