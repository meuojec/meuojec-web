import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function FinanzasLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: allowed } = await supabase.rpc("has_permission", {
    p_module: "finanzas",
    p_action: "view",
  });

  if (!allowed) redirect("/dashboard");

  return <>{children}</>;
}