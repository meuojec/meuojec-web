"use client";

export default function ErrorCard({
  error,
  reset,
  title = "Algo salió mal",
}: {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-5 px-4 text-center">
      <div className="rounded-full border border-red-500/20 bg-red-500/10 p-4">
        <span className="text-3xl">⚠️</span>
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <p className="text-sm text-white/50 max-w-sm">
          {error.message || "Ocurrió un error inesperado. Intenta recargar la página."}
        </p>
        {error.digest && (
          <p className="text-xs text-white/20 font-mono mt-1">ref: {error.digest}</p>
        )}
      </div>
      <button
        onClick={reset}
        className="rounded-xl border border-white/10 bg-white/5 px-5 py-2 text-sm font-medium hover:bg-white/10 transition"
      >
        ↺ Reintentar
      </button>
    </div>
  );
}
