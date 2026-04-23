// app/lib/auth/capabilities.ts
import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function hasCap(capability: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("has_capability_current", {
    p_capability: capability,
  });
  if (error) return false;
  return !!data;
}
   