"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function clean(v: FormDataEntryValue | null) {
  const s = (v?.toString() ?? "").trim();
  return s.length ? s : null;
}

function must(v: FormDataEntryValue | null, msg: string) {
  const s = (v?.toString() ?? "").trim();
  if (!s) throw new Error(msg);
  return s;
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

export async function updateProducto(formData: FormData) {
  const supabase = await createClient();

  const id = must(formData.get("id"), "ID requerido");
  const nombre = must(formData.get("nombre"), "Nombre requerido");
  const unidad = must(formData.get("unidad"), "Unidad requerida");

  const sku = clean(formData.get("sku"));
  const barcode = clean(formData.get("barcode"));
  const categoria_id = clean(formData.get("categoria_id"));

  const stock_minimo_raw = (formData.get("stock_minimo")?.toString() ?? "0").trim();
  const stock_minimo = Number(stock_minimo_raw);
  if (!Number.isFinite(stock_minimo) || stock_minimo < 0) throw new Error("Stock mínimo inválido");

  // Regla pro: al menos SKU o Barcode
  if (!sku && !barcode) throw new Error("Debes ingresar SKU o Barcode (al menos uno).");

  const { error } = await supabase
    .from("inv_productos")
    .update({
      nombre,
      unidad,
      sku,
      barcode,
      categoria_id,
      stock_minimo,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  redirect(`/dashboard/inventario/productos/${id}`);
}

export async function toggleProductoActivo(productoId: string, nextActivo: boolean) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("inv_productos")
    .update({ activo: nextActivo })
    .eq("id", productoId);

  if (error) throw new Error(error.message);

  redirect(`/dashboard/inventario/productos/${productoId}`);
}

export async function deleteProductoIfNoMovimientos(productoId: string) {
  const supabase = await createClient();

  // Solo admin
  await requireAdmin(supabase);

  // Bloquear si hay movimientos
  const { count, error: cErr } = await supabase
    .from("inv_movimientos")
    .select("id", { count: "exact", head: true })
    .eq("producto_id", productoId);

  if (cErr) throw new Error(cErr.message);

  if ((count ?? 0) > 0) {
    throw new Error("No se puede eliminar: el producto tiene movimientos. Usa 'Desactivar'.");
  }

  const { error } = await supabase
    .from("inv_productos")
    .delete()
    .eq("id", productoId);

  if (error) throw new Error(error.message);

  redirect("/dashboard/inventario/productos");
}