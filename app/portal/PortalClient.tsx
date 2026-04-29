"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { consultarPortal, type PortalData } from "./actions";

function formatRut(v: string) {
  const clean = v.replace(/[^0-9kK]/g, "").toUpperCase();
  if (clean.length < 2) return clean;
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  return `${body}-${dv}`;
}

function hhmmFromTime(t?: string | null) {
  if (!t) return "";
  return t.slice(0, 5);
}

function fmtFecha(iso: string) {
  const [y, m, d] = iso.split("-");
  const meses = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  return `${d} ${meses[parseInt(m)-1]} ${y}`;
}

export default function PortalClient() {
  const [data, setData] = useState<PortalData | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const [rut, setRut] = useState("");

  function handleRutChange(e: React.ChangeEvent<HTMLInputElement>) {
    setRut(formatRut(e.target.value));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    fd.set("rut", rut);
    startTransition(async () => {
      const res = await consultarPortal(fd);
      if (res.ok) setData(res.data);
      else setError(res.error);
    });
  }

  if (data) {
    const m = data.miembro;
    const nombre = [m.nombres, m.apellidos].filter(Boolean).join(" ") || "—";

    return (
      <div className="max-w-2xl mx-auto space-y-5">

        {/* 1. Header perfil */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 flex items-center gap-5">
          {m.foto_url ? (
            <Image src={m.foto_url} alt={nombre} width={72} height={72}
              className="rounded-full object-cover shrink-0 border-2 border-white/20" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-white/10 shrink-0 flex items-center justify-center text-2xl font-bold text-white/50">
              {(m.nombres ?? "?")[0]?.toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            <div className="text-xl font-bold text-white">{nombre}</div>
            <div className="text-sm text-white/50">RUT: {m.rut}</div>
            {m.ded && <div className="text-xs text-white/40">DED: {m.ded}</div>}
          </div>
          <button onClick={() => setData(null)}
            className="text-xs text-white/30 hover:text-white/60 transition">
            Cerrar sesion
          </button>
        </div>

        {/* 2. Mis datos — tarjeta separada debajo del nombre */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3">
          <div className="font-semibold text-white/80 text-sm">Mis datos</div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            {([
              ["Correo", m.correo_electronico],
              ["Telefono", m.telefono],
              ["Direccion", m.direccion ? `${m.direccion}${m.comuna ? ", " + m.comuna : ""}` : null],
              ["Nacimiento", m.fecha_nacimiento ? fmtFecha(m.fecha_nacimiento) : null],
              ["Sexo", m.sexo],
              ["Membresia", m.estado_membresia],
            ] as [string, string | null][]).filter(([, v]) => !!v).map(([label, value]) => (
              <div key={label}>
                <div className="text-xs text-white/40">{label}</div>
                <div className="text-white/80">{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
            <div className="text-2xl font-bold text-emerald-400">{data.totalAno}</div>
            <div className="text-xs text-white/50 mt-1">Asistencias este ano</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{data.totalMes}</div>
            <div className="text-xs text-white/50 mt-1">Este mes</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
            <div className="text-2xl font-bold text-violet-400">{data.eventosUnicos}</div>
            <div className="text-xs text-white/50 mt-1">Eventos distintos</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
            <div className="text-base font-bold text-white/80 mt-1">{m.estado_membresia ?? "—"}</div>
            <div className="text-xs text-white/50 mt-1">Membresia</div>
          </div>
        </div>

        {/* 4. Asistencias por evento */}
        {data.porEvento.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10 font-semibold text-sm">
              Asistencias por evento ({new Date().getFullYear()})
            </div>
            <div className="divide-y divide-white/5">
              {data.porEvento.map((e, i) => {
                const pct = data.totalAno > 0 ? Math.round((e.total / data.totalAno) * 100) : 0;
                return (
                  <div key={i} className="px-5 py-3 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white/90 truncate">{e.evento}</div>
                      <div className="mt-1.5 h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full rounded-full bg-emerald-500/70" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-white/70 tabular-nums shrink-0">
                      {e.total}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 5. Historial completo */}
        <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10 font-semibold text-sm">
            Historial de asistencias ({new Date().getFullYear()})
          </div>
          {data.asistencias.length === 0 ? (
            <div className="px-5 py-8 text-sm text-white/40 text-center">
              Sin asistencias registradas este ano.
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {data.asistencias.map((a, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <div className="text-sm text-white">{fmtFecha(a.fecha)}</div>
                    <div className="text-xs text-white/40">{a.evento}</div>
                  </div>
                  {a.hora && (
                    <div className="text-xs text-white/40">{hhmmFromTime(a.hora)}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-white/20">MEUOJEC · Portal del Miembro</p>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto">
      <div className="text-center mb-8">
        <Image src="/logo-iglesia.png" alt="MEUOJEC" width={72} height={72}
          className="mx-auto rounded-xl mb-4" />
        <h1 className="text-2xl font-bold text-white">Portal del Miembro</h1>
        <p className="mt-2 text-white/50 text-sm">Consulta tu asistencia y datos personales</p>
      </div>

      <form onSubmit={handleSubmit}
        className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-6 space-y-5">
        <div className="space-y-1.5">
          <label className="text-sm text-white/70">RUT</label>
          <input value={rut} onChange={handleRutChange} name="rut_display"
            placeholder="12345678-9" maxLength={10} required
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition" />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm text-white/70">Fecha de nacimiento</label>
          <input name="fecha_nacimiento" type="date" required
            className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-white/30 transition" />
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <button type="submit" disabled={pending}
          className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 px-4 py-3 text-sm font-semibold text-white transition">
          {pending ? "Verificando..." : "Consultar mis datos"}
        </button>
      </form>

      <p className="text-center text-xs text-white/20 mt-6">
        Solo tu puedes ver tu informacion
      </p>
    </div>
  );
}
