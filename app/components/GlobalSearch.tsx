"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

type MiembroResult = { rut: string; nombre: string; ded: string | null; foto_url: string | null };
type EventoResult = { id: string; id_evento: string; nombre: string; activo: boolean };
type SesionResult = { id: string; nombre: string; fecha: string | null };

type Results = {
  miembros: MiembroResult[];
  eventos: EventoResult[];
  sesiones: SesionResult[];
};

const EMPTY: Results = { miembros: [], eventos: [], sesiones: [] };

export default function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Results>(EMPTY);
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Atajo de teclado: Ctrl+K o Cmd+K
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (val.trim().length < 2) {
      setResults(EMPTY);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        try {
          const res = await fetch(`/api/buscar?q=${encodeURIComponent(val.trim())}`);
          if (res.ok) {
            const data = await res.json();
            setResults(data);
            setOpen(true);
          }
        } catch { /* silencioso */ }
      });
    }, 300);
  }

  function navigate(href: string) {
    setOpen(false);
    setQuery("");
    setResults(EMPTY);
    router.push(href);
  }

  const hasResults =
    results.miembros.length > 0 ||
    results.eventos.length > 0 ||
    results.sesiones.length > 0;

  return (
    <div ref={containerRef} className="relative hidden sm:block">
      {/* Input */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/40 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={onChange}
          onFocus={() => query.length >= 2 && setOpen(true)}
          placeholder="Buscar… (Ctrl+K)"
          className="w-48 lg:w-64 rounded-lg border border-white/10 bg-white/5 pl-8 pr-3 py-1.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/20 focus:bg-white/8 transition"
        />
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full mt-1.5 right-0 w-80 rounded-xl border border-white/10 bg-[#111] shadow-2xl z-50 overflow-hidden">
          {!hasResults ? (
            <div className="px-4 py-6 text-sm text-white/40 text-center">
              Sin resultados para "{query}"
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto divide-y divide-white/5">

              {/* Miembros */}
              {results.miembros.length > 0 && (
                <div>
                  <div className="px-3 pt-2.5 pb-1 text-xs font-semibold text-white/30 uppercase tracking-wider">
                    Miembros
                  </div>
                  {results.miembros.map((m) => (
                    <button
                      key={m.rut}
                      type="button"
                      onClick={() => navigate(`/dashboard/miembros/${encodeURIComponent(m.rut)}`)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 text-left transition"
                    >
                      <div className="h-7 w-7 rounded-full bg-white/10 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center">
                        {m.foto_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={m.foto_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-xs text-white/40">
                            {m.nombre.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm text-white truncate">{m.nombre}</div>
                        <div className="text-xs text-white/40 truncate">
                          {m.rut}{m.ded ? ` · ${m.ded}` : ""}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Eventos */}
              {results.eventos.length > 0 && (
                <div>
                  <div className="px-3 pt-2.5 pb-1 text-xs font-semibold text-white/30 uppercase tracking-wider">
                    Eventos
                  </div>
                  {results.eventos.map((e) => (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => navigate(`/dashboard/eventos`)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 text-left transition"
                    >
                      <div className="h-7 w-7 rounded-full bg-blue-500/20 border border-blue-500/20 flex items-center justify-center shrink-0">
                        <span className="text-xs text-blue-400">E</span>
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm text-white truncate">{e.nombre}</div>
                        <div className="text-xs text-white/40">
                          {e.id_evento}{e.activo ? " · Activo" : ""}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Sesiones */}
              {results.sesiones.length > 0 && (
                <div>
                  <div className="px-3 pt-2.5 pb-1 text-xs font-semibold text-white/30 uppercase tracking-wider">
                    Sesiones
                  </div>
                  {results.sesiones.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => navigate(`/dashboard/asistencias/sesiones/${encodeURIComponent(s.id)}`)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 text-left transition"
                    >
                      <div className="h-7 w-7 rounded-full bg-purple-500/20 border border-purple-500/20 flex items-center justify-center shrink-0">
                        <span className="text-xs text-purple-400">S</span>
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm text-white truncate">{s.nombre}</div>
                        <div className="text-xs text-white/40">{s.fecha ?? "—"}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
