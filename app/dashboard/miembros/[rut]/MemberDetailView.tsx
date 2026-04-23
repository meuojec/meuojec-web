"use client";

// app/dashboard/miembros/[rut]/MemberDetailView.tsx
import React, { useMemo } from "react";

type Props = {
  miembro: any;
  fotoUrl: string | null;
};

export default function MemberDetailView({ miembro, fotoUrl }: Props) {
  // clases visuales iguales estilo “nuevo”
  const inputCls =
    "w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none";
  const inputReadOnlyCls =
    inputCls + " text-white/80 cursor-not-allowed opacity-90";

  const edad = useMemo(() => {
    const fn = miembro?.fecha_nacimiento;
    if (!fn) return null;
    const birth = new Date(fn);
    if (Number.isNaN(birth.getTime())) return null;
    const today = new Date();

    let years = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) years--;
    return years;
  }, [miembro?.fecha_nacimiento]);

  // Departamento puede venir como string (1 valor) o como array.
  // Si lo guardas como texto con comas, lo mostramos como chips.
  const deptos: string[] = useMemo(() => {
    const raw = miembro?.departamento;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.filter(Boolean);
    if (typeof raw === "string") {
      // intenta separar por coma
      return raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return [];
  }, [miembro?.departamento]);

  const tieneVehiculo = Boolean(miembro?.tiene_vehiculo);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Detalle de miembro</h1>
        <p className="text-white/60 mt-2">
          {`${miembro?.nombres ?? ""} ${miembro?.apellidos ?? ""}`.trim() || "—"} •{" "}
          <span className="font-mono">{miembro?.rut}</span>
        </p>
      </div>

      {/* =========================
          CARD: DATOS PERSONALES (layout como “nuevo”)
         ========================= */}
      <Card title="Datos Personales">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-4 items-start">
          {/* IZQ */}
          <div className="space-y-4">
            {/* fila 1 (3 en una fila) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="RUT" hint="Sin puntos, con guion. Ej: 12345678-9">
                <input className={inputReadOnlyCls} value={miembro?.rut ?? ""} readOnly />
              </Field>

              <Field label="Edad (auto)" hint="Calculada con fecha de nacimiento">
                <input
                  className={inputReadOnlyCls}
                  value={edad === null ? "—" : String(edad)}
                  readOnly
                />
              </Field>

              <Field label="Sexo">
                <input className={inputReadOnlyCls} value={miembro?.sexo ?? "—"} readOnly />
              </Field>
            </div>

            {/* fila 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Nombres">
                <input className={inputReadOnlyCls} value={miembro?.nombres ?? "—"} readOnly />
              </Field>

              <Field label="Apellidos">
                <input className={inputReadOnlyCls} value={miembro?.apellidos ?? "—"} readOnly />
              </Field>
            </div>

            {/* fila 3 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Fecha de Nacimiento" hint="Formato YYYY-MM-DD">
                <input
                  className={inputReadOnlyCls}
                  value={miembro?.fecha_nacimiento ?? "—"}
                  readOnly
                />
              </Field>

              <Field label="Nacionalidad">
                <input
                  className={inputReadOnlyCls}
                  value={miembro?.nacionalidad ?? "—"}
                  readOnly
                />
              </Field>

              <Field label="Estado Civil">
                <input
                  className={inputReadOnlyCls}
                  value={miembro?.estado_civil ?? "—"}
                  readOnly
                />
              </Field>
            </div>
          </div>

          {/* DER: FotoBox */}
          <div className="self-start">
            <FotoBoxReadOnly fotoUrl={fotoUrl} />
          </div>
        </div>
      </Card>

      {/* =========================
          CARD: CONTACTO / DIRECCIÓN
         ========================= */}
      <Card title="Contacto y Dirección">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Teléfono">
            <input className={inputReadOnlyCls} value={miembro?.telefono ?? "—"} readOnly />
          </Field>

          <Field label="Correo electrónico">
            <input
              className={inputReadOnlyCls}
              value={miembro?.correo_electronico ?? "—"}
              readOnly
            />
          </Field>

          <Field label="Comuna">
            <input className={inputReadOnlyCls} value={miembro?.comuna ?? "—"} readOnly />
          </Field>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Dirección">
            <input className={inputReadOnlyCls} value={miembro?.direccion ?? "—"} readOnly />
          </Field>
          <Field label="Lugar trabajo/estudio">
            <input
              className={inputReadOnlyCls}
              value={miembro?.lugar_trabajo_estudio ?? "—"}
              readOnly
            />
          </Field>
        </div>
      </Card>

      {/* =========================
          CARD: IGLESIA / MEMBRESÍA
         ========================= */}
      <Card title="Iglesia / Membresía">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Razón de Alta">
            <input className={inputReadOnlyCls} value={miembro?.razon_alta ?? "—"} readOnly />
          </Field>

          <Field label="Estado Membresía">
            <input
              className={inputReadOnlyCls}
              value={miembro?.estado_membresia ?? "—"}
              readOnly
            />
          </Field>

          <Field label="DED">
            <input className={inputReadOnlyCls} value={miembro?.ded ?? "—"} readOnly />
          </Field>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Departamento">
            {deptos.length ? (
              <div className="flex flex-wrap gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-3">
                {deptos.map((d) => (
                  <span
                    key={d}
                    className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/80"
                  >
                    {d}
                  </span>
                ))}
              </div>
            ) : (
              <input className={inputReadOnlyCls} value="—" readOnly />
            )}
          </Field>

          <Field label="Profesión / Oficio">
            <input
              className={inputReadOnlyCls}
              value={miembro?.profesion_oficio ?? "—"}
              readOnly
            />
          </Field>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Fecha conversión">
            <input className={inputReadOnlyCls} value={miembro?.fecha_conversion ?? "—"} readOnly />
          </Field>
          <Field label="Fecha bautizo">
            <input className={inputReadOnlyCls} value={miembro?.fecha_bautizo ?? "—"} readOnly />
          </Field>
          <Field label="Asistía antes a otra iglesia">
            <input
              className={inputReadOnlyCls}
              value={miembro?.asiste_antes_otra_iglesia ? "Sí" : "No"}
              readOnly
            />
          </Field>
        </div>

        {miembro?.asiste_antes_otra_iglesia ? (
          <div className="mt-4">
            <Field label="Nombre iglesia anterior">
              <input
                className={inputReadOnlyCls}
                value={miembro?.nombre_iglesia_anterior ?? "—"}
                readOnly
              />
            </Field>
          </div>
        ) : null}
      </Card>

      {/* =========================
          CARD: SALUD / EDUCACIÓN
         ========================= */}
      <Card title="Salud / Educación">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Nivel académico">
            <input
              className={inputReadOnlyCls}
              value={miembro?.nivel_academico ?? "—"}
              readOnly
            />
          </Field>

          <Field label="Previsión de salud">
            <input className={inputReadOnlyCls} value={miembro?.prevision ?? "—"} readOnly />
          </Field>

          <Field label="Discapacidad física">
            <input
              className={inputReadOnlyCls}
              value={miembro?.discapacidad_fisica ? "Sí" : "No"}
              readOnly
            />
          </Field>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Alergia a medicamento">
            <input
              className={inputReadOnlyCls}
              value={miembro?.alergia_medicamento ?? "—"}
              readOnly
            />
          </Field>

          <Field label="Medicación permanente">
            <input
              className={inputReadOnlyCls}
              value={miembro?.medicacion_permanente ?? "—"}
              readOnly
            />
          </Field>
        </div>
      </Card>

      {/* =========================
          CARD: VEHÍCULO
         ========================= */}
      <Card title="Vehículo">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-sm text-white/70">¿Tiene vehículo?</span>
          <span className="text-sm text-white/90 font-semibold">
            {tieneVehiculo ? "Sí" : "No"}
          </span>
        </div>

        {tieneVehiculo ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Patente">
              <input className={inputReadOnlyCls} value={miembro?.patente ?? "—"} readOnly />
            </Field>
            <Field label="Marca / Modelo">
              <input
                className={inputReadOnlyCls}
                value={miembro?.marca_modelo ?? "—"}
                readOnly
              />
            </Field>
          </div>
        ) : (
          <div className="text-sm text-white/60">Campos ocultos porque no tiene vehículo.</div>
        )}
      </Card>

      {/* =========================
          CARD: FAMILIA (si estado civil = Casado(a))
         ========================= */}
      {String(miembro?.estado_civil ?? "").toLowerCase().includes("casado") ? (
        <Card title="Familia">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Nombre cónyuge">
              <input
                className={inputReadOnlyCls}
                value={miembro?.nombre_conyuge ?? "—"}
                readOnly
              />
            </Field>
            <Field label="Fecha matrimonio">
              <input
                className={inputReadOnlyCls}
                value={miembro?.fecha_matrimonio ?? "—"}
                readOnly
              />
            </Field>
            <Field label="Número de hijos">
              <input
                className={inputReadOnlyCls}
                value={
                  miembro?.numero_hijos === null || miembro?.numero_hijos === undefined
                    ? "—"
                    : String(miembro?.numero_hijos)
                }
                readOnly
              />
            </Field>
          </div>
        </Card>
      ) : null}

      {/* =========================
          CARD: NOTAS
         ========================= */}
      <Card title="Notas">
        <Field label="Observaciones">
          <textarea
            className={inputReadOnlyCls + " min-h-[120px] resize-y"}
            value={miembro?.observaciones ?? "—"}
            readOnly
          />
        </Field>
      </Card>
    </div>
  );
}

/* =========================
   UI helpers (estilo “nuevo”)
   ========================= */

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="text-xl font-semibold mb-4">{title}</div>
      {children}
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between gap-3">
        <div className="text-sm font-medium">{label}</div>
        {hint ? <div className="text-xs text-white/50">{hint}</div> : null}
      </div>
      {children}
    </div>
  );
}

function FotoBoxReadOnly({ fotoUrl }: { fotoUrl: string | null }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
      <div className="text-center font-semibold mb-3">Foto de Identidad</div>

      <div className="mx-auto max-w-[170px]">
        <div className="aspect-[4/5] w-full overflow-hidden rounded-xl border border-white/10 bg-black/30 flex items-center justify-center">
          {fotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={fotoUrl} alt="Foto" className="h-full w-full object-cover" />
          ) : (
            <div className="text-sm text-white/50">Sin foto</div>
          )}
        </div>

        {fotoUrl ? (
          <a
            href={fotoUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 block text-center text-xs text-white/60 hover:text-white"
          >
            Abrir foto ↗
          </a>
        ) : (
          <div className="mt-3 text-center text-xs text-white/50">Sin foto registrada</div>
        )}
      </div>
    </div>
  );
}