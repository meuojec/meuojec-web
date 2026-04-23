"use server";

import { createClient } from "@/lib/supabase/server";

function ymFromDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export async function getCierres() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { data, error } = await supabase
    .from("fin_cierres")
    .select("id,mes,fecha_inicio,fecha_fin,ingresos,egresos,saldo,cerrado_at,nota")
    .order("mes", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function cerrarMes(params: { mes?: string; nota?: string }) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const mes = (params.mes || ymFromDate(new Date())).trim();
  const nota = (params.nota || "").trim() || null;

  const { data, error } = await supabase.rpc("fin_cerrar_mes", {
    p_mes: mes,
    p_nota: nota,
  });

  if (error) throw error;
  return data;
}