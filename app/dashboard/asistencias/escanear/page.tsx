"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { validateManualPin } from "./actions";

type Html5QrcodeType = any;

function normalizeRut(input: string) {
  let s = (input || "").trim().toUpperCase();
  s = s.replace(/\s+/g, "").replace(/\./g, "");
  s = s.replace(/[^0-9K-]/g, "");

  if (s.includes("-")) {
    const [num, dv] = s.split("-");
    if (!num || !dv) return s;
    return `${num}-${dv}`;
  }
  if (s.length >= 2) {
    const num = s.slice(0, -1);
    const dv = s.slice(-1);
    return `${num}-${dv}`;
  }
  return s;
}

function formatTimeCL(d: Date) {
  return d.toLocaleTimeString("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function todayISO_CL() {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Santiago" }).format(new Date());
}

function beep(type: "ok" | "error") {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioCtx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();

    o.type = "sine";
    o.frequency.value = type === "ok" ? 880 : 220;
    g.gain.value = 0.04;

    o.connect(g);
    g.connect(ctx.destination);

    o.start();
    setTimeout(() => {
      o.stop();
      ctx.close();
    }, type === "ok" ? 120 : 220);
  } catch {}
}


type ActiveEventApi = {
  evento: null | {
    id: string;
    id_evento: string | null;
    nombre: string | null;
    activated_at: string | null;
  };
  sesion: null | {
    id: string; // evento_sesion_id
    evento_id: string;
    activo: boolean | null;
    started_at: string | null;
    ended_at: string | null;
  };
};

type RpcDomingoResult = {
  ok: boolean;
  code: string;
  message: string | null;
  asistencia_id?: string | null;
  nombres?: string | null;
  apellidos?: string | null;
};

export default function EscanearAsistencia() {
  const supabase = createClient();

  const scannerDivId = useMemo(() => "qr-reader", []);
  const qrRef = useRef<Html5QrcodeType | null>(null);
  const lastRutRef = useRef<string>("");
  const busyRef = useRef(false);

  // Evento/sesión activa
  const [eventoNombre, setEventoNombre] = useState<string | null>(null);
  const [eventoId, setEventoId] = useState<string | null>(null);
  const [eventoSesionId, setEventoSesionId] = useState<string | null>(null);

  // UI
  const [isScanning, setIsScanning] = useState(true);
  const [now, setNow] = useState<Date>(new Date());
  const [count, setCount] = useState<number>(0);

  // Semáforo
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [statusTitle, setStatusTitle] = useState<string>("Listo para escanear");
  const [statusSubtitle, setStatusSubtitle] = useState<string>("");

  // Manual protegido
  const [manualEnabled, setManualEnabled] = useState(false);
  const [manualRut, setManualRut] = useState("");
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 250);
    return () => clearInterval(t);
  }, []);

  const setSemaforo = (kind: "success" | "error" | "idle", title: string, subtitle = "") => {
    setStatus(kind);
    setStatusTitle(title);
    setStatusSubtitle(subtitle);
  };

  // 🔥 B3: trae evento + sesión activa (si existe)
  const refreshActiveSession = async () => {
    try {
      const res = await fetch("/api/eventos/active", { cache: "no-store" });
      const json = (await res.json()) as ActiveEventApi;

      if (!res.ok || !json.evento) {
        setEventoNombre(null);
        setEventoId(null);
        setEventoSesionId(null);
        return;
      }

      setEventoNombre(json.evento.nombre ?? "—");
      setEventoId(json.evento.id);
      setEventoSesionId(json.sesion?.id ?? null); // 👈 lo importante
    } catch {
      setEventoNombre(null);
      setEventoId(null);
      setEventoSesionId(null);
    }
  };

  useEffect(() => {
    refreshActiveSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Contador realtime:
  // - con sesión: fecha=hoy + evento_sesion_id = sesion
  // - sin sesión: fecha=hoy + evento_sesion_id IS NULL
  useEffect(() => {
    const today = todayISO_CL();
    let cancelled = false;

    const loadInitialCount = async () => {
      const base = supabase
        .from("asistencias")
        .select("*", { count: "exact", head: true })
        .eq("fecha", today);

      const q = eventoSesionId ? base.eq("evento_sesion_id", eventoSesionId) : base.is("evento_sesion_id", null);

      const { count: c, error } = await q;
      if (!cancelled) setCount(error ? 0 : c ?? 0);
    };

    loadInitialCount();

    // realtime sin filtro IS NULL server-side => filtramos en cliente
    const channel = supabase
      .channel(`asistencias-count-${eventoSesionId ?? "nosession"}-${today}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "asistencias" },
        (payload) => {
          const row: any = payload.new;
          const rowFecha = row?.fecha ? String(row.fecha).slice(0, 10) : null;
          if (rowFecha !== today) return;

          const rowSesion = row?.evento_sesion_id ?? null;

          if (eventoSesionId) {
            if (rowSesion === eventoSesionId) setCount((p) => p + 1);
          } else {
            if (rowSesion === null) setCount((p) => p + 1);
          }
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [eventoSesionId, supabase]);

  // ✅ Registrar usando registrar_asistencia_domingo(p_rut, p_evento_sesion_id)
  const registrarRut = async (rutRaw: string) => {
    const rut = normalizeRut(rutRaw);
    if (!rut) return;

    if (busyRef.current) return;
    busyRef.current = true;

    try {
      const { data, error } = await supabase.rpc("registrar_asistencia_domingo", {
        p_rut: rut,
        p_evento_sesion_id: eventoSesionId ?? null, // 👈 clave
      });

      if (error) {
        setSemaforo("error", "ERROR", error.message);
        beep("error");
      } else {
        const res = (data ?? null) as RpcDomingoResult | null;

        if (!res) {
          setSemaforo("error", "ERROR", "Sin respuesta del servidor");
          beep("error");
        } else if (!res.ok) {
          setSemaforo("error", "NO REGISTRADO", res.message ?? "No se pudo registrar");
          beep("error");
        } else {
          const fullName = [res.nombres, res.apellidos].filter(Boolean).join(" ").trim() || rut;

          if (String(res.code).toUpperCase() === "ALREADY") {
            setSemaforo("error", "YA REGISTRADO", fullName);
            beep("error");
          } else {
            setSemaforo("success", "✅ REGISTRADO", fullName);
            beep("ok");
          }
        }
      }
    } catch (e: any) {
      setSemaforo("error", "ERROR", e?.message ?? "Error registrando asistencia");
      beep("error");
    }

    setTimeout(() => setSemaforo("idle", "Listo para escanear", ""), 1800);
    setTimeout(() => (busyRef.current = false), 700);
  };

  // Cámara start/stop
  useEffect(() => {
    let cancelled = false;

    const start = async () => {
      if (!isScanning) return;

      const mod = await import("html5-qrcode");
      if (cancelled) return;

      const { Html5Qrcode } = mod;

      if (!qrRef.current) qrRef.current = new Html5Qrcode(scannerDivId);
      const html5Qr = qrRef.current;

      try {
        await html5Qr.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 300, height: 300 } },
          async (decodedText: string) => {
            const rut = normalizeRut(decodedText);
            if (!rut) return;

            if (rut === lastRutRef.current) return;
            lastRutRef.current = rut;

            await registrarRut(rut);

            setTimeout(() => {
              lastRutRef.current = "";
            }, 2500);
          },
          () => {}
        );
      } catch {
        setSemaforo("error", "CÁMARA BLOQUEADA", "Permite cámara en el navegador / usa HTTPS");
        beep("error");
      }
    };

    const stop = async () => {
      const html5Qr = qrRef.current;
      if (!html5Qr) return;
      try {
        await html5Qr.stop();
        await html5Qr.clear();
      } catch {}
    };

    if (isScanning) start();
    else stop();

    return () => {
      cancelled = true;
      stop();
    };
  }, [isScanning, scannerDivId]);

  const bgClass =
    status === "success" ? "bg-green-600" : status === "error" ? "bg-red-600" : "bg-slate-900";

  const openManualPin = () => {
    setPinError(null);
    setPinInput("");
    setPinModalOpen(true);
  };

  const confirmPin = async () => {
    setPinError(null);
    try {
      const ok = await validateManualPin(pinInput);
      if (ok) {
        setManualEnabled(true);
        setPinModalOpen(false);
        setPinInput("");
        setSemaforo("idle", "Listo para escanear", "");
      } else {
        setPinError("Contraseña incorrecta.");
      }
    } catch {
      setPinError("Error al validar. Intenta nuevamente.");
    }
  };

  const lockManual = () => {
    setManualEnabled(false);
    setManualRut("");
    setPinModalOpen(false);
    setPinInput("");
    setPinError(null);
  };

  return (
    <div className={`${bgClass} min-h-[calc(100vh-0px)] text-white`}>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <div className="text-sm opacity-90">Evento activo</div>
            <div className="text-2xl md:text-3xl font-bold">
              {eventoNombre
                ? eventoSesionId
                  ? eventoNombre
                  : `${eventoNombre} (SIN SESIÓN ACTIVA: registrará sin sesión)`
                : "SIN EVENTO ACTIVO (registrará sin sesión)"}
            </div>
          </div>

          <div className="flex gap-4 items-end">
            <div className="flex flex-col items-end">
              <div className="text-sm opacity-90 w-full text-left md:text-left">Hora</div>
              <div className="text-3xl md:text-5xl font-extrabold tabular-nums">{formatTimeCL(now)}</div>
            </div>

            <div className="text-right">
              <div className="text-sm opacity-90">Asistentes (hoy)</div>
              <div className="text-3xl md:text-5xl font-extrabold tabular-nums">{count}</div>
            </div>
          </div>
        </div>

        {/* Semáforo */}
        <div className="rounded-2xl border border-white/20 bg-black/20 p-6 md:p-10">
          <div className="text-center">
            <div className="text-4xl md:text-7xl font-black tracking-tight">{statusTitle}</div>
            {statusSubtitle ? (
              <div className="mt-3 text-2xl md:text-5xl font-bold opacity-95">{statusSubtitle}</div>
            ) : (
              <div className="mt-3 text-lg md:text-2xl opacity-80">Escanea el QR del RUT (ej: 25806136-5)</div>
            )}
          </div>
        </div>

        {/* Paneles */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Cámara */}
          <div className="rounded-2xl border border-white/20 bg-black/20 p-4">
            <div className="flex items-center justify-between">
              <div className="font-semibold">Cámara</div>
              <button
                onClick={() => setIsScanning((v) => !v)}
                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20"
              >
                {isScanning ? "Pausar" : "Activar"}
              </button>
            </div>

            {isScanning ? (
              <div className="mt-4 rounded-xl bg-black/30 p-3">
                <div id={scannerDivId} style={{ minHeight: 340 }} />
                <div className="mt-2 text-xs opacity-80">
                  Si no aparece la cámara: permite permisos del navegador. En producción debe ser HTTPS.
                </div>
              </div>
            ) : (
              <div className="mt-4 text-sm opacity-80">Cámara pausada.</div>
            )}

            <div className="mt-4 flex gap-2">
              <button
                onClick={refreshActiveSession}
                className="flex-1 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20"
              >
                Actualizar evento/sesión
              </button>
              <button
                onClick={() => setSemaforo("idle", "Listo para escanear", "")}
                className="flex-1 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20"
              >
                Limpiar pantalla
              </button>
            </div>
          </div>

          {/* Manual */}
          <div className="rounded-2xl border border-white/20 bg-black/20 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-semibold">Modo manual</div>

              {manualEnabled ? (
                <button onClick={lockManual} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20">
                  Bloquear manual
                </button>
              ) : (
                <button onClick={openManualPin} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20">
                  Habilitar manual
                </button>
              )}
            </div>

            {!manualEnabled ? (
              <div className="text-sm opacity-80">Manual bloqueado. Úsalo solo para casos especiales (requiere contraseña).</div>
            ) : (
              <>
                <input
                  value={manualRut}
                  onChange={(e) => setManualRut(e.target.value)}
                  placeholder="Ej: 12345678-9"
                  className="w-full rounded-lg p-3 text-lg text-white bg-black/30 border border-white/15 outline-none focus:border-white/30"
                />
                <button
                  onClick={async () => {
                    await registrarRut(manualRut);
                    setManualRut("");
                  }}
                  className="w-full bg-white text-black p-3 rounded-lg font-semibold hover:bg-gray-100"
                >
                  Registrar
                </button>

                <div className="text-xs opacity-80">Manual habilitado (recuerda bloquearlo cuando termines).</div>
              </>
            )}
          </div>
        </div>

        {/* Modal PIN */}
        {pinModalOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-white/20 p-5 space-y-4">
              <div className="text-lg font-bold">Ingresar contraseña (Modo manual)</div>

              <input
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                type="password"
                autoFocus
                className="w-full rounded-lg p-3 text-white text-lg bg-black/30 border border-white/15 outline-none focus:border-white/30"
                placeholder="PIN"
                onKeyDown={(e) => {
                  if (e.key === "Enter") confirmPin();
                  if (e.key === "Escape") setPinModalOpen(false);
                }}
              />

              {pinError && <div className="text-sm text-red-300">{pinError}</div>}

              <div className="flex gap-2">
                <button onClick={() => setPinModalOpen(false)} className="flex-1 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20">
                  Cancelar
                </button>
                <button onClick={confirmPin} className="flex-1 px-4 py-2 rounded-lg bg-white text-black font-semibold hover:bg-gray-100">
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
