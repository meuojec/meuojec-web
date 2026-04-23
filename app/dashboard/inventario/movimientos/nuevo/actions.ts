"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function must<T>(v: T | null | undefined, msg: string): T {
  if (v === null || v === undefined || (typeof v === "string" && v.trim() === "")) {
    throw new Error(msg);
  }
  return v;
}

export async function createMovimiento(formData: FormData) {
  const supabase = await createClient();

  const tipo = must(formData.get("tipo")?.toString(), "Tipo requerido");
  const producto_id = must(formData.get("producto_id")?.toString(), "Producto requerido");
  const cantidadStr = must(formData.get("cantidad")?.toString(), "Cantidad requerida");
  const cantidad = Number(cantidadStr);

  if (!Number.isFinite(cantidad) || cantidad <= 0) {
    throw new Error("Cantidad inválida");
  }

  const ubicacion_origen_id = formData.get("ubicacion_origen_id")?.toString() || null;
  const ubicacion_destino_id = formData.get("ubicacion_destino_id")?.toString() || null;
  const nota = formData.get("nota")?.toString() || null;

  if (tipo === "entrada" && !ubicacion_destino_id) {
    throw new Error("Entrada requiere destino");
  }

  if (tipo === "salida" && !ubicacion_origen_id) {
    throw new Error("Salida requiere origen");
  }

  const { error } = await supabase.from("inv_movimientos").insert({
    tipo,
    producto_id,
    cantidad,
    ubicacion_origen_id,
    ubicacion_destino_id,
    nota,
  });

  if (error) {
    throw new Error(error.message);
  }

  redirect("/dashboard/inventario/movimientos");
}