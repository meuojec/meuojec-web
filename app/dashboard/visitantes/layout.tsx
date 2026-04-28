import { redirect } from "next/navigation";
import { getNavPermissions } from "@/app/lib/auth/permissions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Layout({ children }: { children: React.ReactNode }) {
  const perms = await getNavPermissions();
  if (!perms.visitantes) redirect("/dashboard");
  return <>{children}</>;
}
