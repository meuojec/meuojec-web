// app/dashboard/layout.tsx
export const dynamic = "force-dynamic";
export const revalidate = 0;

import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import DashboardShell from "@/app/components/DashboardShell";
import { createClient } from "@/lib/supabase/server";
import { getNavPermissions } from "@/app/lib/auth/permissions";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const navPerms = await getNavPermissions();
  if (!navPerms.dash) redirect("/login");

  return (
    <div className="min-h-screen bg-[#0b0b0b] text-white">
      <DashboardShell navPerms={navPerms}>
        {children}
      </DashboardShell>
    </div>
  );
}
