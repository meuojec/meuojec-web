export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

type SP = { ded?: string; limit?: string; foto?: string };

export default async function ImprimirCarnetsPage({
  searchParams,
}: {
  // ✅ En tu Next (16.1.6 + Turbopack) puede venir como Promise
  searchParams?: Promise<SP> | SP;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // ✅ Unwrap seguro
  const sp = (searchParams ? await searchParams : {}) as SP;

  // DEDs disponibles
  const { data: dedsData } = await supabase
    .from("miembros")
    .select("ded")
    .not("ded", "is", null)
    .limit(1000);

  const deds = Array.from(
    new Set((dedsData ?? []).map((x: any) => (x.ded ?? "").trim()).filter(Boolean))
  ).sort();

  const ded = (sp.ded ?? "").trim();
  const limit = (sp.limit ?? "200").trim() || "200";
  const foto = (sp.foto ?? "0").trim() || "0";

  const url = `/api/miembros/carnets?ded=${encodeURIComponent(ded)}&limit=${encodeURIComponent(
    limit
  )}&foto=${encodeURIComponent(foto)}`;

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Imprimir carnets (A4)</h1>
        <p className="mt-1 text-sm text-white/60">
          PDF con 8 carnets por hoja. Ideal para impresión masiva.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
        <form className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm text-white/70">DED (opcional)</label>
            <select
              name="ded"
              defaultValue={ded}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white"
            >
              <option value="">Todas</option>
              {deds.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-white/70">Límite</label>
            <input
              name="limit"
              defaultValue={limit}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white"
              placeholder="200"
            />
            <p className="mt-1 text-xs text-white/50">Sugerido: 200 (máx 500).</p>
          </div>

          <div className="md:col-span-2 flex items-center gap-2">
            <input
              id="foto"
              type="checkbox"
              name="foto"
              value="1"
              defaultChecked={foto === "1"}
              className="h-4 w-4"
            />
            <label htmlFor="foto" className="text-sm text-white/70">
              Solo miembros con foto
            </label>
          </div>

          <div className="md:col-span-2 flex gap-2">
            <button
              type="submit"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10"
            >
              Aplicar filtros
            </button>

            <Link
              href={url}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
            >
              Generar PDF
            </Link>
          </div>
        </form>
      </div>

      <div className="mt-4 text-xs text-white/50">
        Endpoint: <span className="font-mono">{url}</span>
      </div>
    </div>
  );
}