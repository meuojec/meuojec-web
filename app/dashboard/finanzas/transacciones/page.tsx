export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import FiltrosTransacciones from "./_components/FiltrosTransacciones";
import DeleteButton from "./_components/DeleteButton";

type Cuenta = {
  id: string;
  nombre: string | null;
  tipo: string | null;
  moneda: string | null;
  activa: boolean | null;
};
type Categoria = {
  id: string;
  nombre: string | null;
  tipo: string | null;
  activa: boolean | null;
  orden: number | null;
};
type Mov = {
  id: string;
  fecha: string | null;
  tipo: string | null;
  monto: number | null;
  referencia: string | null;
  descripcion: string | null;
  cuenta_id: string | null;
  cuenta_destino_id: string | null;
  categoria_id: string | null;
  metodo_pago: string | null;
};

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

function buildQS(
  base: Record<string, string | undefined>,
  extra: Record<string, string | undefined>
) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(base)) {
    if (v && v.trim() !== "") qs.set(k, v);
  }
  for (const [k, v] of Object.entries(extra)) {
    if (!v || v.trim() === "") qs.delete(k);
    else qs.set(k, v);
  }
  return qs.toString();
}

export default async function TransaccionesPage(props: {
  searchParams?:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: prof } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const isAdmin = prof?.role === "admin";

  const spRaw = await Promise.resolve(props.searchParams ?? {});
  const get1 = (k: string) => {
    const v = spRaw[k];
    return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
  };

  const tipo = (get1("tipo") || "TODOS").toUpperCase();
  const cuenta = get1("cuenta") || "";
  const categoria = get1("categoria") || "";
  const desde = get1("desde") || "";
  const hasta = get1("hasta") || "";
  const q = (get1("q") || "").trim();
  const page = Math.max(1, Number(get1("page") || "1") || 1);

  const pageSize = 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data: cuentasData } = await supabase
    .from("fin_cuentas")
    .select("id,nombre,tipo,moneda,activa")
    .eq("area", "IGLESIA")
    .eq("activa", true)
    .order("nombre", { ascending: true });

  const { data: categoriasData } = await supabase
    .from("fin_categorias")
    .select("id,nombre,tipo,activa,orden")
    .eq("area", "IGLESIA")
    .eq("activa", true)
    .order("orden", { ascending: true })
    .order("nombre", { ascending: true });

  const cuentas = (cuentasData ?? []) as Cuenta[];
  const categoriasArr = (categoriasData ?? []) as Categoria[];

  // Fondo Terreno: total acumulado de la cuenta "Terreno"
  const terrenoCuenta = cuentas.find(
    (c) => (c.nombre ?? "").toLowerCase().trim() === "terreno"
  );
  let fondoTerreno = 0;
  if (terrenoCuenta) {
    const { data: terrenoMovs } = await supabase
      .from("fin_movimientos")
      .select("monto,tipo")
      .eq("area", "IGLESIA")
      .eq("cuenta_id", terrenoCuenta.id);
    fondoTerreno = (terrenoMovs ?? []).reduce((acc, r) => {
      if (r.tipo === "INGRESO") return acc + (r.monto ?? 0);
      if (r.tipo === "EGRESO") return acc - (r.monto ?? 0);
      return acc;
    }, 0);
  }

  let query = supabase
    .from("fin_movimientos")
    .select(
      "id,fecha,tipo,monto,cuenta_id,cuenta_destino_id,categoria_id,metodo_pago,referencia,descripcion",
      { count: "exact" }
    )
    .eq("area", "IGLESIA");

  if (tipo !== "TODOS") query = query.eq("tipo", tipo);
  if (cuenta) query = query.eq("cuenta_id", cuenta);
  if (categoria) query = query.eq("categoria_id", categoria);
  if (desde) query = query.gte("fecha", desde);
  if (hasta) query = query.lte("fecha", hasta);
  if (q) query = query.or(`referencia.ilike.%${q}%,descripcion.ilike.%${q}%`);

  query = query.order("fecha", { ascending: false }).range(from, to);

  const { data: rowsData, error, count } = await query;
  const rows = (rowsData ?? []) as Mov[];

  const totalIngresos = rows.reduce(
    (acc, r) => acc + ((r.tipo === "INGRESO" ? r.monto : 0) ?? 0),
    0
  );
  const totalEgresos = rows.reduce(
    (acc, r) => acc + ((r.tipo === "EGRESO" ? r.monto : 0) ?? 0),
    0
  );
  const saldo = totalIngresos - totalEgresos;

  const cuentasMap = new Map(cuentas.map((c) => [c.id, c]));
  const categoriasMap = new Map(categoriasArr.map((c) => [c.id, c]));

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / pageSize));

  const baseParams: Record<string, string | undefined> = {
    tipo: tipo !== "TODOS" ? tipo : "",
    cuenta,
    categoria,
    desde,
    hasta,
    q,
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/finanzas"
            className="inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/5 p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-white">Transacciones</h1>
            <p className="text-sm text-white/60">Ingresos, egresos y transferencias.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/dashboard/reportes/finanzas"
            className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/5 hover:text-white"
          >
            Ver reportes
          </Link>

          {isAdmin && (
            <Link
              href="/dashboard/finanzas/transacciones/nueva"
              className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
            >
              Nueva transaccion
            </Link>
          )}
        </div>
      </div>

      <FiltrosTransacciones cuentas={cuentas} categorias={categoriasArr} />

      {/* KPI Cards */}
      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="text-xs text-white/60">Total ingresos (pagina)</div>
          <div className="text-xl font-semibold text-emerald-400">{fmtMoney(totalIngresos)}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="text-xs text-white/60">Total egresos (pagina)</div>
          <div className="text-xl font-semibold text-red-400">{fmtMoney(totalEgresos)}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="text-xs text-white/60">Saldo (pagina)</div>
          <div className={["text-xl font-semibold", saldo >= 0 ? "text-white" : "text-red-400"].join(" ")}>{fmtMoney(saldo)}</div>
        </div>
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
          <div className="text-xs text-amber-300/80">Fondo Terreno (acumulado)</div>
          <div className="text-xl font-semibold text-amber-300">{fmtMoney(fondoTerreno)}</div>
          {!terrenoCuenta && (
            <div className="mt-1 text-xs text-white/40">Sin cuenta Terreno</div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/20">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/10 text-white/70">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Monto</th>
                <th className="px-4 py-3">Cuenta</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3">Referencia</th>
                <th className="px-4 py-3">Descripcion</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {error && (
                <tr>
                  <td className="px-4 py-4 text-red-300" colSpan={8}>
                    Error: {error.message}
                  </td>
                </tr>
              )}

              {!error && rows.length === 0 && (
                <tr>
                  <td className="px-4 py-8 text-white/60" colSpan={8}>
                    Sin resultados.
                  </td>
                </tr>
              )}

              {rows.map((r) => {
                const cta = r.cuenta_id ? cuentasMap.get(r.cuenta_id) : null;
                const cat = r.categoria_id ? categoriasMap.get(r.categoria_id) : null;

                return (
                  <tr key={r.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                    <td className="px-4 py-3 text-white/80">{fmtDate(r.fecha)}</td>
                    <td className="px-4 py-3">
                      <span className={[
                        "text-xs font-semibold px-2 py-0.5 rounded-full",
                        r.tipo === "INGRESO" ? "bg-emerald-500/15 text-emerald-300" :
                        r.tipo === "EGRESO" ? "bg-red-500/15 text-red-300" :
                        "bg-white/10 text-white/70"
                      ].join(" ")}>
                        {r.tipo ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-white">{fmtMoney(r.monto)}</td>
                    <td className="px-4 py-3 text-white/80">
                      {cta ? `${cta.nombre} (${cta.tipo ?? "—"})` : "—"}
                    </td>
                    <td className="px-4 py-3 text-white/80">
                      {r.tipo === "TRANSFERENCIA" ? "—" : (cat?.nombre ?? "—")}
                    </td>
                    <td className="px-4 py-3 text-white/80">{r.referencia ?? "—"}</td>
                    <td className="px-4 py-3 text-white/80">{r.descripcion ?? "—"}</td>
                    <td className="px-4 py-3 text-right">
                      {isAdmin ? (
                        <div className="inline-flex gap-2">
                          <Link
                            href={`/dashboard/finanzas/transacciones/${r.id}/editar`}
                            className="inline-flex items-center rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10"
                          >
                            Editar
                          </Link>
                          <DeleteButton id={r.id} />
                        </div>
                      ) : (
                        <span className="text-xs text-white/40">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-4 py-3 text-xs text-white/60">
          <div>
            Pagina {page} de {totalPages} &middot; Total {count ?? 0}
          </div>

          <div className="flex gap-2">
            <Link
              className={[
                "rounded-lg border px-3 py-1.5",
                page <= 1
                  ? "border-white/10 bg-white/5 text-white/40 pointer-events-none"
                  : "border-white/10 bg-white/5 text-white hover:bg-white/10",
              ].join(" ")}
              href={`/dashboard/finanzas/transacciones?${buildQS(baseParams, {
                page: String(Math.max(1, page - 1)),
              })}`}
            >
              Anterior
            </Link>

            <Link
              className={[
                "rounded-lg border px-3 py-1.5",
                page >= totalPages
                  ? "border-white/10 bg-white/5 text-white/40 pointer-events-none"
                  : "border-white/10 bg-white/5 text-white hover:bg-white/10",
              ].join(" ")}
              href={`/dashboard/finanzas/transacciones?${buildQS(baseParams, {
                page: String(Math.min(totalPages, page + 1)),
              })}`}
            >
              Siguiente
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
