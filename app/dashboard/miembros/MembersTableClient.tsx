"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Miembro = {
  rut: string;
  nombres: string | null;
  apellidos: string | null;
  sexo: string | null;
  ded: string | null;
  patente: string | null;
  marca_modelo: string | null;
};

function formatNombre(nombres?: string | null, apellidos?: string | null) {
  const n = (nombres ?? "").trim();
  const a = (apellidos ?? "").trim();
  const full = `${n} ${a}`.trim();
  return full || "—";
}

function Dash() {
  return <span className="text-white/30">—</span>;
}

function buildHref(p: Record<string, string | number | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(p)) {
    if (v === undefined) continue;
    const s = String(v);
    if (s.length === 0) continue;
    sp.set(k, s);
  }
  return `?${sp.toString()}`;
}

export default function MembersTableClient(props: {
  miembros: Miembro[];
  total: number;
  page: number;
  totalPages: number;
  pageSize: number;
  q: string;
  ded: string;
  sexo: string;
  sort: string;
  dir: string;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [exportFormat, setExportFormat] = useState<"xlsx" | "csv" | "pdf">("xlsx");

  const selectedRuts = useMemo(
    () => Object.keys(selected).filter((k) => selected[k]),
    [selected]
  );

  const allOnPageSelected =
    props.miembros.length > 0 && props.miembros.every((m) => selected[m.rut]);

  function toggleAllOnPage() {
    const next = { ...selected };
    if (allOnPageSelected) {
      for (const m of props.miembros) delete next[m.rut];
    } else {
      for (const m of props.miembros) next[m.rut] = true;
    }
    setSelected(next);
  }

  function clearSelection() {
    setSelected({});
  }

  function exportSelected() {
    if (selectedRuts.length === 0) return;
    const url = `/api/miembros/export?format=${exportFormat}&ruts=${encodeURIComponent(selectedRuts.join(","))}`;
    window.location.href = url;
  }

  function exportFilteredAll() {
    const url =
      `/api/miembros/export?format=${exportFormat}&` +
      new URLSearchParams({
        q: props.q || "",
        ded: props.ded || "",
        sexo: props.sexo || "",
        sort: props.sort || "nombre",
        dir: props.dir || "asc",
      }).toString();
    window.location.href = url;
  }

  function nextDirFor(column: string) {
    if (props.sort !== column) return "asc";
    return props.dir === "asc" ? "desc" : "asc";
  }

  function sortLink(column: string) {
    return buildHref({
      page: 1,
      pageSize: props.pageSize,
      q: props.q,
      ded: props.ded,
      sexo: props.sexo,
      sort: column,
      dir: nextDirFor(column),
    });
  }

  function sortIndicator(column: string) {
    if (props.sort !== column) return "";
    return props.dir === "asc" ? " ▲" : " ▼";
  }

  function onRowClick(rut: string, e: React.MouseEvent) {
    const t = e.target as HTMLElement;
    if (t.closest("a,button,input,select,label")) return;
    router.push(`/dashboard/miembros/${encodeURIComponent(rut)}`);
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
      {/* Header tabla + bulk */}
      <div className="px-5 py-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
        <div className="font-semibold text-white">Listado</div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="text-sm text-white/60">
            Total: {props.total} — En esta página: {props.miembros.length}
          </div>

          <div className="w-px h-6 bg-white/10 mx-1" />

          <select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value as "xlsx" | "csv" | "pdf")}
            className="rounded-lg border border-white/10 bg-black/30 px-2 py-2 text-sm text-white/80 cursor-pointer"
          >
            <option value="xlsx">Excel (.xlsx)</option>
            <option value="csv">CSV</option>
            <option value="pdf">PDF</option>
          </select>

          <div className="w-px h-6 bg-white/10 mx-1" />

          <button
            type="button"
            onClick={toggleAllOnPage}
            className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/80 hover:bg-white/5"
          >
            {allOnPageSelected ? "Deseleccionar página" : "Seleccionar página"}
          </button>

          <button
            type="button"
            onClick={clearSelection}
            className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/80 hover:bg-white/5"
          >
            Limpiar selección
          </button>

          <div className="text-sm text-white/70 px-2">
            Seleccionados: <span className="font-semibold">{selectedRuts.length}</span>
          </div>

          <button
            type="button"
            disabled={selectedRuts.length === 0}
            onClick={exportSelected}
            className={[
              "rounded-lg border border-white/10 px-3 py-2 text-sm",
              selectedRuts.length === 0
                ? "bg-white/5 text-white/30 cursor-not-allowed"
                : "bg-white/10 text-white hover:bg-white/15",
            ].join(" ")}
          >
            Exportar seleccionados
          </button>

          <button
            type="button"
            onClick={exportFilteredAll}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10"
          >
            Exportar filtrado
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-auto max-h-[70vh]">
        <table className="min-w-[1100px] w-full text-sm">
          <thead className="bg-black/30 text-white/70 sticky top-0 z-10">
            <tr className="border-b border-white/10">
              <th className="px-4 py-3 w-[44px]">
                <input
                  type="checkbox"
                  checked={allOnPageSelected}
                  onChange={toggleAllOnPage}
                />
              </th>
              <th className="text-left font-medium px-4 py-3">
                <Link href={sortLink("rut")} className="hover:text-white">
                  ID / RUT{sortIndicator("rut")}
                </Link>
              </th>
              <th className="text-left font-medium px-4 py-3">
                <Link href={sortLink("nombre")} className="hover:text-white">
                  Nombre{sortIndicator("nombre")}
                </Link>
              </th>
              <th className="text-left font-medium px-4 py-3">
                <Link href={sortLink("sexo")} className="hover:text-white">
                  Sexo{sortIndicator("sexo")}
                </Link>
              </th>
              <th className="text-left font-medium px-4 py-3">
                <Link href={sortLink("ded")} className="hover:text-white">
                  DED{sortIndicator("ded")}
                </Link>
              </th>
              <th className="text-left font-medium px-4 py-3">
                <Link href={sortLink("patente")} className="hover:text-white">
                  Patente{sortIndicator("patente")}
                </Link>
              </th>
              <th className="text-left font-medium px-4 py-3">
                <Link href={sortLink("marca_modelo")} className="hover:text-white">
                  Marca/Modelo{sortIndicator("marca_modelo")}
                </Link>
              </th>
              <th className="text-right font-medium px-4 py-3">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {props.miembros.map((m) => {
              const checked = !!selected[m.rut];
              const safe = encodeURIComponent(m.rut);
              return (
                <tr
                  key={m.rut}
                  className="border-t border-white/10 hover:bg-white/5 transition cursor-pointer"
                  onClick={(e) => onRowClick(m.rut, e)}
                >
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setSelected((prev) => ({ ...prev, [m.rut]: !checked }))
                      }
                    />
                  </td>
                  <td className="px-4 py-3 text-white/90 tabular-nums">{m.rut}</td>
                  <td className="px-4 py-3 text-white">
                    {formatNombre(m.nombres, m.apellidos)}
                  </td>
                  <td className="px-4 py-3 text-white/80">{m.sexo ?? <Dash />}</td>
                  <td className="px-4 py-3 text-white/80">{m.ded ?? <Dash />}</td>
                  <td className="px-4 py-3 text-white/80">
                    {m.patente ? (
                      <span className="rounded-md border border-white/10 bg-black/30 px-2 py-1 uppercase tabular-nums">
                        {m.patente}
                      </span>
                    ) : (
                      <Dash />
                    )}
                  </td>
                  <td className="px-4 py-3 text-white/80">
                    {m.marca_modelo ?? <Dash />}
                  </td>
                  <td
                    className="px-4 py-3 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="inline-flex gap-2">
                      <Link
                        href={`/dashboard/miembros/${safe}`}
                        className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs hover:bg-white/10"
                      >
                        Ver
                      </Link>
                      <Link
                        href={`/dashboard/miembros/${safe}?edit=1`}
                        className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs hover:bg-white/10"
                      >
                        Editar
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}

            {props.miembros.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-10 text-center text-white/40"
                >
                  No se encontraron miembros con los filtros aplicados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {props.totalPages > 1 && (
        <div className="px-5 py-3 border-t border-white/10 flex items-center justify-between gap-4 text-sm text-white/60">
          <span>
            Página {props.page} de {props.totalPages}
          </span>
          <div className="flex gap-1">
            {[
              { label: "«", page: 1 },
              { label: "‹", page: props.page - 1 },
              { label: "›", page: props.page + 1 },
              { label: "»", page: props.totalPages },
            ].map(({ label, page }) => {
              const disabled =
                (label === "«" || label === "‹") && props.page === 1
                  ? true
                  : (label === "›" || label === "»") && props.page === props.totalPages
                  ? true
                  : false;
              return (
                <Link
                  key={label}
                  href={buildHref({ page, pageSize: props.pageSize, q: props.q, ded: props.ded, sexo: props.sexo, sort: props.sort, dir: props.dir })}
                  className={`rounded px-2 py-1 border border-white/10 ${
                    disabled ? "opacity-30 pointer-events-none" : "hover:bg-white/5"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
