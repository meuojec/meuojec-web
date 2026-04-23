// app/api/eventos/cron/route.ts
// Llamado por Vercel Cron cada minuto para activar/desactivar eventos automáticamente.
// Requiere CRON_SECRET en .env.local (Vercel lo inyecta automáticamente en producción).

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type Franja = { dia: number; hora_inicio: string; hora_fin: string };
type HorarioAuto = { activo: boolean; franjas: Franja[] };
type EventoRow = {
  id: string;
  id_evento: string | null;
  nombre: string | null;
  activo: boolean | null;
  horario_auto: HorarioAuto | null;
};

/** Hora actual en formato "HH:MM" en zona America/Santiago */
function horaChile(): { dia: number; hora: string } {
  const now = new Date();
  // Convertir a hora de Chile
  const clStr = now.toLocaleString("en-US", { timeZone: "America/Santiago" });
  const cl = new Date(clStr);
  const dia = cl.getDay(); // 0=domingo … 6=sábado
  const hh = cl.getHours().toString().padStart(2, "0");
  const mm = cl.getMinutes().toString().padStart(2, "0");
  return { dia, hora: `${hh}:${mm}` };
}

export async function GET(req: NextRequest) {
  // Verificar clave de cron
  const auth = req.headers.get("authorization") ?? "";
  const secret = process.env.CRON_SECRET ?? "";
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: eventos, error } = await admin
    .from("eventos")
    .select("id,id_evento,nombre,activo,horario_auto");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (eventos ?? []) as EventoRow[];
  const { dia, hora } = horaChile();

  // Buscar el evento que debe estar activo ahora según horario_auto
  let debeActivar: EventoRow | null = null;

  for (const ev of rows) {
    const h = ev.horario_auto;
    if (!h?.activo || !h.franjas?.length) continue;

    for (const f of h.franjas) {
      if (f.dia !== dia) continue;
      if (hora >= f.hora_inicio && hora <= f.hora_fin) {
        debeActivar = ev;
        break;
      }
    }
    if (debeActivar) break;
  }

  const eventoActivo = rows.find((e) => !!e.activo) ?? null;

  // Caso 1: Hay un evento programado para ahora
  if (debeActivar) {
    if (eventoActivo?.id === debeActivar.id) {
      // Ya está activo, nada que hacer
      return NextResponse.json({ ok: true, accion: "sin_cambio", evento: debeActivar.nombre });
    }
    // Activar el programado y desactivar los demás
    await admin.from("eventos").update({ activo: false }).neq("id", debeActivar.id);
    await admin
      .from("eventos")
      .update({ activo: true, activated_at: new Date().toISOString() })
      .eq("id", debeActivar.id);
    return NextResponse.json({ ok: true, accion: "activado", evento: debeActivar.nombre });
  }

  // Caso 2: No hay evento programado ahora, pero el activo tiene horario_auto
  // → si su franja ya terminó, desactivarlo automáticamente
  if (eventoActivo?.horario_auto?.activo) {
    const h = eventoActivo.horario_auto;
    const deberiaEstarActivo = h.franjas?.some(
      (f) => f.dia === dia && hora >= f.hora_inicio && hora <= f.hora_fin
    ) ?? false;

    if (!deberiaEstarActivo) {
      await admin.from("eventos").update({ activo: false }).eq("id", eventoActivo.id);
      return NextResponse.json({ ok: true, accion: "desactivado", evento: eventoActivo.nombre });
    }
  }

  return NextResponse.json({ ok: true, accion: "sin_cambio", evento: null });
}
