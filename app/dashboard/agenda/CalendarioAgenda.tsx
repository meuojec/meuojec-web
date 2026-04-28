"use client";

import { useState } from "react";
import Link from "next/link";

type Actividad = {
  id: string;
  titulo: string;
  fecha: string;
  hora_inicio: string | null;
  tipo: string;
};

const TIPO_DOT: Record<string, string> = {
  culto:      "bg-emerald-400",
  reunion:    "bg-sky-400",
  ministerio: "bg-purple-400",
  especial:   "bg-amber-400",
  otro:       "bg-white/40",
};

const TIPO_STYLE: Record<string, string> = {
  culto:      "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  reunion:    "border-sky-500/30 bg-sky-500/10 text-sky-200",
  ministerio: "border-purple-500/30 bg-purple-500/10 text-purple-200",
  especial:   "border-amber-500/30 bg-amber-500/10 text-amber-200",
  otro:       "border-white/10 bg-white/5 text-white/50",
};

const TIPO_LABEL: Record<string, string> = {
  culto: "Culto", reunion: "Reunión", ministerio: "Ministerio", especial: "Especial", otro: "Otro",
};

const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

export default function CalendarioAgenda({ actividades }: { actividades: Actividad[] }) {
  const hoy = new Date();
  const [año, setAño] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth()); // 0-indexed
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null);

  // Construir grilla del mes
  const primerDia = new Date(año, mes, 1).getDay(); // 0=Dom
  const diasEnMes = new Date(año, mes + 1, 0).getDate();

  // Agrupar actividades por fecha "YYYY-MM-DD"
  const porFecha: Record<string, Actividad[]> = {};
  for (const a of actividades) {
    if (!porFecha[a.fecha]) porFecha[a.fecha] = [];
    porFecha[a.fecha].push(a);
  }

  function mesStr(d: number) {
    return `${año}-${String(mes + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }

  function prevMes() {
    if (mes === 0) { setMes(11); setAño(a => a - 1); }
    else setMes(m => m - 1);
    setDiaSeleccionado(null);
  }

  function nextMes() {
    if (mes === 11) { setMes(0); setAño(a => a + 1); }
    else setMes(m => m + 1);
    setDiaSeleccionado(null);
  }

  const todayStr = `${hoy.getFullYear()}-${String(hoy.getMonth()+1).padStart(2,"0")}-${String(hoy.getDate()).padStart(2,"0")}`;

  const actividadesDia = diaSeleccionado ? (porFecha[diaSeleccionado] ?? []) : [];

  return (
    <div className="space-y-4">
      {/* Cabecera de navegación */}
      <div className="flex items-center justify-between">
        <button onClick={prevMes} className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-white/60 hover:bg-white/5 transition">
          ← Anterior
        </button>
        <span className="text-base font-semibold text-white">
          {MESES[mes]} {año}
        </span>
        <button onClick={nextMes} className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-white/60 hover:bg-white/5 transition">
          Siguiente →
        </button>
      </div>

      {/* Grilla */}
      <div className="rounded-xl border border-white/10 bg-black/20 overflow-hidden">
        {/* Encabezados días */}
        <div className="grid grid-cols-7 border-b border-white/10">
          {DIAS.map(d => (
            <div key={d} className="py-2 text-center text-xs font-medium text-white/40">{d}</div>
          ))}
        </div>

        {/* Celdas */}
        <div className="grid grid-cols-7">
          {/* Espacios vacíos antes del primer día */}
          {Array.from({ length: primerDia }).map((_, i) => (
            <div key={`empty-${i}`} className="border-b border-r border-white/5 min-h-[70px]" />
          ))}

          {Array.from({ length: diasEnMes }).map((_, i) => {
            const dia = i + 1;
            const fechaStr = mesStr(dia);
            const eventos = porFecha[fechaStr] ?? [];
            const esHoy = fechaStr === todayStr;
            const seleccionado = fechaStr === diaSeleccionado;
            const col = (primerDia + i) % 7;
            const esDomingo = col === 0;

            return (
              <button
                key={dia}
                onClick={() => setDiaSeleccionado(seleccionado ? null : fechaStr)}
                className={`relative border-b border-r border-white/5 min-h-[70px] p-1.5 text-left transition hover:bg-white/5
                  ${seleccionado ? "bg-white/10" : ""}
                  ${esDomingo ? "bg-emerald-500/5" : ""}
                `}
              >
                {/* Número del día */}
                <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium
                  ${esHoy ? "bg-white text-black" : "text-white/60"}
                `}>
                  {dia}
                </span>

                {/* Puntos de eventos */}
                {eventos.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-0.5">
                    {eventos.slice(0, 3).map(ev => (
                      <span key={ev.id} className={`inline-block h-1.5 w-1.5 rounded-full ${TIPO_DOT[ev.tipo] ?? TIPO_DOT.otro}`} />
                    ))}
                    {eventos.length > 3 && <span className="text-[9px] text-white/30">+{eventos.length - 3}</span>}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(TIPO_LABEL).map(([k, label]) => (
          <div key={k} className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${TIPO_DOT[k]}`} />
            <span className="text-xs text-white/40">{label}</span>
          </div>
        ))}
      </div>

      {/* Panel del día seleccionado */}
      {diaSeleccionado && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-white">
              {new Date(diaSeleccionado + "T12:00:00").toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" })}
            </p>
            <Link
              href={`/dashboard/agenda/nuevo`}
              className="text-xs text-emerald-400 hover:underline"
            >
              + Agregar
            </Link>
          </div>

          {actividadesDia.length === 0 ? (
            <p className="text-sm text-white/30">Sin actividades este día.</p>
          ) : (
            <div className="space-y-2">
              {actividadesDia.map(ev => (
                <div key={ev.id} className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 ${TIPO_STYLE[ev.tipo] ?? TIPO_STYLE.otro}`}>
                  <div>
                    <span className="text-sm font-medium">{ev.titulo}</span>
                    {ev.hora_inicio && (
                      <span className="ml-2 text-xs opacity-70">{ev.hora_inicio.slice(0,5)}</span>
                    )}
                  </div>
                  <Link
                    href={`/dashboard/agenda/${ev.id}/editar`}
                    className="shrink-0 text-xs opacity-60 hover:opacity-100 hover:underline"
                  >
                    Editar
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
