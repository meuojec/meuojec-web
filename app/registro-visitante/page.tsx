import Image from "next/image";
import RegistroVisitanteForm from "./RegistroVisitanteForm";

export const metadata = { title: "Registro de Visitantes — MEUOJEC" };

export default function RegistroVisitantePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image src="/logo-iglesia.png" alt="Logo MEUOJEC" width={80} height={80} className="rounded-xl" />
          </div>
          <h1 className="text-2xl font-bold text-white">¡Bienvenido a MEUOJEC!</h1>
          <p className="mt-2 text-white/60 text-sm">
            Completa este formulario para que podamos mantenernos en contacto contigo.
          </p>
        </div>
        <RegistroVisitanteForm />
      </div>
    </div>
  );
}
