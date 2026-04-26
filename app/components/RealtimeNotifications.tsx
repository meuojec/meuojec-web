"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Bell, ClipboardList, CalendarDays, X } from "lucide-react";

type Notif = {
  id: string;
  tipo: "asistencia" | "evento";
  titulo: string;
  detalle: string;
  ts: number;
};

function timeAgo(ts: number) {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return "Ahora mismo";
  if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`;
  return `Hace ${Math.floor(diff / 86400)} d`;
}

export default function RealtimeNotifications() {
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Cargar eventos proximos al montar
  useEffect(() => {
    async function loadEventosProximos() {
      const hoy = new Date().toISOString().slice(0, 10);
      const en7dias = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

      const { data } = await supabase
        .from("eventos")
        .select("id_evento, nombre, fecha_evento, hora_evento")
        .eq("activo", true)
        .gte("fecha_evento", hoy)
        .lte("fecha_evento", en7dias)
        .order("fecha_evento", { ascending: true })
        .limit(5);

      if (!data?.length) return;

      const nuevas: Notif[] = data.map((e) => ({
        id: `ev-${e.id_evento}`,
        tipo: "evento",
        titulo: e.nombre ?? "Evento proximo",
        detalle: e.fecha_evento
          ? `${e.fecha_evento}${e.hora_evento ? " " + String(e.hora_evento).slice(0, 5) : ""}`
          : "Sin fecha",
        ts: Date.now(),
      }));

      setNotifs((prev) => {
        const existingIds = new Set(prev.map((n) => n.id));
        const nuevasFiltradas = nuevas.filter((n) => !existingIds.has(n.id));
        return [...nuevasFiltradas, ...prev];
      });
    }

    loadEventosProximos();
  }, []);

  // Suscribir a nuevas asistencias en tiempo real
  useEffect(() => {
    const channel = supabase
      .channel("notif-asistencias")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "asistencias" },
        (payload) => {
          const row = payload.new as {
            rut?: string;
            nombre_visitante?: string;
            created_at?: string;
          };

          const nombre = row.nombre_visitante || row.rut || "Persona";
          const notif: Notif = {
            id: `asist-${Date.now()}-${Math.random()}`,
            tipo: "asistencia",
            titulo: "Nueva asistencia registrada",
            detalle: nombre,
            ts: Date.now(),
          };

          setNotifs((prev) => [notif, ...prev].slice(0, 20));
          setUnread((n) => n + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Cerrar panel al click fuera
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  function togglePanel() {
    setOpen((o) => !o);
    if (!open) setUnread(0);
  }

  function clearAll() {
    setNotifs([]);
    setUnread(0);
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* Campana */}
      <button
        onClick={togglePanel}
        title="Notificaciones"
        className="relative flex items-center justify-center w-8 h-8 rounded-lg border border-white/10 hover:bg-white/5 transition shrink-0"
        aria-label="Notificaciones"
      >
        <Bell className="h-4 w-4 text-white/70" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white leading-none">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* Panel de notificaciones */}
      {open && (
        <div className="absolute right-0 top-10 z-50 w-80 rounded-2xl border border-white/10 bg-[#111] shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <span className="text-sm font-semibold text-white">Notificaciones</span>
            <div className="flex items-center gap-2">
              {notifs.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-xs text-white/40 hover:text-white/70 transition"
                >
                  Limpiar
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="text-white/40 hover:text-white/70"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifs.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-white/40">
                Sin notificaciones
              </div>
            ) : (
              notifs.map((n) => (
                <div
                  key={n.id}
                  className="flex items-start gap-3 px-4 py-3 border-b border-white/5 hover:bg-white/[0.03] transition"
                >
                  <div className={[
                    "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                    n.tipo === "asistencia"
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "bg-sky-500/15 text-sky-400",
                  ].join(" ")}>
                    {n.tipo === "asistencia"
                      ? <ClipboardList className="h-3.5 w-3.5" />
                      : <CalendarDays className="h-3.5 w-3.5" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-white truncate">{n.titulo}</div>
                    <div className="text-xs text-white/50 truncate mt-0.5">{n.detalle}</div>
                    <div className="text-[10px] text-white/30 mt-1">{timeAgo(n.ts)}</div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="px-4 py-2 border-t border-white/5 text-[10px] text-white/25 text-center">
            Actualizado en tiempo real via Supabase
          </div>
        </div>
      )}
    </div>
  );
}
