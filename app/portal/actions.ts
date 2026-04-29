"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export type MiembroPortal = {
  rut: string;
  nombres: string | null;
  apellidos: string | null;
  fecha_nacimiento: string | null;
  telefono: string | null;
  direccion: string | null;
  sexo: string | null;
  ded: string | null;
  estado: string | null;
  fecha_ingreso: string | null;
  foto_url: string | null;
};

export type AsistenciaPortal = {
  fecha: string;
  hora: string | null;
  evento: string | null;
};

export type PortalData = {
  miembro: MiembroPortal;
  asistencias: AsistenciaPortal[];
  totalAno: number;
  totalMes: number;
};

export type PortalResult =
  | { ok: true; data: PortalData }
  | { ok: false; error: string };

/** Genera ambas variantes del RUT para buscar en BD sin importar cómo esté guardado */
function rutVariants(raw: string): string[] {
  const clean = raw.replace(/\./g, "").toUpperCase(); // sin puntos: 12345678-9
  const body = clean.slice(0, -2); // 12345678
  const dv = clean.slice(-1);      // 9
  // con puntos: 12.345.678-9
  const conPuntos = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "-" + dv;
  return Array.from(new Set([clean, conPuntos, raw.toUpperCase()]));
}

export async function consultarPortal(fd: FormData): Promise<PortalResult> {
  const rawRut = String(fd.get("rut") ?? "").trim();
  const fecha = String(fd.get("fecha_nacimiento") ?? "").trim();

  if (!rawRut || !fecha) return { ok: false, error: "Completa todos los campos." };

  const admin = createAdminClient();

  // Buscar miembro probando todas las variantes de formato de RUT
  const variants = rutVariants(rawRut);
  let m: any = null;
  let lastError: string | null = null;

  for (const v of variants) {
    const { data, error } = await admin
      .from("miembros")
      .select("rut,nombres,apellidos,fecha_nacimiento,telefono,direccion,sexo,ded,estado,fecha_ingreso,foto_url")
      .eq("rut", v)
      .maybeSingle();
    if (error) { lastError = error.message; }
    if (data) { m = data; break; }
  }

  // Usar el RUT real de la BD para queries de asistencias
  const rut: string = m?.rut ?? variants[0];

  if (!m) {
    // Si hay error de Supabase, mostrarlo para diagnóstico
    if (lastError) return { ok: false, error: `Error de conexión: ${lastError}` };
    return { ok: false, error: `RUT no encontrado (buscado: ${variants.join(" / ")})` };
  }

  // Verificar fecha de nacimiento
  const fnBd = (m.fecha_nacimiento ?? "").slice(0, 10);
  if (fnBd !== fecha) {
    return { ok: false, error: "Los datos no coinciden. Verifica tu RUT y fecha de nacimiento." };
  }

  // Traer asistencias
  const now = new Date();
  const anoActual = now.getFullYear();
  const mesActual = String(now.getMonth() + 1).padStart(2, "0");
  const inicioAno = `${anoActual}-01-01`;
  const inicioMes = `${anoActual}-${mesActual}-01`;

  const { data: asists } = await admin
    .from("asistencias")
    .select("fecha,hora,id_evento")
    .eq("rut", rut)
    .gte("fecha", inicioAno)
    .order("fecha", { ascending: false })
    .limit(50);

  const lista = (asists ?? []) as { fecha: string; hora: string | null; id_evento: string | null }[];

  // Resolver nombres de eventos
  const idsEvento = [...new Set(lista.map(a => a.id_evento).filter(Boolean))] as string[];
  const eventosMap = new Map<string, string>();
  if (idsEvento.length > 0) {
    const { data: evs } = await admin.from("eventos").select("id_evento,nombre").in("id_evento", idsEvento);
    (evs ?? []).forEach((e: any) => eventosMap.set(e.id_evento, e.nombre ?? "Culto"));
  }

  const asistencias: AsistenciaPortal[] = lista.map(a => ({
    fecha: a.fecha,
    hora: a.hora,
    evento: a.id_evento ? (eventosMap.get(a.id_evento) ?? "Culto general") : "Culto general",
  }));

  const totalAno = lista.length;
  const totalMes = lista.filter(a => a.fecha >= inicioMes).length;

  return {
    ok: true,
    data: {
      miembro: m as MiembroPortal,
      asistencias,
      totalAno,
      totalMes,
    },
  };
}
