"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export type MiembroPortal = {
  rut: string;
  nombres: string | null;
  apellidos: string | null;
  fecha_nacimiento: string | null;
  email: string | null;
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

export async function consultarPortal(fd: FormData): Promise<PortalResult> {
  const rut = String(fd.get("rut") ?? "").trim();
  const fecha = String(fd.get("fecha_nacimiento") ?? "").trim();

  if (!rut || !fecha) return { ok: false, error: "Completa todos los campos." };

  const admin = createAdminClient();

  // Buscar miembro por RUT
  const { data: m, error } = await admin
    .from("miembros")
    .select("rut,nombres,apellidos,fecha_nacimiento,email,telefono,direccion,sexo,ded,estado,fecha_ingreso,foto_url")
    .eq("rut", rut)
    .maybeSingle();

  if (error || !m) {
    return { ok: false, error: "RUT no encontrado. Verifica que estés registrado." };
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
