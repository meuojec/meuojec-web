import "server-only";
import { createClient } from "@/lib/supabase/server";

export type AsisPerms = {
  read: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
};

export async function getAsistenciaPerms(): Promise<AsisPerms> {
  const supabase = await createClient();

  const checks = await Promise.all([
    supabase.rpc("has_perm", { p_module: "asistencia", p_action: "read" }),
    supabase.rpc("has_perm", { p_module: "asistencia", p_action: "create" }),
    supabase.rpc("has_perm", { p_module: "asistencia", p_action: "update" }),
    supabase.rpc("has_perm", { p_module: "asistencia", p_action: "delete" }),
  ]);

  const [r, c, u, d] = checks;

  return {
    read: !!r.data,
    create: !!c.data,
    update: !!u.data,
    delete: !!d.data,
  };
}
