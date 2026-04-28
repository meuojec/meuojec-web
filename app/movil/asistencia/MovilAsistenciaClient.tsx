"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { QrCode, Search, ChevronLeft, RefreshCw } from "lucide-react";

/* ─── helpers ─── */
function normalizeRut(input: string) {
  let s = (input || "").trim().toUpperCase().replace(/\s+/g, "").replace(/\./g, "").replace(/[^0-9K-]/g, "");
  if (s.includes("-")) return s;
  if (s.length >= 2) return `${s.slice(0, -1)}-${s.slice(-1)}`;
  return s;
}

function todayISO_CL() {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Santiago" }).format(new Date());
}

function fmtTime(d: Date) {
  return d.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
}

function beep(type: "ok" | "warn" | "err") {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = type === "ok" ? 880 : type === "warn" ? 520 : 220;
    g.gain.value = 0.05;
    o.connect(g); g.connect(ctx.destination);
    o.start();
    setTimeout(() => { o.stop(); ctx.close(); }, type === "ok" ? 100 : 200);
  } catch {}
}

type Resultado = { ok: boolean; code: string; message: string | null; nombres?: string | null; apellidos?: string | null };
type ActiveEventApi = { evento: { id: string; nombre: string | null } | null; sesion: { id: string } | null };
type MiembroMatch = { rut: string; nombres: string | null; apellidos: string | null };

/* ─── component ─── */
export default function MovilAsistenciaClient() {
  const supabase = createClient();
  const qrDivId = useMemo(() => "movil-qr-reader", []);
  const qrRef = useRef<any>(null);
  const lastRutRef = useRef("");
  const busyRef = useRef(false);

  const [modo, setModo] = useState<"qr" | "buscar">("qr");
  const [now, setNow] = useState(new Date());
  const [count, setCount] = useState(0);

  const [eventoNombre, setEventoNombre] = useState<string | null>(null);
  const [eventoSesionId, setEventoSesionId] = useState<string | null>(null);

  // QR feedback
  const [feedback, setFeedback] = useState<{ tipo: "ok" | "ya" | "err" | "idle"; titulo: string; sub: string }>({
    tipo: "idle", titulo: "Listo", sub: "Apunta la cámara al QR del carnet",
  });

  // Búsqueda manual
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState<MiembroMatch[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [registrando, setRegistrando] = useState<string | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── reloj ── */
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  /* ── evento activo ── */
  const refreshEvento = useCallback(async () => {
    try {
      const res = await fetch("/api/eventos/active", { cache: "no-store" });
      const json = (await res.json()) as ActiveEventApi;
      setEventoNombre(json.evento?.nombre ?? null);
      setEventoSesionId(json.sesion?.id ?? null);
    } catch {
      setEventoNombre(null);
      setEventoSesionId(null);
    }
  }, []);

  useEffect(() => { refreshEvento(); }, [refreshEvento]);

  /* ── contador ── */
  useEffect(() => {
    const today = todayISO_CL();
    let cancelled = false;

    const load = async () => {
      const base = supabase.from("asistencias").select("*", { count: "exact", head: true }).eq("fecha", today);
      const q = eventoSesionId ? base.eq("evento_sesion_id", eventoSesionId) : base.is("evento_sesion_id", null);
      const { count: c } = await q;
      if (!cancelled) setCount(c ?? 0);
    };
    load();

    const ch = supabase.channel(`movil-count-${eventoSesionId ?? "none"}-${today}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "asistencias" }, (payload) => {
        const row: any = payload.new;
        if ((row?.fecha ?? "").slice(0, 10) !== today) return;
        const rowSesion = row?.evento_sesion_id ?? null;
        if (eventoSesionId ? rowSesion === eventoSesionId : rowSesion === null) setCount(p => p + 1);
      })
      .subscribe();

    return () => { cancelled = true; supabase.removeChannel(ch); };
  }, [eventoSesionId, supabase]);

  /* ── registrar RUT ── */
  const registrarRut = useCallback(async (rutRaw: string): Promise<"ok" | "ya" | "err"> => {
    const rut = normalizeRut(rutRaw);
    if (!rut) return "err";
    if (busyRef.current) return "err";
    busyRef.current = true;

    try {
      const { data, error } = await supabase.rpc("registrar_asistencia_domingo", {
        p_rut: rut,
        p_evento_sesion_id: eventoSesionId ?? null,
      });
      if (error) return "err";
      const res = data as Resultado | null;
      if (!res?.ok) return "err";
      return String(res.code).toUpperCase() === "ALREADY" ? "ya" : "ok";
    } catch { return "err"; }
    finally { setTimeout(() => { busyRef.current = false; }, 600); }
  }, [supabase, eventoSesionId]);

  /* ── escáner QR ── */
  useEffect(() => {
    if (modo !== "qr") return;
    let cancelled = false;

    const startScanner = async () => {
      const mod = await import("html5-qrcode");
      if (cancelled) return;
      const { Html5Qrcode } = mod;
      if (!qrRef.current) qrRef.current = new Html5Qrcode(qrDivId);
      try {
        await qrRef.current.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          async (decoded: string) => {
            const rut = normalizeRut(decoded);
            if (!rut || rut === lastRutRef.current) return;
            lastRutRef.current = rut;

            const result = await registrarRut(rut);
            const nombre = rut;

            if (result === "ok") {
              beep("ok");
              setFeedback({ tipo: "ok", titulo: "✅ Registrado", sub: nombre });
            } else if (result === "ya") {
              beep("warn");
              setFeedback({ tipo: "ya", titulo: "Ya registrado", sub: nombre });
            } else {
              beep("err");
              setFeedback({ tipo: "err", titulo: "No encontrado", sub: rut });
            }
            setTimeout(() => {
              setFeedback({ tipo: "idle", titulo: "Listo", sub: "Apunta la cámara al QR del carnet" });
              lastRutRef.current = "";
            }, 2000);
          },
          () => {}
        );
      } catch {
        setFeedback({ tipo: "err", titulo: "Sin cámara", sub: "Permite el acceso a la cámara o usa HTTPS" });
      }
    };

    startScanner();

    return () => {
      cancelled = true;
      if (qrRef.current) {
        qrRef.current.stop().then(() => qrRef.current?.clear()).catch(() => {});
        qrRef.current = null;
      }
    };
  }, [modo, qrDivId, registrarRut]);

  /* ── búsqueda de miembros ── */
  const buscar = useCallback((q: string) => {
    setQuery(q);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (q.trim().length < 2) { setResultados([]); return; }

    searchTimeoutRef.current = setTimeout(async () => {
      setBuscando(true);
      const { data } = await supabase
        .from("miembros")
        .select("rut,nombres,apellidos")
        .or(`rut.ilike.%${q}%,nombres.ilike.%${q}%,apellidos.ilike.%${q}%`)
        .eq("estado", "activo")
        .limit(10);
      setResultados((data ?? []) as MiembroMatch[]);
      setBuscando(false);
    }, 300);
  }, [supabase]);

  const registrarManual = useCallback(async (m: MiembroMatch) => {
    setRegistrando(m.rut);
    const result = await registrarRut(m.rut);
    const nombre = [m.nombres, m.apellidos].filter(Boolean).join(" ").trim();
    if (result === "ok") {
      beep("ok");
      setResultados(prev => prev.map(r => r.rut === m.rut ? { ...r, _done: true } as any : r));
    } else if (result === "ya") {
      beep("warn");
      alert(`${nombre} ya está registrado.`);
    } else {
      beep("err");
      alert(`No se pudo registrar a ${nombre}.`);
    }
    setRegistrando(null);
  }, [registrarRut]);

  /* ── estilos de feedback ── */
  const feedbackBg = feedback.tipo === "ok" ? "bg-emerald-600/90" : feedback.tipo === "ya" ? "bg-amber-600/90" : feedback.tipo === "err" ? "bg-red-700/90" : "bg-black/40";

  return (
    <div className="flex flex-col h-screen overflow-hidden select-none">
      {/* TopBar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10 bg-black/40 shrink-0">
        <a href="/movil" className="flex items-center justify-center w-8 h-8 rounded-lg border border-white/10 hover:bg-white/5">
          <ChevronLeft className="h-4 w-4" />
        </a>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-white/40 truncate">
            {eventoNombre ?? "Sin evento activo"}
          </div>
        </div>
        <div className="text-sm tabular-nums text-white/60">{fmtTime(now)}</div>
        <div className="flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-0.5">
          <span className="text-xs font-bold text-emerald-300">{count}</span>
        </div>
        <button onClick={refreshEvento} className="flex items-center justify-center w-7 h-7 rounded-lg border border-white/10 hover:bg-white/5">
          <RefreshCw className="h-3.5 w-3.5 text-white/50" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 bg-black/30 shrink-0">
        <button
          onClick={() => setModo("qr")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition ${modo === "qr" ? "text-white border-b-2 border-white" : "text-white/40 hover:text-white/70"}`}
        >
          <QrCode className="h-4 w-4" /> Escanear QR
        </button>
        <button
          onClick={() => setModo("buscar")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition ${modo === "buscar" ? "text-white border-b-2 border-white" : "text-white/40 hover:text-white/70"}`}
        >
          <Search className="h-4 w-4" /> Buscar nombre
        </button>
      </div>

      {/* Contenido */}
      {modo === "qr" ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Feedback */}
          <div className={`${feedbackBg} px-4 py-3 text-center transition-colors duration-150 shrink-0`}>
            <div className="text-lg font-bold">{feedback.titulo}</div>
            <div className="text-sm text-white/80">{feedback.sub}</div>
          </div>

          {/* Cámara */}
          <div className="flex-1 bg-black flex items-center justify-center overflow-hidden">
            <div id={qrDivId} className="w-full" style={{ maxWidth: 420 }} />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Buscador */}
          <div className="px-3 pt-3 pb-2 shrink-0">
            <input
              type="search"
              value={query}
              onChange={e => buscar(e.target.value)}
              placeholder="Nombre, apellido o RUT…"
              autoFocus
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-base outline-none focus:border-white/30"
            />
          </div>

          {/* Resultados */}
          <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-2">
            {buscando && (
              <div className="text-center text-white/40 py-6 text-sm">Buscando…</div>
            )}
            {!buscando && query.length >= 2 && resultados.length === 0 && (
              <div className="text-center text-white/40 py-6 text-sm">Sin resultados para "{query}"</div>
            )}
            {resultados.map((m) => {
              const nombre = [m.nombres, m.apellidos].filter(Boolean).join(" ").trim() || m.rut;
              const done = (m as any)._done;
              return (
                <button
                  key={m.rut}
                  disabled={!!registrando || done}
                  onClick={() => registrarManual(m)}
                  className={`w-full flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-left transition active:scale-95 ${
                    done
                      ? "border-emerald-500/30 bg-emerald-500/10"
                      : "border-white/10 bg-white/5 hover:bg-white/10"
                  } disabled:opacity-60`}
                >
                  <div className="flex-1 min-w-0">
                    <div className={`font-semibold truncate ${done ? "text-emerald-300" : "text-white"}`}>
                      {done ? "✅ " : ""}{nombre}
                    </div>
                    <div className="text-xs text-white/40 mt-0.5">{m.rut}</div>
                  </div>
                  {registrando === m.rut ? (
                    <span className="text-xs text-white/50">Registrando…</span>
                  ) : done ? (
                    <span className="text-xs text-emerald-400">Registrado</span>
                  ) : (
                    <span className="text-xs text-white/30 border border-white/10 rounded-full px-2.5 py-0.5">Marcar</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
