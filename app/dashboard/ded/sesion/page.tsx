export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createClient } from "@/lib/supabase/server";
import DedSesionClient from "./DedSesionClient";
import BackButton from "@/app/components/BackButton";

type DedClase = { id: string; nombre: string };

type VistaAsis = {
  fecha: string;
  ded_clase_id: string;
  miembros_asistencia: number;
};

type Detalle = {
  ded_clase_id: string;
  miembros_asistencia: number;
  visitantes: number;
  biblias: number;
  libros_cantos: number;
  dinero: number;
  notas: string | null;
  ded_clases?: { nombre: string } | null;
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default async function DedSesionPage(props: {
  searchParams?: Promise<{ fecha?: string }>;
}) {
  const supabase = await createClient();

  const sp = props.searchParams ? await props.searchParams : undefined;
  const fecha = sp?.fecha ?? todayISO();

  const { data: clases, error: clsErr } = await supabase
    .from("ded_clases")
    .select("id,nombre")
    .eq("activo", true)
    .order("nombre");

  if (clsErr) throw new Error(clsErr.message);

  const { data: vista, error: vErr } = await supabase
    .from("vw_ded_asistencia_por_clase")
    .select("fecha,ded_clase_id,miembros_asistencia")
    .eq("fecha", fecha);

  if (vErr) throw new Error(vErr.message);

  // Traer detalle guardado para esa fecha (si existe sesión)
  const { data: sesion, error: sErr } = await supabase
    .from("ded_sesiones")
    .select("id")
    .eq("fecha", fecha)
    .maybeSingle();

  if (sErr) throw new Error(sErr.message);

  let detalle: Detalle[] = [];
  if (sesion?.id) {
    const { data: det, error: dErr } = await supabase
      .from("ded_sesion_detalle")
      .select(
        `
        ded_clase_id,miembros_asistencia,visitantes,biblias,libros_cantos,dinero,notas,
        ded_clases(nombre)
      `
      )
      .eq("sesion_id", sesion.id);

    if (dErr) throw new Error(dErr.message);
    detalle = (det ?? []) as any;
  }

  return (
    <DedSesionClient
      fecha={fecha}
      clases={(clases ?? []) as DedClase[]}
      vistaAsistencia={(vista ?? []) as VistaAsis[]}
      detalleGuardado={detalle}
    />
  );
}
