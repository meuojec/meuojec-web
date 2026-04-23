"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const ESTADO_OPTIONS = [
  { value: "activo",      label: "Activo" },
  { value: "inactivo",    label: "Inactivo" },
  { value: "transferido", label: "Transferido" },
  { value: "fallecido",   label: "Fallecido" },
  { value: "excluido",    label: "Excluido" },
];

type Props = {
  initial: any;
};

export default function MemberEditForm({ initial }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [nombres,               setNombres]              = useState<string>(initial?.nombres ?? "");
  const [apellidos,             setApellidos]            = useState<string>(initial?.apellidos ?? "");
  const [estado,                setEstado]               = useState<string>(initial?.estado ?? "activo");
  const [fechaConversion,       setFechaConversion]      = useState<string>(initial?.fecha_conversion ?? "");
  const [fechaBautismoAgua,     setFechaBautismoAgua]    = useState<string>(initial?.fecha_bautismo_agua ?? "");
  const [fechaBautismoEspiritu, setFechaBautismoEspiritu]= useState<string>(initial?.fecha_bautismo_espiritu ?? "");
  const [discipuladorRut,       setDiscipuladorRut]      = useState<string>(initial?.discipulador_rut ?? "");

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase
      .from("miembros")
      .update({
        nombres,
        apellidos:               apellidos             || null,
        estado:                  estado                || null,
        fecha_conversion:        fechaConversion       || null,
        fecha_bautismo_agua:     fechaBautismoAgua     || null,
        fecha_bautismo_espiritu: fechaBautismoEspiritu || null,
        discipulador_rut:        discipuladorRut       || null,
      })
      .eq("rut", initial.rut);

    setLoading(false);

    if (error) {
      alert("Error guardando: " + error.message);
      return;
    }

    router.refresh();
    router.push(`/dashboard/miembros/${encodeURIComponent(initial.rut)}`);
  };

  const inputCls = "w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white outline-none focus:border-emerald-500/40";
  const labelCls = "text-sm text-white/70";

  return (
    <form onSubmit={onSave} className="space-y-6 rounded-2xl border border-white/10 bg-black/20 p-6">
      <h2 className="text-lg font-semibold text-white">Editar miembro</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className={labelCls}>Nombres</label>
          <input
            value={nombres}
            onChange={(e) => setNombres(e.target.value)}
            className={inputCls}
            required
          />
        </div>
        <div className="space-y-2">
          <label className={labelCls}>Apellidos</label>
          <input
            value={apellidos}
            onChange={(e) => setApellidos(e.target.value)}
            className={inputCls}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className={labelCls}>Estado</label>
        <select
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
          className={inputCls}
        >
          {ESTADO_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div>
        <div className="mb-3 text-sm font-semibold text-white/50 uppercase tracking-wider">
          Informacion espiritual
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <label className={labelCls}>Fecha de conversion</label>
            <input
              type="date"
              value={fechaConversion}
              onChange={(e) => setFechaConversion(e.target.value)}
              className={inputCls}
            />
          </div>
          <div className="space-y-2">
            <label className={labelCls}>Bautismo en agua</label>
            <input
              type="date"
              value={fechaBautismoAgua}
              onChange={(e) => setFechaBautismoAgua(e.target.value)}
              className={inputCls}
            />
          </div>
          <div className="space-y-2">
            <label className={labelCls}>Bautismo en Espiritu</label>
            <input
              type="date"
              value={fechaBautismoEspiritu}
              onChange={(e) => setFechaBautismoEspiritu(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className={labelCls}>RUT discipulador</label>
        <input
          value={discipuladorRut}
          onChange={(e) => setDiscipuladorRut(e.target.value)}
          placeholder="Ej: 12.345.678-9"
          className={inputCls}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl border border-emerald-500/30 bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/20 transition disabled:opacity-50"
        >
          {loading ? "Guardando..." : "Guardar cambios"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/70 hover:bg-white/10 transition"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
