"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { createCuenta, updateCuenta, deleteCuenta, type CuentaRow, type FinTipoCuenta } from "../actions";
import { useRouter } from "next/navigation";

type Props =
  | { mode: "create" }
  | { mode: "edit"; cuenta: CuentaRow };

const TIPOS: FinTipoCuenta[] = ["CAJA", "BANCO"];
const MONEDAS = ["CLP", "USD"];

export default function CuentaForm(props: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const initial = useMemo(() => {
    if (props.mode === "edit") {
      return {
        nombre: props.cuenta.nombre ?? "",
        tipo: (props.cuenta.tipo ?? "CAJA") as string,
        moneda: props.cuenta.moneda ?? "CLP",
      };
    }
    return { nombre: "", tipo: "CAJA", moneda: "CLP" };
  }, [props]);

  const [nombre, setNombre] = useState(initial.nombre);
  const [tipo, setTipo] = useState(initial.tipo);
  const [moneda, setMoneda] = useState(initial.moneda);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setOk("");

    const fd = new FormData();
    fd.set("nombre", nombre.trim());
    fd.set("tipo", tipo);
    fd.set("moneda", moneda);

    startTransition(async () => {
      const res =
        props.mode === "create"
          ? await createCuenta(fd)
          : await updateCuenta(props.cuenta.id, fd);

      if (!res.ok) {
        setErr(res.error || "Error desconocido");
        return;
      }

      setOk(props.mode === "create" ? "Cuenta creada." : "Cuenta actualizada.");
      router.push("/dashboard/finanzas/cuentas");
      router.refresh();
    });
  }

  function onDelete() {
    if (props.mode !== "edit") return;
    const sure = confirm(
      "Eliminar esta cuenta? Si tienes movimientos asociados, puede fallar por restriccion (FK)."
    );
    if (!sure) return;

    setErr("");
    setOk("");

    startTransition(async () => {
      const res = await deleteCuenta(props.cuenta.id);
      if (!res.ok) {
        setErr(res.error || "Error al eliminar");
        return;
      }
      router.push("/dashboard/finanzas/cuentas");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-white/10 bg-black/20 p-4 space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="sm:col-span-1">
          <label className="block text-xs font-semibold text-white/70 mb-1">Nombre *</label>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-white/20"
            placeholder="Ej: Caja General, BancoEstado..."
            required
          />
        </div>
        <div className="sm:col-span-1">
          <label className="block text-xs font-semibold text-white/70 mb-1">Tipo *</label>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-white/20"
            required
          >
            {TIPOS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-1">
          <label className="block text-xs font-semibold text-white/70 mb-1">Moneda *</label>
          <select
            value={moneda}
            onChange={(e) => setMoneda(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-white/20"
            required
          >
            {MONEDAS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-white/70">
        Area: <span className="font-semibold text-white">IGLESIA</span>
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
            className="rounded-xl border border-white/10 bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90 disabled:opacity-50"
          >
            {isPending ? "Guardando..." : props.mode === "create" ? "Crear cuenta" : "Guardar cambios"}
          </button>
          <Link
            href="/dashboard/finanzas/cuentas"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
          >
            Cancelar
          </Link>
        </div>

        {props.mode === "edit" && (
          <button
            type="button"
            onClick={onDelete}
            disabled={isPending}
            className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-300 hover:bg-red-500/20 disabled:opacity-50"
          >
            Eliminar cuenta
          </button>
        )}
      </div>
    </form>
  );
}
