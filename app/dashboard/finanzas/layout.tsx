import { redirect } from "next/navigation";
import { getNavPermissions } from "@/app/lib/auth/permissions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function FinanzasLayout({ children }: { children: React.ReactNode }) {
  const perms = await getNavPermissions();
  if (!perms.fin) redirect("/dashboard");
  return <>{children}</>;
}