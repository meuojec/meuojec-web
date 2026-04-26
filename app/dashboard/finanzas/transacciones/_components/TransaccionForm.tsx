"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createTransaccion, updateTransaccion, type MovimientoRow } from "../actions";

type Cuenta = { id: string; nombre: string | null; tipo: string | null; moneda: string | null };
type Categoria = { id: string; nombre: string | null; tipo: string | null; orden: number | null };

type Props =
  | { mode: "create"; cuentas: Cuenta[]; categorias: Categoria[] }
  | { mode: "edit"; movimiento: MovimientoRow; cuentas: Cuenta[]; categorias: Categoria[] };

const TIPOS = ["INGRESO", "EGRESO", "TRANSFERENCIA"] as const;
const METODOS = ["EFECTIVO", "TRANSFERENCIA", "TARJETA", "OTRO"] as const;

export default function TransaccionForm(props: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const initial = useMemo(() => {
    if (props.mode === "edit") {
      const m = props.movimiento;
      return {
        fecha: m.fecha ?? "",
        tipo: (m.tipo ?? "INGRESO").toString().toUpperCase(),
        monto: m.monto ? String(m.monto) : "",
        cuenta_id: m.cuenta_id ?? "",
        cuenta_destino_id: m.cuenta_destino_id ?? "",
        categoria_id: m.categoria_id ?? "",
        metodo_pago: (m.metodo_pago ?? "EFECTIVO").toString(),
        referencia: m.referencia ?? "",
        descripcion: m.descripcion ?? "",
      };
    }
    const today = new Date().toISOString().slice(0, 10);
    return {
      fecha: today,
      tipo: "INGRESO",
      monto: "",
      cuenta_id: "",
      cuenta_destino_id: "",
      categoria_id: "",
      metodo_pago: "EFECTIVO",
      referencia: "",
      descripcion: "",
    };
  }, [props]);

  const [fecha, setFecha] = useState(initial.fecha);
  const [tipo, setTipo] = useState(initial.tipo);
  const [monto, setMonto] = useState(initial.monto);
  const [cuentaId, setCuentaId] = useState(initial.cuenta_id);
  const [cuentaDestinoId, setCuentaDestinoId] = useState(initial.cuenta_destino_id);
  const [categoriaId, setCategoriaId] = useState(initial.categoria_id);
  const [metodoPago, setMetodoPago] = useState(initial.metodo_pago);
  const [referencia, setReferencia] = useState(initial.referencia);
  const [descripcion, setDescripcion] = useState(initial.descripcion);

  const categoriasFiltradas = useMemo(() => {
    if (tipo === "INGRESO") return props.categorias.filter(c => (c.tipo ?? "").toUpperCase() === "INGRESO");
    if (tipo === "EGRESO") return props.categorias.filter(c => (c.tipo ?? "").toUpperCase() === "EGRESO");
    return [];
  }, [tipo, props.categorias]);

  // Limpiar categoria si el tipo cambia
  useEffect(() => {
    if (tipo === "TRANSFERENCIA") {
      setCategoriaId("");
      return;
    }
    if (categoriaId && !categoriasFiltradas.some(c => c.id === categoriaId)) {
      setCategoriaId("");
    }
  }, [tipo, categoriaId, categoriasFiltradas]);

  useEffect(() => {
    if (tipo !== "TRANSFERENCIA") setCuentaDestinoId("");
  }, [tipo]);

  // Auto-seleccionar categoria "Terreno" cuando la cuenta seleccionada es "Terreno"
  useEffect(() => {
    if (!cuentaId) return;
    const cuenta = props.cuentas.find(c => c.id === cuentaId);
    if (!cuenta) return;
    const esTerreno = (cuenta.nombre ?? "").toLowerCase().trim() === "terreno";
    if (esTerreno) {
      const catTerreno = props.categorias.find(
        c => (c.nombre ?? "").toLowerCase().trim() === "terreno"
      );
      if (catTerreno) {
        setCategoriaId(catTerreno.id);
      }
    }
  }, [cuentaId, props.cuentas, props.categorias]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setOk("");

    const fd = new FormData();
    fd.set("fecha", fecha);
    fd.set("tipo", tipo);
    fd.set("monto", monto);
    fd.set("cuenta_id", cuentaId);
    fd.set("cuenta_destino_id", cuentaDestinoId);
    fd.set("categoria_id", categoriaId);
    fd.set("metodo_pago", metodoPago);
    fd.set("referencia", referencia);
    fd.set("descripcion", descripcion);

    startTransition(async () => {
      const res =
        props.mode === "create"
          ? await createTransaccion(fd)
          : await updateTransaccion(props.movimiento.id, fd);

      if (!res.ok) {
        setErr(res.error || "Error desconocido");
        return;
      }

      setOk(props.mode === "create" ? "Transaccion creada." : "Transaccion actualizada.");
      router.push("/dashboard/finanzas/transacciones");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-white/10 bg-black/20 p-4 space-y-4">
      <div className="grid gap-4 lg:grid-cols-4">
        <div>
          <label className="block text-xs font-semibold text-white/70 mb-1">Fecha *</label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-white/20"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-white/70 mb-1">Tipo *</label>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value.toUpperCase())}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-white/20"
            required
          >
            {TIPOS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-white/70 mb-1">Monto *</label>
          <input
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            inputMode="decimal"
            placeholder="10000"
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-white/20"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-white/70 mb-1">Metodo pago</label>
          <select
            value={metodoPago}
            onChange={(e) => setMetodoPago(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-white/20"
          >
            {METODOS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-2">
          <label className="block text-xs font-semibold text-white/70 mb-1">Cuenta *</label>
          <select
            value={cuentaId}
            onChange={(e) => setCuentaId(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-white/20"
            required
          >
            <option value="">Selecciona</option>
            {props.cuentas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} ({c.tipo})
              </option>
            ))}
          </select>
        </div>

        {tipo === "TRANSFERENCIA" ? (
          <div className="lg:col-span-2">
            <label className="block text-xs font-semibold text-white/70 mb-1">Cuenta destino *</label>
            <select
              value={cuentaDestinoId}
              onChange={(e) => setCuentaDestinoId(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-white/20"
              required
            >
              <option value="">Selecciona</option>
              {props.cuentas
                .filter((c) => c.id !== cuentaId)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} ({c.tipo})
                  </option>
                ))}
            </select>
          </div>
        ) : (
          <div className="lg:col-span-2">
            <label className="block text-xs font-semibold text-white/70 mb-1">
              Categoria *
              {props.cuentas.find(c => c.id === cuentaId && (c.nombre ?? "").toLowerCase().trim() === "terreno") && (
                <span className="ml-2 text-xs text-amber-400/80 font-normal">(auto-seleccionada)</span>
              )}
            </label>
            <select
              value={categoriaId}
              onChange={(e) => setCategoriaId(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-white/20"
              required
            >
              <option value="">Selecciona</option>
              {categoriasFiltradas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="lg:col-span-2">
          <label className="block text-xs font-semibold text-white/70 mb-1">Referencia</label>
          <input
            value={referencia}
            onChange={(e) => setReferencia(e.target.value)}
            placeholder="Ej: PRUEBA-1"
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-white/20"
          />
        </div>

        <div className="lg:col-span-2">
          <label className="block text-xs font-semibold text-white/70 mb-1">Descripcion</label>
          <input
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Ej: Ingreso de prueba"
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-white/20"
          />
        </div>
      </div>

      {(err || ok) && (
        <div className="rounded-xl border border-white/10 bg-black/30 p-3 text-sm">
          {err && <div className="text-red-300">{err}</div>}
          {ok && <div className="text-emerald-200">{ok}</div>}
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isPending}
            className={[
              "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold border",
              isPending
                ? "border-white/10 bg-white/5 text-white/50 cursor-not-allowed"
                : "border-emerald-500/30 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/20",
            ].join(" ")}
          >
            {props.mode === "create" ? "Guardar" : "Guardar cambios"}
          </button>

          <Link
            href="/dashboard/finanzas/transacciones"
            className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
          >
            Cancelar
          </Link>
        </div>
      </div>
    </form>
  );
}
