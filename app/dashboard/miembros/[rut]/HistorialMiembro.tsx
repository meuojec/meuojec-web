// app/dashboard/miembros/[rut]/HistorialMiembro.tsx
import { createAdminClient } from "@/lib/supabase/admin";

// Etiquetas legibles por campo
const CAMPO_LABELS: Record<string, string> = {
  nombres:                   "Nombres",
  apellidos:                 "Apellidos",
  sexo:                      "Sexo",
  fecha_nacimiento:          "Fecha de nacimiento",
  edad:                      "Edad",
  nacionalidad:              "Nacionalidad",
  estado_civil:              "Estado civil",
  fecha_matrimonio:          "Fecha de matrimonio",
  anio_matrimonio:           "Año de matrimonio",
  nombre_conyuge:            "Nombre del cónyuge",
  numero_hijos:              "N° de hijos",
  direccion:                 "Dirección",
  comuna:                    "Comuna",
  telefono:                  "Teléfono",
  correo_electronico:        "Correo electrónico",
  razon_alta:                "Razón de alta",
  fecha_conversion:          "Fecha de conversión",
  fecha_bautizo:             "Fecha de bautizo",
  departamento:              "Departamento",
  asiste_antes_otra_iglesia: "Asistía antes a otra iglesia",
  nombre_iglesia_anterior:   "Nombre iglesia anterior",
  profesion_oficio:          "Profesión / Oficio",
  lugar_trabajo_estudio:     "Lugar de trabajo / estudio",
  nivel_academico:           "Nivel académico",
  ded:                       "DED",
  prevision:                 "Previsión",
  alergia_medicamento:       "Alergia a medicamentos",
  medicacion_permanente:     "Medicación permanente",
  discapacidad_fisica:       "Discapacidad física",
  tiene_vehiculo:            "Tiene vehículo",
  marca_modelo:              "Marca / Modelo",
  patente:                   "Patente",
  observaciones:             "Observaciones",
  estado_membresia:          "Estado membresía",
};

// Campos técnicos que no vale la pena mostrar
const IGNORAR = new Set([
  "updated_at", "created_at", "foto_path", "foto_url",
  "foto_identidad_url", "edad",
]);

function fmtVal(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return v ? "Sí" : "No";
  return String(v);
}

type HRow = {
  id: string;
  operacion: "INSERT" | "UPDATE" | "DELETE";
  datos_ant: Record<string, unknown> | null;
  datos_nue: Record<string, unknown> | null;
  campos_mod: string[] | null;
  cambiado_por: string | null;
  cambiado_en: string;
  profiles: { display_name: string | null; email: string | null } | null;
};

export default async function HistorialMiembro({ rut }: { rut: string }) {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("miembros_historial")
    .select("*, profiles(display_name, email)")
    .eq("rut", rut)
    .order("cambiado_en", { ascending: false })
    .limit(100);

  if (error) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-5 text-sm text-white/50">
        No se pudo cargar el historial.
      </div>
    );
  }

  const rows = (data ?? []) as HRow[];

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
      {/* Encabezado */}
      <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-white">Historial de cambios</h2>
          <p className="text-white/40 text-xs mt-0.5">
            {rows.length === 0
              ? "Sin registros"
              : `${rows.length} registro${rows.length !== 1 ? "s" : ""}`}
          </p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="px-5 py-6 text-sm text-white/40">
          Aún no hay cambios registrados para este miembro.
        </div>
      ) : (
        <div className="divide-y divide-white/5">
          {rows.map((row) => {
            const quien =
              row.profiles?.display_name ||
              row.profiles?.email ||
              (row.cambiado_por ? "Usuario desconocido" : "Sincronización automática");

            const fecha = new Date(row.cambiado_en).toLocaleString("es-CL", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            const camposVisibles = (row.campos_mod ?? []).filter(
              (c) => !IGNORAR.has(c)
            );

            return (
              <div key={row.id} className="px-5 py-4">
                {/* Fila principal */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {/* Badge */}
                    <span
                      className={[
                        "text-xs font-semibold px-2 py-0.5 rounded-full",
                        row.operacion === "INSERT"
                          ? "bg-green-500/15 text-green-400"
                          : row.operacion === "DELETE"
                          ? "bg-red-500/15 text-red-400"
                          : "bg-blue-500/15 text-blue-400",
                      ].join(" ")}
                    >
                      {row.operacion === "INSERT"
                        ? "Creado"
                        : row.operacion === "DELETE"
                        ? "Eliminado"
                        : "Modificado"}
                    </span>
                    <span className="text-sm text-white/80">{quien}</span>
                  </div>
                  <span className="text-xs text-white/35 shrink-0 tabular-nums">
                    {fecha}
                  </span>
                </div>

                {/* Detalle de campos modificados */}
                {row.operacion === "UPDATE" && camposVisibles.length > 0 && (
                  <div className="mt-3 space-y-1.5 pl-1 border-l border-white/10 ml-1">
                    {camposVisibles.map((campo) => {
                      const ant = fmtVal(row.datos_ant?.[campo]);
                      const nue = fmtVal(row.datos_nue?.[campo]);
                      return (
                        <div key={campo} className="text-xs flex gap-2 items-baseline">
                          <span className="text-white/40 w-44 shrink-0">
                            {CAMPO_LABELS[campo] ?? campo}
                          </span>
                          <span className="text-red-400/80 line-through">{ant}</span>
                          <span className="text-white/25">→</span>
                          <span className="text-green-400/90">{nue}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* INSERT: mostrar nombre */}
                {row.operacion === "INSERT" && row.datos_nue && (
                  <p className="mt-1.5 pl-2 text-xs text-white/35">
                    Registro inicial creado
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
