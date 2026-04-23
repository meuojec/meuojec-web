"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function must(v: FormDataEntryValue | null, msg: string) {
  if (!v || v.toString().trim() === "") throw new Error(msg);
  return v.toString().trim();
}

export async function createProducto(formData: FormData) {
  const supabase = await createClient();

  const nombre = must(formData.get("nombre"), "Nombre requerido");
  const sku = (formData.get("sku")?.toString() || "").trim() || null;
  const barcode = (formData.get("barcode")?.toString() || "").trim() || null;
  const unidad = must(formData.get("unidad"), "Unidad requerida");
  const stock_minimo = Number((formData.get("stock_minimo")?.toString() || "0").trim());
  const categoria_id = (formData.get("categoria_id")?.toString() || "").trim() || null;

  // regla pro: al menos SKU o Barcode
  if (!sku && !barcode) throw new Error("Debes ingresar SKU o Barcode (al menos uno).");

  const { error } = await supabase.from("inv_productos").insert({
    nombre,
    sku,
    barcode,
    unidad,
    stock_minimo,
    categoria_id,
    activo: true,
  });

  if (error) throw new Error(error.message);

  redirect("/dashboard/inventario/productos");
}