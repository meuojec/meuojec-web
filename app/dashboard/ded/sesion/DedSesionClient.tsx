"use client";

import { useMemo, useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { createDedDetalle, updateDedDetalle, deleteDedDetalle } from "./actions";

type DedClase = { id: string; nombre: string };

type VistaAsis = {
  fecha: string;
  ded_clase_id: string;
  miembros_asistencia: number;
};

type Detalle = {
  ded_clase_id: string;
  miembros_asistencia: number;
  visitantes: number;
  biblias: number;
  libros_cantos: number;
  dinero: number;
  notas: string | null;
  ded_clases?: { nombre: string } | null;
};

function fmtCLP(n: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(Number(n || 0));
}

export default function DedSesionClient({
  fecha,
  clases,
  vistaAsistencia,
  detalleGuardado,
}: {
  fecha: string;
  clases: DedClase[];
  vistaAsistencia: VistaAsis[];
  detalleGuardado: Detalle[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  // ✅ Fecha editable con botón Aplicar
  const [draftFecha, setDraftFecha] = useState<string>(fecha);
  useEffect(() => setDraftFecha(fecha), [fecha]);

  // ✅ Estado local para UI consistente
  const [rows, setRows] = useState<Detalle[]>(detalleGuardado ?? []);
  useEffect(() => {
    setRows(detalleGuardado ?? []);
  }, [detalleGuardado, fecha]);

  // ✅ Mapa autollenado por clase
  const vistaMap = useMemo(() => {
    const m = new Map<string, number>();
    (vistaAsistencia ?? []).forEach((v) =>
      m.set(v.ded_clase_id, Number(v.miembros_asistencia || 0))
    );
    return m;
  }, [vistaAsistencia]);

  // ✅ Total miembros AUTO (desde asistencias)
  const totalMiembrosAuto = useMemo(() => {
    let sum = 0;
    (vistaAsistencia ?? []).forEach((v) => {
      sum += Number(v.miembros_asistencia || 0);
    });
    return sum;
  }, [vistaAsistencia]);

  // ✅ Totales MANUALES (desde rows guardados)
  const totalsManual = useMemo(() => {
    return (rows ?? []).reduce(
      (acc, r) => {
        acc.visitantes += Number(r.visitantes || 0);
        acc.biblias += Number(r.biblias || 0);
        acc.libros += Number(r.libros_cantos || 0);
        acc.dinero += Number(r.dinero || 0);
        return acc;
      },
      { visitantes: 0, biblias: 0, libros: 0, dinero: 0 }
    );
  }, [rows]);

  const guardadoMap = useMemo(() => {
    const m = new Map<string, Detalle>();
    (rows ?? []).forEach((d) => m.set(d.ded_clase_id, d));
    return m;
  }, [rows]);

  // Form state
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [dedClaseId, setDedClaseId] = useState<string>("");

  const [miembros, setMiembros] = useState<number>(0);
  const [visitantes, setVisitantes] = useState<number>(0);
  const [biblias, setBiblias] = useState<number>(0);
  const [libros, setLibros] = useState<number>(0);
  const [dinero, setDinero] = useState<number>(0);
  const [notas, setNotas] = useState<string>("");

  // ✅ Al cambiar clase en CREATE, precargar miembros desde asistencias
  useEffect(() => {
    if (mode !== "create") return;
    if (!dedClaseId) return;
    const auto = vistaMap.get(dedClaseId) ?? 0;
    setMiembros(auto);
  }, [dedClaseId, mode, vistaMap]);

  function resetForm() {
    setMode("create");
    setDedClaseId("");
    setMiembros(0);
    setVisitantes(0);
    setBiblias(0);
    setLibros(0);
    setDinero(0);
    setNotas("");
    setErr("");
    setOk("");
  }

  function startEdit(d: Detalle) {
    setMode("edit");
    setDedClaseId(d.ded_clase_id);
    setMiembros(Number(d.miembros_asistencia || 0));
    setVisitantes(Number(d.visitantes || 0));
    setBiblias(Number(d.biblias || 0));
    setLibros(Number(d.libros_cantos || 0));
    setDinero(Number(d.dinero || 0));
    setNotas(d.notas ?? "");
    setErr("");
    setOk("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function validate() {
    if (!dedClaseId) return "Selecciona una clase.";
    if (miembros < 0 || visitantes < 0 || biblias < 0 || libros < 0 || dinero < 0) {
      return "No se permiten valores negativos.";
    }
    return "";
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setOk("");

    const v = validate();
    if (v) return setErr(v);

    if (mode === "create" && guardadoMap.has(dedClaseId)) {
      return setErr("Ya existe un registro para esta clase hoy. Usa Editar.");
    }

    startTransition(async () => {
      try {
        const payload = {
          ded_clase_id: dedClaseId,
          miembros_asistencia: Number(miembros || 0),
          visitantes: Number(visitantes || 0),
          biblias: Number(biblias || 0),
          libros_cantos: Number(libros || 0),
          dinero: Number(dinero || 0),
          notas: notas?.trim() ? notas.trim() : null,
        };

        if (mode === "create") {
          await createDedDetalle(fecha, payload);

          const claseNombre = clases.find((c) => c.id === dedClaseId)?.nombre ?? null;
          setRows((prev) => [
            ...prev,
            {
              ded_clase_id: dedClaseId,
              miembros_asistencia: payload.miembros_asistencia,
              visitantes: payload.visitantes,
              biblias: payload.biblias,
              libros_cantos: payload.libros_cantos,
              dinero: payload.dinero,
              notas: payload.notas ?? null,
              ded_clases: claseNombre ? { nombre: claseNombre } : null,
            },
          ]);

          setOk("Registro creado.");
        } else {
          await updateDedDetalle(fecha, payload);

          setRows((prev) =>
            prev.map((r) =>
              r.ded_clase_id === dedClaseId
                ? {
                    ...r,
                    miembros_asistencia: payload.miembros_asistencia,
                    visitantes: payload.visitantes,
                    biblias: payload.biblias,
                    libros_cantos: payload.libros_cantos,
                    dinero: payload.dinero,
                    notas: payload.notas ?? null,
                  }
                : r
            )
          );

          setOk("Cambios guardados.");
        }

        resetForm();
        router.refresh();
      } catch (ex: any) {
        setErr(ex?.message ?? "Error");
      }
    });
  }

  function onDelete(ded_clase_id: string) {
    setErr("");
    setOk("");
    if (!confirm("¿Eliminar este registro para esta fecha?")) return;

    // optimistic remove
    setRows((prev) => prev.filter((r) => r.ded_clase_id !== ded_clase_id));

    startTransition(async () => {
      try {
        await deleteDedDetalle(fecha, ded_clase_id);
        setOk("Eliminado.");
        if (dedClaseId === ded_clase_id) resetForm();
        router.refresh();
      } catch (ex: any) {
        setErr(ex?.message ?? "Error al eliminar.");
        router.refresh();
      }
    });
  }

  function applyFecha() {
    if (!draftFecha) return;
    router.push(`/dashboard/ded/sesion/${draftFecha}`);
  }

  return (
    <div className="space-y-6">
      {/* Header + KPIs */}
      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-xl font-semibold">DED · Sesión</h1>
            <p className="text-sm text-white/60">
              Miembros (arriba) = automático desde Asistencias. Visitantes/Biblias/Libros/Dinero = ingresado por usuario.
            </p>
          </div>

          <div className="flex items-end gap-2">
            <div>
              <div className="text-xs text-white/60">Fecha</div>
              <input
                type="date"
                value={draftFecha}
                onChange={(e) => setDraftFecha(e.target.value)}
                className="mt-1 cursor-pointer appearance-none rounded-xl border border-white/10 bg-black/30 px-3 py-1.5 text-sm outline-none"
              />
            </div>

            <button
              type="button"
              onClick={applyFecha}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
            >
              Aplicar
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-5">
          <div className="rounded-xl border border-white/10 bg-black/30 p-3">
            <div className="text-xs text-white/60">Miembros (auto)</div>
            <div className="text-lg font-semibold">{totalMiembrosAuto}</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/30 p-3">
            <div className="text-xs text-white/60">Visitantes</div>
            <div className="text-lg font-semibold">{totalsManual.visitantes}</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/30 p-3">
            <div className="text-xs text-white/60">Biblias</div>
            <div className="text-lg font-semibold">{totalsManual.biblias}</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/30 p-3">
            <div className="text-xs text-white/60">Libros</div>
            <div className="text-lg font-semibold">{totalsManual.libros}</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/30 p-3">
            <div className="text-xs text-white/60">Dinero</div>
            <div className="text-lg font-semibold">{fmtCLP(totalsManual.dinero)}</div>
          </div>
        </div>

        {err ? <p className="mt-3 text-sm text-red-300">{err}</p> : null}
        {ok ? <p className="mt-3 text-sm text-emerald-300">{ok}</p> : null}
      </div>

      {/* ✅ Layout 40/60 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5 lg:items-start">
        {/* Formulario 2/5 */}
        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {mode === "create" ? "Nuevo registro" : "Editar registro"}
            </h2>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
            >
              Limpiar
            </button>
          </div>

          {/* ✅ más compacto */}
          <form onSubmit={onSubmit} className="mt-3 grid gap-1.5">
            <div>
              <label className="text-xs text-white/60">Clase *</label>
              <select
                value={dedClaseId}
                onChange={(e) => setDedClaseId(e.target.value)}
                disabled={mode === "edit"}
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-1.5 text-sm outline-none disabled:opacity-70"
              >
                <option value="">— seleccionar —</option>
                {clases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>

              
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-white/60">Miembros (auto) *</label>
                <input
                  value={miembros}
                  onChange={(e) => setMiembros(Number(e.target.value))}
                  inputMode="numeric"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-1.5 text-sm outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-white/60">Visitantes *</label>
                <input
                  value={visitantes}
                  onChange={(e) => setVisitantes(Number(e.target.value))}
                  inputMode="numeric"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-1.5 text-sm outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-white/60">Biblias *</label>
                <input
                  value={biblias}
                  onChange={(e) => setBiblias(Number(e.target.value))}
                  inputMode="numeric"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-1.5 text-sm outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-white/60">Libros de cantos *</label>
                <input
                  value={libros}
                  onChange={(e) => setLibros(Number(e.target.value))}
                  inputMode="numeric"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-1.5 text-sm outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
              <div>
                <label className="text-xs text-white/60">Dinero *</label>
                <input
                  value={dinero}
                  onChange={(e) => setDinero(Number(e.target.value))}
                  inputMode="numeric"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-1.5 text-sm outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-white/60">Notas (opcional)</label>
                <input
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-1.5 text-sm outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                disabled={pending}
                className="rounded-xl bg-white/10 px-4 py-2 text-sm hover:bg-white/15 disabled:opacity-60"
                type="submit"
              >
                {mode === "create" ? "Guardar" : "Guardar cambios"}
              </button>
            </div>
          </form>
        </div>

        {/* Tabla 3/5 */}
        <div className="lg:col-span-3 rounded-2xl border border-white/10 bg-black/20 p-4">
          <h2 className="text-lg font-semibold">Ingresado hoy</h2>

          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-white/60">
                <tr className="border-b border-white/10">
                  <th className="px-3 py-2 text-left">Clase</th>
                  <th className="px-3 py-2 text-right">Miembros</th>
                  <th className="px-3 py-2 text-right">Visitantes</th>
                  <th className="px-3 py-2 text-right">Biblias</th>
                  <th className="px-3 py-2 text-right">Libros</th>
                  <th className="px-3 py-2 text-right">Dinero</th>
                  <th className="px-3 py-2 text-right">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((d) => (
                  <tr key={d.ded_clase_id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-3 py-2">{d.ded_clases?.nombre ?? "—"}</td>
                    <td className="px-3 py-2 text-right">{d.miembros_asistencia}</td>
                    <td className="px-3 py-2 text-right">{d.visitantes}</td>
                    <td className="px-3 py-2 text-right">{d.biblias}</td>
                    <td className="px-3 py-2 text-right">{d.libros_cantos}</td>
                    <td className="px-3 py-2 text-right">{fmtCLP(d.dinero)}</td>
                    <td className="px-3 py-2 text-right">
                      <div className="inline-flex gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(d)}
                          className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 hover:bg-white/10"
                          title="Editar"
                        >
                          <span className="inline-flex items-center gap-2">
                            <Pencil className="h-4 w-4" />
                            <span className="hidden xl:inline">Editar</span>
                          </span>
                        </button>

                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => onDelete(d.ded_clase_id)}
                          className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 hover:bg-white/10 disabled:opacity-60"
                          title="Eliminar"
                        >
                          <span className="inline-flex items-center gap-2">
                            <Trash2 className="h-4 w-4" />
                            <span className="hidden xl:inline">Eliminar</span>
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {rows.length === 0 ? (
                  <tr>
                    <td className="px-3 py-8 text-center text-white/60" colSpan={7}>
                      Aún no hay registros guardados para esta fecha.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          
        </div>
      </div>
    </div>
  );
}
