"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";

const AREA = "IGLESIA";

export type PresupuestoRow = {
  categoria_id: string;
  categoria_nombre: string;
  tipo: "INGRESO" | "EGRESO";
  orden: number;
  presupuestado: number;
  ejecutado: number;
  pct: number;          // 0-100+
  diferencia: number;   // presupuestado - ejecutado
};

async function requireUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data?.user) redirect("/login");
  return { supabase, user: data.user };
}

async function requireAdmin() {
  const { supabase, user } = await requireUser();
  const { data: prof } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (prof?.role !== "admin") return { ok: false as const, error: "No autorizado" };
  return { ok: true as const, supabase, user };
}

export async function getPresupuesto(mes: string): Promise<{
  rows: PresupuestoRow[];
  totalPresupuestadoIngreso: number;
  totalPresupuestadoEgreso: number;
  totalEjecutadoIngreso: number;
  totalEjecutadoEgreso: number;
}> {
  const { supabase } = await requireUser();
  const admin = createAdminClient();

  // Categorías activas
  const { data: cats } = await supabase
    .from("fin_categorias")
    .select("id,nombre,tipo,orden")
    .eq("area", AREA)
    .eq("activa", true)
    .order("orden", { ascending: true })
    .order("nombre", { ascending: true });

  const categorias = (cats ?? []) as { id: string; nombre: string; tipo: string; orden: number }[];

  // Presupuestos del mes
  const { data: presData } = await admin
    .from("fin_presupuestos")
    .select("categoria_id,monto")
    .eq("area", AREA)
    .eq("mes", mes);

  const presMap = new Map<string, number>();
  ((presData ?? []) as { categoria_id: string; monto: number }[])
    .forEach(p => presMap.set(p.categoria_id, Number(p.monto)));

  // Movimientos ejecutados en el mes
  const desde = `${mes}-01`;
  const [y, m] = mes.split("-").map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  const hasta = `${mes}-${String(lastDay).padStart(2, "0")}`;

  const { data: movs } = await admin
    .from("fin_movimientos")
    .select("categoria_id,tipo,monto")
    .eq("area", AREA)
    .gte("fecha", desde)
    .lte("fecha", hasta);

  const ejecutadoMap = new Map<string, number>();
  ((movs ?? []) as { categoria_id: string | null; tipo: string | null; monto: number | null }[])
    .forEach(mv => {
      if (!mv.categoria_id || (mv.tipo !== "INGRESO" && mv.tipo !== "EGRESO")) return;
      ejecutadoMap.set(mv.categoria_id, (ejecutadoMap.get(mv.categoria_id) ?? 0) + (mv.monto ?? 0));
    });

  const rows: PresupuestoRow[] = categorias.map(cat => {
    const presupuestado = presMap.get(cat.id) ?? 0;
    const ejecutado = ejecutadoMap.get(cat.id) ?? 0;
    const pct = presupuestado > 0 ? Math.round((ejecutado / presupuestado) * 100) : (ejecutado > 0 ? 100 : 0);
    return {
      categoria_id: cat.id,
      categoria_nombre: cat.nombre,
      tipo: (cat.tipo === "INGRESO" ? "INGRESO" : "EGRESO") as "INGRESO" | "EGRESO",
      orden: cat.orden,
      presupuestado,
      ejecutado,
      pct,
      diferencia: presupuestado - ejecutado,
    };
  });

  const ing = rows.filter(r => r.tipo === "INGRESO");
  const egr = rows.filter(r => r.tipo === "EGRESO");

  return {
    rows,
    totalPresupuestadoIngreso: ing.reduce((s, r) => s + r.presupuestado, 0),
    totalPresupuestadoEgreso:  egr.reduce((s, r) => s + r.presupuestado, 0),
    totalEjecutadoIngreso:     ing.reduce((s, r) => s + r.ejecutado, 0),
    totalEjecutadoEgreso:      egr.reduce((s, r) => s + r.ejecutado, 0),
  };
}

export async function upsertPresupuesto(input: {
  categoria_id: string;
  mes: string;
  monto: number;
}): Promise<{ ok: boolean; error?: string }> {
  const res = await requireAdmin();
  if (!res.ok) return { ok: false, error: res.error };

  const admin = createAdminClient();
  const { error } = await admin
    .from("fin_presupuestos")
    .upsert(
      { area: AREA, categoria_id: input.categoria_id, mes: input.mes, monto: input.monto, updated_at: new Date().toISOString() },
      { onConflict: "area,categoria_id,mes" }
    );

  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/finanzas/presupuesto");
  return { ok: true };
}
