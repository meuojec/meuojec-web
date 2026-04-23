// app/dashboard/miembros/page.tsx
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import MembersTableClient from "./MembersTableClient";

type Miembro = {
  rut: string;
  nombres: string | null;
  apellidos: string | null;
  sexo: string | null;
  ded: string | null;
  patente: string | null;
  marca_modelo: string | null;
};

type SearchParams = {
  page?: string;
  pageSize?: string;
  q?: string;
  ded?: string;
  sexo?: string;
  sort?: string; // rut | nombre | sexo | ded | patente | marca_modelo
  dir?: string; // asc | desc
};

const DED_OPTIONS = ["Varones", "Damas", "Jovenes", "Creyentes", "Aspirantes", "__SIN__"] as const;
const SEXO_OPTIONS = ["Masculino", "Femenino", "__SIN__"] as const;

function safeDir(v: string | undefined) {
  return v === "desc" ? "desc" : "asc";
}

function safeSort(v: string | undefined) {
  const allowed = new Set(["rut", "nombre", "sexo", "ded", "patente", "marca_modelo"]);
  return allowed.has(v ?? "") ? (v as string) : "nombre";
}

function buildHref(base: {
  page: number;
  pageSize: number;
  q: string;
  ded: string;
  sexo: string;
  sort: string;
  dir: string;
}) {
  const sp = new URLSearchParams();
  sp.set("page", String(base.page));
  sp.set("pageSize", String(base.pageSize));
  if (base.q) sp.set("q", base.q);
  if (base.ded) sp.set("ded", base.ded);
  if (base.sexo) sp.set("sexo", base.sexo);
  sp.set("sort", base.sort);
  sp.set("dir", base.dir);
  return `?${sp.toString()}`;
}

export default async function MiembrosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  noStore();

  const params = await searchParams;
  const supabase = await createClient();

  const page = Math.max(1, Number(params?.page ?? 1));
  const q = (params?.q ?? "").trim();
  const ded = (params?.ded ?? "").trim();
  const sexo = (params?.sexo ?? "").trim();

  const allowedSizes = new Set([50, 100, 200, 500, 1000]);
  const req = Number(params?.pageSize ?? 500);
  const pageSize = allowedSizes.has(req) ? req : 500;

  const sort = safeSort(params?.sort);
  const dir = safeDir(params?.dir);

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("miembros")
    .select("rut,nombres,apellidos,sexo,ded,patente,marca_modelo", { count: "exact" });

  // ✅ filtros
  if (q) {
    query = query.or(`rut.ilike.%${q}%,nombres.ilike.%${q}%,apellidos.ilike.%${q}%`);
  }

  if (ded) {
    if (ded === "__SIN__") {
      // ded is null OR empty
      query = query.or("ded.is.null,ded.eq.");
    } else {
      query = query.eq("ded", ded);
    }
  }

  if (sexo) {
    if (sexo === "__SIN__") {
      query = query.or("sexo.is.null,sexo.eq.");
    } else {
      query = query.eq("sexo", sexo);
    }
  }

  // ✅ sorting
  if (sort === "nombre") {
    query = query.order("nombres", { ascending: dir === "asc", nullsFirst: false });
    query = query.order("apellidos", { ascending: dir === "asc", nullsFirst: false });
  } else {
    query = query.order(sort, { ascending: dir === "asc", nullsFirst: false });
  }

  // ✅ paginación
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    return (
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-white">Miembros</h1>
        <p className="text-red-400">Error: {error.message}</p>
      </div>
    );
  }

  const miembros = (data ?? []) as Miembro[];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const hrefPrev = buildHref({ page: Math.max(1, page - 1), pageSize, q, ded, sexo, sort, dir });
  const hrefNext = buildHref({ page: Math.min(totalPages, page + 1), pageSize, q, ded, sexo, sort, dir });

  const baseParams = { page, pageSize, q, ded, sexo, sort, dir };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-white">Miembros</h1>
          <p className="text-white/70 mt-2">
            Mostrando {miembros.length} de {total} (página {page} de {totalPages})
          </p>
        </div>

        {/* Filtros + búsqueda + tamaño (GET) */}
        <form className="flex flex-wrap items-center gap-2" method="GET">
          <input type="hidden" name="page" value="1" />
          <input type="hidden" name="sort" value={sort} />
          <input type="hidden" name="dir" value={dir} />

          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar por RUT / nombre / apellido"
            className="w-[280px] rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/20"
          />

          <select
            name="ded"
            defaultValue={ded}
            className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
            title="Filtrar por DED"
          >
            <option value="">DED: Todos</option>
            {DED_OPTIONS.map((d) => (
              <option key={d} value={d}>
                {d === "__SIN__" ? "DED: Sin DED" : `DED: ${d}`}
              </option>
            ))}
          </select>

          <select
            name="sexo"
            defaultValue={sexo}
            className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
            title="Filtrar por sexo"
          >
            <option value="">Sexo: Todos</option>
            {SEXO_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s === "__SIN__" ? "Sexo: Sin sexo" : `Sexo: ${s}`}
              </option>
            ))}
          </select>

          <select
            name="pageSize"
            defaultValue={String(pageSize)}
            className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
          >
            <option value="50">50</option>
            <option value="100">100</option>
            <option value="200">200</option>
            <option value="500">500</option>
            <option value="1000">1000</option>
          </select>

          <button className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10">
            Aplicar
          </button>

          <Link
            href={buildHref({ page: 1, pageSize, q: "", ded: "", sexo: "", sort: "nombre", dir: "asc" })}
            className="rounded-lg border border-white/10 bg-black/30 px-4 py-2 text-sm text-white/80 hover:bg-white/5"
          >
            Limpiar
          </Link>

          <Link
            href="/dashboard/miembros/nuevo"
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
          >
            + Nuevo
          </Link>
        </form>
      </div>

      {/* Tabla + bulk + export (CLIENT) */}
      <MembersTableClient
        miembros={miembros}
        total={total}
        page={page}
        totalPages={totalPages}
        pageSize={pageSize}
        q={q}
        ded={ded}
        sexo={sexo}
        sort={sort}
        dir={dir}
      />

      {/* Paginación (server links) */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-white/60">
          Página {page} de {totalPages}
        </div>

        <div className="flex gap-2">
          {page > 1 && (
            <Link
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
              href={hrefPrev}
            >
              ← Anterior
            </Link>
          )}

          {page < totalPages && (
            <Link
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
              href={hrefNext}
            >
              Siguiente →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}