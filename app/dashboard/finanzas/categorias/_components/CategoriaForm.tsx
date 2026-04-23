"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createCategoria,
  updateCategoria,
  deleteCategoria,
  type CategoriaRow,
  type FinTipoCategoria,
} from "../actions";

type Props =
  | { mode: "create" }
  | { mode: "edit"; categoria: CategoriaRow };

const TIPOS: FinTipoCategoria[] = ["INGRESO", "EGRESO"];

export default function CategoriaForm(props: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const initial = useMemo(() => {
    if (props.mode === "edit") {
      return {
        nombre: props.categoria.nombre ?? "",
        tipo: (props.categoria.tipo ?? "INGRESO") as string,
        tipo_default: props.categoria.tipo_default ?? "",
        orden: String(props.categoria.orden ?? 0),
      };
    }
    return { nombre: "", tipo: "INGRESO", tipo_default: "INGRESO", orden: "0" };
  }, [props]);

  const [nombre, setNombre] = useState(initial.nombre);
  const [tipo, setTipo] = useState(initial.tipo);
  const [tipoDefault, setTipoDefault] = useState(initial.tipo_default);
  const [orden, setOrden] = useState(initial.orden);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setOk("");

    const fd = new FormData();
    fd.set("nombre", nombre.trim());
    fd.set("tipo", tipo);
    fd.set("tipo_default", tipoDefault);
    fd.set("orden", orden);

    startTransition(async () => {
      const res =
        props.mode === "create"
          ? await createCategoria(fd)
          : await updateCategoria(props.categoria.id, fd);

      if (!res.ok) {
        setErr(res.error || "Error desconocido");
        return;
      }

      setOk(props.mode === "create" ? "Categoría creada." : "Categoría actualizada.");
      router.push("/dashboard/finanzas/categorias");
      router.refresh();
    });
  }

  function onDelete() {
    if (props.mode !== "edit") return;
    const sure = confirm(
      "¿Eliminar esta categoría?\n\nSi tienes transacciones asociadas, puede fallar por restricción (FK)."
    );
    if (!sure) return;

    setErr("");
    setOk("");

    startTransition(async () => {
      const res = await deleteCategoria(props.categoria.id);
      if (!res.ok) {
        setErr(res.error || "Error al eliminar");
        return;
      }
      router.push("/dashboard/finanzas/categorias");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-white/10 bg-black/20 p-4 space-y-4">
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-white/70 mb-1">Nombre *</label>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-white/20"
            placeholder="Ej: Ofrendas, Diezmos, Gasto General..."
            required
          />
        </div>

        <div className="sm:col-span-1">
          <label className="block text-xs font-semibold text-white/70 mb-1">Tipo *</label>
          <select
            value={tipo}
            onChange={(e) => {
              setTipo(e.target.value);
              // si el usuario no tocó tipoDefault, lo alineamos
              if (!tipoDefault) setTipoDefault(e.target.value);
            }}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-white/20"
            required
          >
            {TIPOS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-1">
          <label className="block text-xs font-semibold text-white/70 mb-1">Orden</label>
          <input
            value={orden}
            onChange={(e) => setOrden(e.target.value)}
            type="number"
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-white/20"
            placeholder="0"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-white/70 mb-1">Tipo default</label>
          <select
            value={tipoDefault}
            onChange={(e) => setTipoDefault(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-white/20"
          >
            <option value="">(NULL)</option>
            {TIPOS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <p className="mt-1 text-xs text-white/50">
            En tu tabla puede ser NULL (como “Gasto General”). Si no lo necesitas, déjalo en (NULL).
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-white/70">
        Área: <span className="font-semibold text-white">IGLESIA</span>
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
            href="/dashboard/finanzas/categorias"
            className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
          >
            Cancelar
          </Link>
        </div>

        {props.mode === "edit" && (
          <button
            type="button"
            onClick={onDelete}
            disabled={isPending}
            className={[
              "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold border",
              isPending
                ? "border-white/10 bg-white/5 text-white/50 cursor-not-allowed"
                : "border-red-500/30 bg-red-500/10 text-red-200 hover:bg-red-500/20",
            ].join(" ")}
          >
            Eliminar
          </button>
        )}
      </div>
    </form>
  );
}
