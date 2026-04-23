// app/dashboard/admin/carnets/page.tsx
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CarnetsTools from "./_components/CarnetsTools";

export default async function AdminCarnetsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // (Opcional) si quieres asegurar solo admin:
  // const { data: prof } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  // if (prof?.role !== "admin") redirect("/dashboard");

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Administración · Carnets</h1>
        <p className="text-white/60">
          Genera PDFs: carnet individual y carnets masivos (A4 · 8 por hoja).
        </p>
      </div>

      <CarnetsTools />
    </div>
  );
}