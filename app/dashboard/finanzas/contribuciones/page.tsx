export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

type Mov = {
  id: string;
  fecha: string | null;
  tipo: string | null;
  monto: number | null;
  referencia: string | null;
  descripcion: string | null;
  cuenta_id: string | null;
  categoria_id: string | null;
  metodo_pago: string | null;
};
type Categoria = { id: string; nombre: string | null };
type Cuenta = { id: string; nombre: string | null };

function fmtMoney(n: number | null | undefined) {
  const v = typeof n === "number" ? n : 0;
  return v.toLocaleString("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  });
}
function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}-${m}-${y}`;
}

// Palabras clave para identificar contribuciones (diezmos, ofrendas, etc.)
const CONTRIB_KEYWORDS = ["diezmo", "ofrenda", "contribucion", "donacion", "aporte", "terreno"];

export default async function ContribucionesPage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const spRaw = (await Promise.resolve(props.searchParams ?? {})) as Record<string, string | string[] | undefined>;
  const get1 = (k: string) => {
    const v = spRaw[k];
    return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
  };

  const desde = get1("desde") || "";
  const hasta = get1("hasta") || "";
  const page = Math.max(1, Number(get1("page") || "1") || 1);
  const pageSize = 30;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // Traer categorias de tipo INGRESO para identificar contribuciones
  const { data: catData } = await supabase
    .from("fin_categorias")
    .select("id,nombre")
    .eq("area", "IGLESIA")
    .eq("activa", true)
    .eq("tipo", "INGRESO");

  const todasCats = (catData ?? []) as Categoria[];

  // Filtrar categorias que sean contribuciones por nombre
  const contribCatIds = todasCats
    .filter(c => {
      const nom = (c.nombre ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return CONTRIB_KEYWORDS.some(kw => nom.includes(kw));
    })
    .map(c => c.id);

  // Traer cuentas
  const { data: cuentasData } = await supabase
    .from("fin_cuentas")
    .select("id,nombre")
    .eq("area", "IGLESIA")
    .eq("activa", true);
  const cuentas = (cuentasData ?? []) as Cuenta[];

  // Construir query: movimientos INGRESO de categorias de contribucion
  let query = supabase
    .from("fin_movimientos")
    .select("id,fecha,tipo,monto,referencia,descripcion,cuenta_id,categoria_id,metodo_pago", { count: "exact" })
    .eq("area", "IGLESIA")
    .eq("tipo", "INGRESO");

  if (contribCatIds.length > 0) {
    query = query.in("categoria_id", contribCatIds);
  }
  if (desde) query = query.gte("fecha", desde);
  if (hasta) query = query.lte("fecha", hasta);

  query = query.order("fecha", { ascending: false }).range(from, to);

  const { data: rowsData, count } = await query;
  const rows = (rowsData ?? []) as Mov[];

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / pageSize));
  const totalMonto = rows.reduce((a, r) => a + (r.monto ?? 0), 0);

  const cuentasMap = new Map(cuentas.map(c => [c.id, c]));
  const catsMap = new Map(todasCats.map(c => [c.id, c]));

  // Resumen por categoria
  const porCategoria = new Map<string, { nombre: string; total: number; count: number }>();
  for (const r of rows) {
    const cat = r.categoria_id ? catsMap.get(r.categoria_id) : null;
    const key = cat?.id ?? "sin-categoria";
    const nombre = cat?.nombre ?? "Sin categoria";
    if (!porCategoria.has(key)) porCategoria.set(key, { nombre, total: 0, count: 0 });
    const s = porCategoria.get(key)!;
    s.total += r.monto ?? 0;
    s.count++;
  }
  const resumenCats = Array.from(porCategoria.values()).sort((a, b) => b.total - a.total);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/finanzas/transacciones"
            className="inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/5 p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-white">Contribuciones</h1>
            <p className="text-sm text-white/60">
              Vista de solo lectura: diezmos, ofrendas y aportes.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-white/40">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Solo lectura</span>
        </div>
      </div>

      {/* Filtro rapido de fechas */}
      <form method="get" className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs text-white/60 mb-1">Desde</label>
          <input
            type="date"
            name="desde"
            defaultValue={desde}
            className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-white/20"
          />
        </div>
        <div>
          <label className="block text-xs text-white/60 mb-1">Hasta</label>
          <input
            type="date"
            name="hasta"
            defaultValue={hasta}
            className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-white/20"
          />
        </div>
        <button
          type="submit"
          className="inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
        >
          Filtrar
        </button>
        {(desde || hasta) && (
          <Link
            href="/dashboard/finanzas/contribuciones"
            className="inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/60 hover:bg-white/10"
          >
            Limpiar
          </Link>
        )}
      </form>

      {/* KPIs */}
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="text-xs text-white/60 mb-1">Total contribuciones (pagina)</div>
          <div className="text-2xl font-bold text-emerald-400">{fmtMoney(totalMonto)}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="text-xs text-white/60 mb-1">Registros (pagina)</div>
          <div className="text-2xl font-bold text-white">{rows.length}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="text-xs text-white/60 mb-1">Total registros</div>
          <div className="text-2xl font-bold text-white">{count ?? 0}</div>
        </div>
      </div>

      {/* Resumen por categoria */}
      {resumenCats.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <h2 className="text-sm font-semibold text-white/80 mb-3">Resumen por tipo (pagina)</h2>
          <div className="flex flex-wrap gap-3">
            {resumenCats.map((c) => (
              <div key={c.nombre} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2">
                <div className="text-xs text-white/60">{c.nombre}</div>
                <div className="font-semibold text-white">{fmtMoney(c.total)}</div>
                <div className="text-xs text-white/40">{c.count} registros</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className="rounded-2xl border border-white/10 bg-black/20">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/10 text-white/60">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3">Cuenta</th>
                <th className="px-4 py-3">Metodo</th>
                <th className="px-4 py-3">Referencia</th>
                <th className="px-4 py-3 text-right">Monto</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td className="px-4 py-8 text-white/50" colSpan={6}>
                    {contribCatIds.length === 0
                      ? "No se encontraron categorias de contribuciones (diezmos, ofrendas, etc.). Crea categorias con esos nombres en Finanzas > Categorias."
                      : "Sin contribuciones en el periodo seleccionado."}
                  </td>
                </tr>
              )}
              {rows.map((r) => {
                const cat = r.categoria_id ? catsMap.get(r.categoria_id) : null;
                const cta = r.cuenta_id ? cuentasMap.get(r.cuenta_id) : null;
                return (
                  <tr key={r.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                    <td className="px-4 py-3 text-white/80">{fmtDate(r.fecha)}</td>
                    <td className="px-4 py-3 font-medium text-white">{cat?.nombre ?? "—"}</td>
                    <td className="px-4 py-3 text-white/70">{cta?.nombre ?? "—"}</td>
                    <td className="px-4 py-3 text-white/70">{r.metodo_pago ?? "—"}</td>
                    <td className="px-4 py-3 text-white/70">{r.referencia ?? r.descripcion ?? "—"}</td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-400">{fmtMoney(r.monto)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-4 py-3 text-xs text-white/60">
          <div>Pagina {page} de {totalPages} &middot; Total {count ?? 0}</div>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/dashboard/finanzas/contribuciones?desde=${desde}&hasta=${hasta}&page=${page - 1}`}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-white hover:bg-white/10"
              >
                Anterior
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/dashboard/finanzas/contribuciones?desde=${desde}&hasta=${hasta}&page=${page + 1}`}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-white hover:bg-white/10"
              >
                Siguiente
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/20 p-3 text-xs text-white/40">
        Esta pagina extrae automaticamente los movimientos de tipo INGRESO cuya categoria
        contiene palabras como diezmo, ofrenda, contribucion, donacion, aporte o terreno.
        Para agregar mas categorias, edita las categorias en Finanzas &gt; Categorias.
      </div>
    </div>
  );
}
