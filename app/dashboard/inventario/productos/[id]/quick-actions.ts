"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function must(v: FormDataEntryValue | null, msg: string) {
  const s = (v?.toString() ?? "").trim();
  if (!s) throw new Error(msg);
  return s;
}

export async function quickMovimiento(formData: FormData) {
  const supabase = await createClient();

  const producto_id = must(formData.get("producto_id"), "Producto requerido");
  const tipo = must(formData.get("tipo"), "Tipo requerido");
  const cantidad = Number(must(formData.get("cantidad"), "Cantidad requerida"));

  if (!Number.isFinite(cantidad) || cantidad <= 0) throw new Error("Cantidad inválida");

  const ubicacion_origen_id = (formData.get("ubicacion_origen_id")?.toString() || "").trim() || null;
  const ubicacion_destino_id = (formData.get("ubicacion_destino_id")?.toString() || "").trim() || null;
  const nota = (formData.get("nota")?.toString() || "").trim() || null;

  if (tipo === "entrada" && !ubicacion_destino_id) throw new Error("Entrada requiere destino");
  if (tipo === "salida" && !ubicacion_origen_id) throw new Error("Salida requiere origen");
  if (tipo === "traslado" && (!ubicacion_origen_id || !ubicacion_destino_id))
    throw new Error("Traslado requiere origen y destino");

  const { error } = await supabase.from("inv_movimientos").insert({
    tipo,
    producto_id,
    cantidad,
    ubicacion_origen_id,
    ubicacion_destino_id,
    nota,
  });

  if (error) throw new Error(error.message);

  redirect(`/dashboard/inventario/productos/${producto_id}`);
}