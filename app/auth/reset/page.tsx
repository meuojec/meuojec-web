export const dynamic = "force-dynamic";
export const revalidate = 0;

import ResetForm from "./ResetForm";

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#0b0b0b] text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-black/40 p-6">
        <h1 className="text-2xl font-extrabold">Restablecer contraseña</h1>
        <p className="mt-1 text-sm text-white/60">Escribe tu nueva contraseña.</p>
        <div className="mt-6">
          <ResetForm />
        </div>
      </div>
    </div>
  );
}
