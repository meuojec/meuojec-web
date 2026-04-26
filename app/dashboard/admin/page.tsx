// app/dashboard/admin/carnets/page.tsx
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CarnetsTools from "./_components/CarnetsTools";
import BackButton from "@/app/components/BackButton";

export default async function AdminCarnetsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <BackButton />
          <h1 className="text-2xl font-bold">Administración · Carnets</h1>
        </div>
        <p className="text-white/60">
          Genera carnet individual por RUT o imprime carnets masivos en A4 (8 por hoja).
        </p>
      </div>

      <CarnetsTools />
    </div>
  );
}