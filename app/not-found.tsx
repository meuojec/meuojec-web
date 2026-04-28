import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black text-white gap-6 px-4">
      <div className="text-center space-y-2">
        <p className="text-8xl font-black text-white/10">404</p>
        <h1 className="text-2xl font-bold">Página no encontrada</h1>
        <p className="text-white/50 text-sm max-w-xs mx-auto">
          La URL que buscas no existe o fue movida.
        </p>
      </div>
      <Link
        href="/dashboard"
        className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium hover:bg-white/10 transition"
      >
        ← Volver al Dashboard
      </Link>
    </div>
  );
}
