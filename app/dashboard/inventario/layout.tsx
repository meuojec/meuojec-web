// app/dashboard/inventario/layout.tsx
import { redirect } from "next/navigation";
import { getNavPermissions } from "@/app/lib/auth/permissions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function InventarioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const perms = await getNavPermissions();

  // 🔐 si no tiene permiso inventario, se va fuera
  if (!perms.inv) redirect("/dashboard");

  return <>{children}</>;
}