"use server";

import { createClient } from "@/lib/supabase/server";

function must(v: any, msg: string) {
  if (!v) throw new Error(msg);
  return v;
}

async function requireAdmin(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { data: prof, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error) throw new Error(error.message);
  if (prof?.role !== "admin") throw new Error("Solo admin puede eliminar productos");
}

export async function toggleProductoActivo(productoId: string, nextActivo: boolean) {
  const supabase = await createClient();
  must(productoId, "ID requerido");

  // Permisos: admin o inv_access (lo cubre RLS de UPDATE)
  const { error } = await supabase
    .from("inv_productos")
    .update({ activo: nextActivo })
    .eq("id", productoId);

  if (error) throw new Error(error.message);
}

export async function deleteProductoIfNoMovimientos(productoId: string) {
  const supabase = await createClient();
  must(productoId, "ID requerido");

  // 1) Solo admin
  await requireAdmin(supabase);

  // 2) Bloqueo si hay movimientos
  const { count, error: cErr } = await supabase
    .from("inv_movimientos")
    .select("id", { count: "exact", head: true })
    .eq("producto_id", productoId);

  if (cErr) throw new Error(cErr.message);
  if ((count ?? 0) > 0) {
    throw new Error("No se puede eliminar: el producto tiene movimientos. Usa 'Desactivar'.");
  }

  // 3) Delete
  const { error } = await supabase
    .from("inv_productos")
    .delete()
    .eq("id", productoId);

  if (error) throw new Error(error.message);
}