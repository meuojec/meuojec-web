"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { createTx, updateTx, deleteTransaccion as deleteTx } from "./actions";

type Categoria = { id: string; area: "DED" | "IGLESIA"; nombre: string };
type DedClase = { id: string; nombre: string };

type TxRow = {
  id: string;
  fecha: string;
  tipo: "INGRESO" | "EGRESO";
  area: "DED" | "IGLESIA";
  monto: number;
  descripcion: string | null;
  categoria_id: string;
  ded_clase_id: string | null;
  created_at: string;

  fin_categorias?: { nombre: string } | null;
  ded_clases?: { nombre: string } | null;
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function moneyCL(n: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(n);
}

function fmtDateCL(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
  return dt.toLocaleDateString("es-CL", { year: "numeric", month: "2-digit", day: "2-digit" });
}

export default function TransaccionesClient({
  categorias,
  clasesDED,
  initialTxs,
}: {
  categorias: Categoria[];
  clasesDED: DedClase[];
  initialTxs: TxRow[];
}) {
  const [pending, startTransition] = useTransition();

  // filtros
  const [fArea, setFArea] = useState<"" | "DED" | "IGLESIA">("");
  const [fTipo, setFTipo] = useState<"" | "INGRESO" | "EGRESO">("");
  const [fDesde, setFDesde] = useState("");
  const [fHasta, setFHasta] = useState("");

  // form (crear/editar)
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [editId, setEditId] = useState<string | null>(null);

  const [fecha, setFecha] = useState(todayISO());
  const [tipo, setTipo] = useState<"INGRESO" | "EGRESO">("INGRESO");
  const [area, setArea] = useState<"DED" | "IGLESIA">("IGLESIA");
  const [categoriaId, setCategoriaId] = useState<string>("");
  const [dedClaseId, setDedClaseId] = useState<string>("");
  const [monto, setMonto] = useState<string>("");
  const [descripcion, setDescripcion] = useState<string>("");

  const [err, setErr] = useState<string>("");
  const [ok, setOk] = useState<string>("");

  const catsByArea = useMemo(() => {
    return {
      IGLESIA: categorias.filter((c) => c.area === "IGLESIA"),
      DED: categorias.filter((c) => c.area === "DED"),
    };
  }, [categorias]);

  // ✅ Encuentra la categoría "Ofrenda DED"
  const ofrendaDedCat = useMemo(() => {
    return categorias.find((c) => c.area === "DED" && c.nombre.trim().toLowerCase() === "ofrenda ded");
  }, [categorias]);

  // ✅ Cuando cambia el área:
  // - Si DED => autoselecciona "Ofrenda DED"
  // - Si IGLESIA => si la categoría actual no es de IGLESIA, la limpia
  useEffect(() => {
    setErr("");
    setOk("");

    if (area === "DED") {
      // obligatoria: clase DED, categoría auto
      if (ofrendaDedCat?.id) {
        setCategoriaId(ofrendaDedCat.id);
      } else {
        // si por alguna razón no existe, dejamos vacío y obligará a seleccionar
        setCategoriaId("");
      }
    } else {
      // IGLESIA: la categoría debe ser del área IGLESIA
      const okCat = catsByArea.IGLESIA.some((c) => c.id === categoriaId);
      if (!okCat) setCategoriaId("");
      // en iglesia no hay clase
      setDedClaseId("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [area]);

  const categoriasDisponibles = area === "DED" ? catsByArea.DED : catsByArea.IGLESIA;

  const txs = useMemo(() => {
    return initialTxs.filter((t) => {
      if (fArea && t.area !== fArea) return false;
      if (fTipo && t.tipo !== fTipo) return false;
      if (fDesde && t.fecha < fDesde) return false;
      if (fHasta && t.fecha > fHasta) return false;
      return true;
    });
  }, [initialTxs, fArea, fTipo, fDesde, fHasta]);

  function resetForm() {
    setMode("create");
    setEditId(null);
    setFecha(todayISO());
    setTipo("INGRESO");
    setArea("IGLESIA");
    setCategoriaId("");
    setDedClaseId("");
    setMonto("");
    setDescripcion("");
    setErr("");
    setOk("");
  }

  function startEdit(row: TxRow) {
    setMode("edit");
    setEditId(row.id);
    setFecha(row.fecha);
    setTipo(row.tipo);
    setArea(row.area);
    setCategoriaId(row.categoria_id);
    setDedClaseId(row.ded_clase_id ?? "");
    setMonto(String(row.monto ?? ""));
    setDescripcion(row.descripcion ?? "");
    setErr("");
    setOk("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setOk("");

    // ✅ Validaciones: todos obligatorios menos descripción
    if (!fecha) return setErr("Falta fecha.");
    if (!tipo) return setErr("Falta tipo.");
    if (!area) return setErr("Falta área.");
    if (!categoriaId) return setErr("Selecciona categoría.");
    if (area === "DED" && !dedClaseId) return setErr("En DED debes seleccionar una clase.");

    const montoNum = Number(monto);
    if (!Number.isFinite(montoNum) || montoNum <= 0) return setErr("Monto inválido (debe ser > 0).");

    startTransition(async () => {
      try {
        if (mode === "create") {
          await createTx({
            fecha,
            tipo,
            area,
            monto: montoNum,
            categoria_id: categoriaId,
            ded_clase_id: area === "DED" ? dedClaseId : null,
            descripcion: descripcion?.trim() ? descripcion.trim() : null,
          });
          setOk("Transacción creada.");
          resetForm();
        } else {
          if (!editId) throw new Error("Falta ID para editar.");
          await updateTx({
            id: editId,
            fecha,
            tipo,
            area,
            monto: montoNum,
            categoria_id: categoriaId,
            ded_clase_id: area === "DED" ? dedClaseId : null,
            descripcion: descripcion?.trim() ? descripcion.trim() : null,
          });
          setOk("Transacción actualizada.");
          resetForm();
        }
      } catch (ex: any) {
        setErr(ex?.message ?? "Error");
      }
    });
  }

  function onDelete(id: string) {
    setErr("");
    setOk("");
    const yes = confirm("¿Eliminar esta transacción? Esta acción no se puede deshacer.");
    if (!yes) return;

    startTransition(async () => {
      try {
        await deleteTx(id);
        setOk("Transacción eliminada.");
      } catch (ex: any) {
        setErr(ex?.message ?? "Error");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xl font-semibold">Finanzas · Transacciones</h1>
          <button
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
            onClick={resetForm}
            type="button"
          >
            Nueva
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-4 grid gap-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
            <div className="md:col-span-1">
              <label className="text-xs text-white/60">Fecha *</label>
              <input
                type="date"
                required
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
              />
            </div>

            <div className="md:col-span-1">
              <label className="text-xs text-white/60">Tipo *</label>
              <select
                required
                value={tipo}
                onChange={(e) => setTipo(e.target.value as any)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
              >
                <option value="INGRESO">Ingreso</option>
                <option value="EGRESO">Egreso</option>
              </select>
            </div>

            <div className="md:col-span-1">
              <label className="text-xs text-white/60">Área *</label>
              <select
                required
                value={area}
                onChange={(e) => setArea(e.target.value as any)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
              >
                <option value="IGLESIA">Iglesia</option>
                <option value="DED">DED</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-xs text-white/60">Categoría *</label>
              <select
                required
                value={categoriaId}
                onChange={(e) => setCategoriaId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
              >
                <option value="">— seleccionar —</option>
                {categoriasDisponibles.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
              {area === "DED" && !ofrendaDedCat ? (
                <p className="mt-1 text-xs text-amber-300">
                  Falta la categoría <b>Ofrenda DED</b> en fin_categorias (área DED).
                </p>
              ) : null}
            </div>

            <div className="md:col-span-1">
              <label className="text-xs text-white/60">Monto *</label>
              <input
                required
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                placeholder="Ej: 15000"
                inputMode="numeric"
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
            {area === "DED" ? (
              <div className="md:col-span-2">
                <label className="text-xs text-white/60">Clase DED *</label>
                <select
                  required
                  value={dedClaseId}
                  onChange={(e) => setDedClaseId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
                >
                  <option value="">— seleccionar —</option>
                  {clasesDED.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="md:col-span-2" />
            )}

            <div className="md:col-span-3">
              <label className="text-xs text-white/60">Descripción (opcional)</label>
              <input
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Detalle / nota"
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
              />
            </div>

            <div className="md:col-span-1 flex items-end justify-end">
              <button
                disabled={pending}
                className="mt-6 w-full rounded-xl bg-white/10 px-4 py-2 text-sm hover:bg-white/15 disabled:opacity-60 md:w-auto"
                type="submit"
              >
                {mode === "create" ? "Guardar" : "Guardar cambios"}
              </button>
            </div>
          </div>

          {err ? <p className="text-sm text-red-300">{err}</p> : null}
          {ok ? <p className="text-sm text-emerald-300">{ok}</p> : null}
        </form>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <h2 className="text-lg font-semibold">Listado</h2>

          <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
            <div>
              <label className="text-xs text-white/60">Área</label>
              <select
                value={fArea}
                onChange={(e) => setFArea(e.target.value as any)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
              >
                <option value="">Todas</option>
                <option value="IGLESIA">Iglesia</option>
                <option value="DED">DED</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-white/60">Tipo</label>
              <select
                value={fTipo}
                onChange={(e) => setFTipo(e.target.value as any)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
              >
                <option value="">Todos</option>
                <option value="INGRESO">Ingreso</option>
                <option value="EGRESO">Egreso</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-white/60">Desde</label>
              <input
                type="date"
                value={fDesde}
                onChange={(e) => setFDesde(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-white/60">Hasta</label>
              <input
                type="date"
                value={fHasta}
                onChange={(e) => setFHasta(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
              />
            </div>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-white/60">
              <tr className="border-b border-white/10">
                <th className="px-3 py-2 text-left">Fecha</th>
                <th className="px-3 py-2 text-left">Área</th>
                <th className="px-3 py-2 text-left">Tipo</th>
                <th className="px-3 py-2 text-left">Categoría</th>
                <th className="px-3 py-2 text-left">Clase</th>
                <th className="px-3 py-2 text-right">Monto</th>
                <th className="px-3 py-2 text-left">Descripción</th>
                <th className="px-3 py-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {txs.map((t) => (
                <tr key={t.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-3 py-2">{fmtDateCL(t.fecha)}</td>
                  <td className="px-3 py-2">{t.area}</td>
                  <td className="px-3 py-2">{t.tipo}</td>
                  <td className="px-3 py-2">{t.fin_categorias?.nombre ?? "—"}</td>
                  <td className="px-3 py-2">{t.ded_clases?.nombre ?? "—"}</td>
                  <td className="px-3 py-2 text-right">{moneyCL(Number(t.monto || 0))}</td>
                  <td className="px-3 py-2">{t.descripcion ?? "—"}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="inline-flex gap-2">
                      <button
                        type="button"
                        className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 hover:bg-white/10"
                        onClick={() => startEdit(t)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 hover:bg-white/10"
                        onClick={() => onDelete(t.id)}
                        disabled={pending}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {txs.length === 0 ? (
                <tr>
                  <td className="px-3 py-8 text-center text-white/60" colSpan={8}>
                    No hay transacciones con esos filtros.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>

          <p className="mt-3 text-xs text-white/50">
            Mostrando {txs.length} de {initialTxs.length} cargadas (máx 200).
          </p>
        </div>
      </div>
    </div>
  );
}
