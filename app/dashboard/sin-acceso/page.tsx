export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function SinAccesoPage() {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-8 text-center">
      <h1 className="text-xl font-semibold text-white">Sin acceso</h1>
      <p className="mt-3 text-white/60">
        Tu usuario no tiene permisos para acceder a este modulo.
      </p>
    </div>
  );
}
