"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type StepKey = "basico" | "contacto" | "iglesia" | "salud" | "vehiculo" | "notas";

type FormState = {
  // básicos
  rut: string;
  nombres: string;
  apellidos: string;
  sexo: string;
  fecha_nacimiento: string; // yyyy-mm-dd
  nacionalidad: string;
  estado_civil: string;

  // familia
  fecha_matrimonio: string;
  anio_matrimonio: string;
  nombre_conyuge: string;
  numero_hijos: string;

  // contacto
  direccion: string;
  comuna: string;
  telefono: string;
  correo_electronico: string;

  // iglesia / alta
  razon_alta: string;
  fecha_conversion: string;
  fecha_bautizo: string;
  departamento: string;

  asiste_antes_otra_iglesia: boolean;
  nombre_iglesia_anterior: string;

  // membresía
  estado_membresia: string;
  ded: string;

  // laboral / salud
  profesion_oficio: string;
  lugar_trabajo_estudio: string;
  nivel_academico: string;
  prevision: string;

  alergia_medicamento: string;
  medicacion_permanente: string;
  discapacidad_fisica: boolean;

  // vehículo
  tiene_vehiculo: boolean;
  patente: string;
  marca_modelo: string;

  // notas
  observaciones: string;

  // foto
  foto: File | null;
};

const DED_OPTIONS = ["Varones", "Damas", "Jovenes", "Creyentes", "Aspirantes", "Sin DED"];
const SEXO_OPTIONS = ["Masculino", "Femenino"];
const ESTADO_MEMBRESIA_OPTIONS = ["Activo", "En proceso", "Visitante", "Inactivo"];

const steps: { key: StepKey; title: string; desc: string }[] = [
  { key: "basico", title: "Datos básicos", desc: "Identidad y datos esenciales" },
  { key: "contacto", title: "Contacto", desc: "Dirección, comuna, teléfono, email" },
  { key: "iglesia", title: "Iglesia y membresía", desc: "Alta, DED, estado, antecedentes" },
  { key: "salud", title: "Laboral y salud", desc: "Trabajo/estudio y datos de salud" },
  { key: "vehiculo", title: "Vehículo", desc: "Patente y marca/modelo si aplica" },
  { key: "notas", title: "Notas", desc: "Observaciones y revisión final" },
];

function normalizeRutNoDotsWithHyphen(input: string) {
  const raw = (input || "").trim();
  if (!raw) return "";
  const clean = raw.replace(/[^0-9kK]/g, "").toUpperCase();
  if (clean.length < 2) return "";
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  return `${body}-${dv}`;
}

function isEmail(v: string) {
  if (!v.trim()) return true; // opcional
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

function classNames(...xs: (string | false | null | undefined)[]) {
  return xs.filter(Boolean).join(" ");
}

export default function MemberWizardForm() {
  const router = useRouter();

  const [stepIdx, setStepIdx] = useState(0);
  const step = steps[stepIdx];

  const [submitting, setSubmitting] = useState(false);
  const [globalErr, setGlobalErr] = useState("");
  const [okMsg, setOkMsg] = useState("");

  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const [f, setF] = useState<FormState>({
    rut: "",
    nombres: "",
    apellidos: "",
    sexo: "",
    fecha_nacimiento: "",
    nacionalidad: "",
    estado_civil: "",

    fecha_matrimonio: "",
    anio_matrimonio: "",
    nombre_conyuge: "",
    numero_hijos: "",

    direccion: "",
    comuna: "",
    telefono: "",
    correo_electronico: "",

    razon_alta: "",
    fecha_conversion: "",
    fecha_bautizo: "",
    departamento: "",

    asiste_antes_otra_iglesia: false,
    nombre_iglesia_anterior: "",

    estado_membresia: "",
    ded: "",

    profesion_oficio: "",
    lugar_trabajo_estudio: "",
    nivel_academico: "",
    prevision: "",

    alergia_medicamento: "",
    medicacion_permanente: "",
    discapacidad_fisica: false,

    tiene_vehiculo: false,
    patente: "",
    marca_modelo: "",

    observaciones: "",
    foto: null,
  });

  // dinámicas
  const showFamilia = useMemo(() => (f.estado_civil || "").toLowerCase().includes("cas"), [f.estado_civil]);
  const showIglesiaAnterior = f.asiste_antes_otra_iglesia;
  const showVehiculoFields = f.tiene_vehiculo;

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setF((prev) => ({ ...prev, [key]: value }));
  }

  function markTouched(keys: (keyof FormState)[]) {
    setTouched((prev) => {
      const next = { ...prev };
      keys.forEach((k) => (next[String(k)] = true));
      return next;
    });
  }

  // Validaciones por paso (mínimo necesario para avanzar)
  function validateStep(key: StepKey) {
    const errors: Record<string, string> = {};

    if (key === "basico") {
      const rutNorm = normalizeRutNoDotsWithHyphen(f.rut);
      if (!rutNorm) errors.rut = "RUT inválido. Debe ir sin puntos y con guion.";
      if (!f.nombres.trim()) errors.nombres = "Nombres requerido.";
      if (!f.apellidos.trim()) errors.apellidos = "Apellidos requerido.";
      if (!f.sexo.trim()) errors.sexo = "Sexo requerido.";
      if (!f.fecha_nacimiento.trim()) errors.fecha_nacimiento = "Fecha de nacimiento requerida.";
    }

    if (key === "contacto") {
      if (f.correo_electronico && !isEmail(f.correo_electronico)) {
        errors.correo_electronico = "Email inválido.";
      }
    }

    if (key === "iglesia") {
      // aquí puedes hacer obligatorios DED/estado si quieres:
      // if (!f.estado_membresia.trim()) errors.estado_membresia = "Estado membresía requerido.";
      // if (!f.ded.trim()) errors.ded = "DED requerido.";
      if (showIglesiaAnterior && !f.nombre_iglesia_anterior.trim()) {
        errors.nombre_iglesia_anterior = "Indica el nombre de la iglesia anterior.";
      }
    }

    if (key === "vehiculo") {
      if (showVehiculoFields) {
        if (!f.patente.trim()) errors.patente = "Patente requerida si tiene vehículo.";
        // marca_modelo opcional, pero recomendado:
        // if (!f.marca_modelo.trim()) errors.marca_modelo = "Marca/Modelo recomendado.";
      }
    }

    return errors;
  }

  const stepErrors = useMemo(() => validateStep(step.key), [step.key, f, showIglesiaAnterior, showVehiculoFields]);
  const hasStepErrors = Object.keys(stepErrors).length > 0;

  function next() {
    setGlobalErr("");
    setOkMsg("");

    const errors = validateStep(step.key);
    if (Object.keys(errors).length > 0) {
      // marcar touched los campos del paso para mostrar errores
      markTouched(Object.keys(errors) as (keyof FormState)[]);
      setGlobalErr("Revisa los campos marcados antes de continuar.");
      return;
    }
    setStepIdx((i) => Math.min(i + 1, steps.length - 1));
  }

  function back() {
    setGlobalErr("");
    setOkMsg("");
    setStepIdx((i) => Math.max(i - 1, 0));
  }

  async function submitAll() {
    setGlobalErr("");
    setOkMsg("");

    // Validar todos los pasos relevantes antes de enviar
    const allErrors: Record<string, string> = {};
    for (const s of steps) {
      const e = validateStep(s.key);
      Object.assign(allErrors, e);
    }
    if (Object.keys(allErrors).length > 0) {
      markTouched(Object.keys(allErrors) as (keyof FormState)[]);
      setGlobalErr("Hay campos con error. Revisa los pasos y corrige antes de guardar.");
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();

      // normaliza rut para backend
      const rutNorm = normalizeRutNoDotsWithHyphen(f.rut);

      // foto
      if (f.foto) fd.set("foto", f.foto);

      // básicos
      fd.set("rut", rutNorm);
      fd.set("nombres", f.nombres.trim());
      fd.set("apellidos", f.apellidos.trim());
      fd.set("sexo", f.sexo || "");
      fd.set("fecha_nacimiento", f.fecha_nacimiento || "");
      fd.set("nacionalidad", f.nacionalidad || "");
      fd.set("estado_civil", f.estado_civil || "");

      // familia
      fd.set("fecha_matrimonio", showFamilia ? (f.fecha_matrimonio || "") : "");
      fd.set("anio_matrimonio", showFamilia ? (f.anio_matrimonio || "") : "");
      fd.set("nombre_conyuge", showFamilia ? (f.nombre_conyuge || "") : "");
      fd.set("numero_hijos", showFamilia ? (f.numero_hijos || "") : "");

      // contacto
      fd.set("direccion", f.direccion || "");
      fd.set("comuna", f.comuna || "");
      fd.set("telefono", f.telefono || "");
      fd.set("correo_electronico", f.correo_electronico || "");

      // iglesia/alta
      fd.set("razon_alta", f.razon_alta || "");
      fd.set("fecha_conversion", f.fecha_conversion || "");
      fd.set("fecha_bautizo", f.fecha_bautizo || "");
      fd.set("departamento", f.departamento || "");

      fd.set("asiste_antes_otra_iglesia", f.asiste_antes_otra_iglesia ? "true" : "false");
      fd.set("nombre_iglesia_anterior", showIglesiaAnterior ? (f.nombre_iglesia_anterior || "") : "");

      // membresía
      fd.set("estado_membresia", f.estado_membresia || "");
      fd.set("ded", f.ded || "");

      // laboral/salud
      fd.set("profesion_oficio", f.profesion_oficio || "");
      fd.set("lugar_trabajo_estudio", f.lugar_trabajo_estudio || "");
      fd.set("nivel_academico", f.nivel_academico || "");
      fd.set("prevision", f.prevision || "");
      fd.set("alergia_medicamento", f.alergia_medicamento || "");
      fd.set("medicacion_permanente", f.medicacion_permanente || "");
      fd.set("discapacidad_fisica", f.discapacidad_fisica ? "true" : "false");

      // vehículo
      fd.set("tiene_vehiculo", f.tiene_vehiculo ? "true" : "false");
      fd.set("patente", showVehiculoFields ? (f.patente || "") : "");
      fd.set("marca_modelo", showVehiculoFields ? (f.marca_modelo || "") : "");

      // notas
      fd.set("observaciones", f.observaciones || "");

      const res = await fetch("/api/miembros", { method: "POST", body: fd });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setGlobalErr(json?.error || "Error guardando el miembro.");
        return;
      }

      setOkMsg("✅ Miembro creado correctamente.");
      // Redirige a detalle (si tu ruta es /dashboard/miembros/[rut])
      router.push(`/dashboard/miembros/${encodeURIComponent(rutNorm)}`);
    } catch (e: any) {
      setGlobalErr(e?.message || "Error inesperado.");
    } finally {
      setSubmitting(false);
    }
  }

  // UI helpers
  function FieldError({ name }: { name: keyof FormState }) {
    const msg = stepErrors[String(name)] || "";
    const show = touched[String(name)] && !!msg;
    if (!show) return null;
    return <div className="mt-1 text-xs text-red-400">{msg}</div>;
  }

  function RequiredBadge() {
    return <span className="ml-1 text-red-400">*</span>;
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Nuevo miembro</h1>
          <p className="mt-2 text-white/60">
            Wizard paso a paso para registrar miembros con menos fricción.
          </p>
        </div>

        <button
          type="button"
          onClick={() => router.push("/dashboard/miembros")}
          className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
        >
          Volver
        </button>
      </div>

      {/* Stepper */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="flex flex-wrap gap-2">
          {steps.map((s, i) => {
            const active = i === stepIdx;
            const done = i < stepIdx;
            return (
              <div
                key={s.key}
                className={classNames(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm border",
                  active
                    ? "border-white/20 bg-white/10 text-white"
                    : done
                    ? "border-white/10 bg-black/30 text-white/80"
                    : "border-white/10 bg-black/20 text-white/60"
                )}
              >
                <span
                  className={classNames(
                    "inline-flex h-6 w-6 items-center justify-center rounded-md border text-xs",
                    active ? "border-white/30" : "border-white/10"
                  )}
                >
                  {i + 1}
                </span>
                <div className="leading-tight">
                  <div className="font-medium">{s.title}</div>
                  <div className="text-xs opacity-70">{s.desc}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* mensajes */}
        {(globalErr || okMsg) && (
          <div className="mt-4">
            {globalErr && <div className="text-sm text-red-400">{globalErr}</div>}
            {okMsg && <div className="text-sm text-emerald-400">{okMsg}</div>}
          </div>
        )}
      </div>

      {/* Contenido del paso */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        {step.key === "basico" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-white/70">
                  RUT<RequiredBadge />
                </label>
                <input
                  value={f.rut}
                  onChange={(e) => setField("rut", e.target.value)}
                  onBlur={() => setTouched((p) => ({ ...p, rut: true }))}
                  placeholder="12345678-9 (sin puntos)"
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/20"
                />
                <FieldError name="rut" />
              </div>

              <div>
                <label className="text-sm text-white/70">
                  Sexo<RequiredBadge />
                </label>
                <select
                  value={f.sexo}
                  onChange={(e) => setField("sexo", e.target.value)}
                  onBlur={() => setTouched((p) => ({ ...p, sexo: true }))}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/20"
                >
                  <option value="">Seleccionar</option>
                  {SEXO_OPTIONS.map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>
                <FieldError name="sexo" />
              </div>

              <div>
                <label className="text-sm text-white/70">
                  Nombres<RequiredBadge />
                </label>
                <input
                  value={f.nombres}
                  onChange={(e) => setField("nombres", e.target.value)}
                  onBlur={() => setTouched((p) => ({ ...p, nombres: true }))}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/20"
                />
                <FieldError name="nombres" />
              </div>

              <div>
                <label className="text-sm text-white/70">
                  Apellidos<RequiredBadge />
                </label>
                <input
                  value={f.apellidos}
                  onChange={(e) => setField("apellidos", e.target.value)}
                  onBlur={() => setTouched((p) => ({ ...p, apellidos: true }))}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/20"
                />
                <FieldError name="apellidos" />
              </div>

              <div>
                <label className="text-sm text-white/70">
                  Fecha de nacimiento<RequiredBadge />
                </label>
                <input
                  type="date"
                  value={f.fecha_nacimiento}
                  onChange={(e) => setField("fecha_nacimiento", e.target.value)}
                  onBlur={() => setTouched((p) => ({ ...p, fecha_nacimiento: true }))}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/20"
                />
                <FieldError name="fecha_nacimiento" />
              </div>

              <div>
                <label className="text-sm text-white/70">Nacionalidad</label>
                <input
                  value={f.nacionalidad}
                  onChange={(e) => setField("nacionalidad", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/20"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm text-white/70">Estado civil</label>
                <input
                  value={f.estado_civil}
                  onChange={(e) => setField("estado_civil", e.target.value)}
                  placeholder="Soltero/a, Casado/a, etc."
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/20"
                />
                {showFamilia && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                      <label className="text-sm text-white/70">Nombre cónyuge</label>
                      <input
                        value={f.nombre_conyuge}
                        onChange={(e) => setField("nombre_conyuge", e.target.value)}
                        className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/20"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-white/70">Fecha matrimonio</label>
                      <input
                        type="date"
                        value={f.fecha_matrimonio}
                        onChange={(e) => setField("fecha_matrimonio", e.target.value)}
                        className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/20"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-white/70">N° hijos</label>
                      <input
                        inputMode="numeric"
                        value={f.numero_hijos}
                        onChange={(e) => setField("numero_hijos", e.target.value)}
                        className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/20"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Foto */}
            <div className="rounded-xl border border-white/10 bg-black/20 p-4 h-fit">
              <div className="text-sm font-semibold text-white">Foto de identidad</div>
              <div className="mt-3 rounded-xl border border-white/10 bg-black/30 aspect-[4/5] flex items-center justify-center text-white/50 text-sm overflow-hidden">
                {f.foto ? (
                  // preview simple
                  <img
                    src={URL.createObjectURL(f.foto)}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  "Sin foto"
                )}
              </div>

              <div className="mt-3">
                <label className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10 cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setField("foto", e.target.files?.[0] ?? null)}
                  />
                  Seleccionar archivo
                </label>

                {f.foto && (
                  <button
                    type="button"
                    onClick={() => setField("foto", null)}
                    className="ml-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/80 hover:bg-white/5"
                  >
                    Quitar
                  </button>
                )}
              </div>

              <div className="mt-2 text-xs text-white/50">
                JPG/PNG/WebP. Opcional.
              </div>
            </div>
          </div>
        )}

        {step.key === "contacto" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="text-sm text-white/70">Dirección</label>
              <input
                value={f.direccion}
                onChange={(e) => setField("direccion", e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/20"
              />
            </div>

            <div>
              <label className="text-sm text-white/70">Comuna</label>
              <input
                value={f.comuna}
                onChange={(e) => setField("comuna", e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/20"
              />
            </div>

            <div>
              <label className="text-sm text-white/70">Teléfono</label>
              <input
                value={f.telefono}
                onChange={(e) => setField("telefono", e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/20"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm text-white/70">Correo electrónico</label>
              <input
                value={f.correo_electronico}
                onChange={(e) => setField("correo_electronico", e.target.value)}
                onBlur={() => setTouched((p) => ({ ...p, correo_electronico: true }))}
                placeholder="correo@dominio.com"
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/20"
              />
              {/* error email */}
              {touched.correo_electronico && !isEmail(f.correo_electronico) && (
                <div className="mt-1 text-xs text-red-400">Email inválido.</div>
              )}
            </div>
          </div>
        )}

        {step.key === "iglesia" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="text-sm font-semibold text-white">Membresía</div>

              <div>
                <label className="text-sm text-white/70">Estado membresía</label>
                <select
                  value={f.estado_membresia}
                  onChange={(e) => setField("estado_membresia", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/20"
                >
                  <option value="">Seleccionar</option>
                  {ESTADO_MEMBRESIA_OPTIONS.map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-white/70">DED</label>
                <select
                  value={f.ded}
                  onChange={(e) => setField("ded", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/20"
                >
                  <option value="">Seleccionar</option>
                  {DED_OPTIONS.map((x) => (
                    <option key={x} value={x === "Sin DED" ? "" : x}>
                      {x}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-white/70">Departamento</label>
                <input
                  value={f.departamento}
                  onChange={(e) => setField("departamento", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/20"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-sm font-semibold text-white">Iglesia / Alta</div>

              <div>
                <label className="text-sm text-white/70">Razón de alta</label>
                <input
                  value={f.razon_alta}
                  onChange={(e) => setField("razon_alta", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/20"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-white/70">Fecha conversión</label>
                  <input
                    type="date"
                    value={f.fecha_conversion}
                    onChange={(e) => setField("fecha_conversion", e.target.value)}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/20"
                  />
                </div>
                <div>
                  <label className="text-sm text-white/70">Fecha bautizo</label>
                  <input
                    type="date"
                    value={f.fecha_bautizo}
                    onChange={(e) => setField("fecha_bautizo", e.target.value)}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/20"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-white/80">
                <input
                  type="checkbox"
                  checked={f.asiste_antes_otra_iglesia}
                  onChange={(e) => setField("asiste_antes_otra_iglesia", e.target.checked)}
                />
                Asistía antes a otra iglesia
              </label>

              {showIglesiaAnterior && (
                <div>
                  <label className="text-sm text-white/70">Nombre iglesia anterior</label>
                  <input
                    value={f.nombre_iglesia_anterior}
                    onChange={(e) => setField("nombre_iglesia_anterior", e.target.value)}
                    onBlur={() => setTouched((p) => ({ ...p, nombre_iglesia_anterior: true }))}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/20"
                  />
                  {/* error condicional */}
                  {touched.nombre_iglesia_anterior && !!stepErrors.nombre_iglesia_anterior && (
                    <div className="mt-1 text-xs text-red-400">{stepErrors.nombre_iglesia_anterior}</div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {step.key === "salud" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="text-sm font-semibold text-white">Laboral</div>

              <div>
                <label className="text-sm text-white/70">Profesión / Oficio</label>
                <input
                  value={f.profesion_oficio}
                  onChange={(e) => setField("profesion_oficio", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/20"
                />
              </div>

              <div>
                <label className="text-sm text-white/70">Lugar trabajo / estudio</label>
                <input
                  value={f.lugar_trabajo_estudio}
                  onChange={(e) => setField("lugar_trabajo_estudio", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/20"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-white/70">Nivel académico</label>
                  <input
                    value={f.nivel_academico}
                    onChange={(e) => setField("nivel_academico", e.target.value)}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/20"
                  />
                </div>
                <div>
                  <label className="text-sm text-white/70">Previsión</label>
                  <input
                    value={f.prevision}
                    onChange={(e) => setField("prevision", e.target.value)}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/20"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-sm font-semibold text-white">Salud</div>

              <div>
                <label className="text-sm text-white/70">Alergia a medicamentos</label>
                <input
                  value={f.alergia_medicamento}
                  onChange={(e) => setField("alergia_medicamento", e.target.value)}
                  placeholder="No / ¿Cuál?"
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/20"
                />
              </div>

              <div>
                <label className="text-sm text-white/70">Medicación permanente</label>
                <input
                  value={f.medicacion_permanente}
                  onChange={(e) => setField("medicacion_permanente", e.target.value)}
                  placeholder="No / ¿Cuál?"
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/20"
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-white/80">
                <input
                  type="checkbox"
                  checked={f.discapacidad_fisica}
                  onChange={(e) => setField("discapacidad_fisica", e.target.checked)}
                />
                Discapacidad física
              </label>
            </div>
          </div>
        )}

        {step.key === "vehiculo" && (
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm text-white/80">
              <input
                type="checkbox"
                checked={f.tiene_vehiculo}
                onChange={(e) => setField("tiene_vehiculo", e.target.checked)}
              />
              Tiene vehículo (si no, se ocultan los campos)
            </label>

            {showVehiculoFields && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-white/70">Patente</label>
                  <input
                    value={f.patente}
                    onChange={(e) => setField("patente", e.target.value.toUpperCase())}
                    onBlur={() => setTouched((p) => ({ ...p, patente: true }))}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/20"
                  />
                  {touched.patente && !!stepErrors.patente && (
                    <div className="mt-1 text-xs text-red-400">{stepErrors.patente}</div>
                  )}
                </div>

                <div>
                  <label className="text-sm text-white/70">Marca / Modelo</label>
                  <input
                    value={f.marca_modelo}
                    onChange={(e) => setField("marca_modelo", e.target.value)}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/20"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {step.key === "notas" && (
          <div className="space-y-4">
            <div>
              <label className="text-sm text-white/70">Observaciones</label>
              <textarea
                value={f.observaciones}
                onChange={(e) => setField("observaciones", e.target.value)}
                rows={6}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/20"
              />
            </div>

            <div className="rounded-lg border border-white/10 bg-black/20 p-4">
              <div className="text-sm font-semibold text-white">Resumen</div>
              <div className="mt-2 text-sm text-white/70 grid grid-cols-1 md:grid-cols-2 gap-2">
                <div><span className="text-white/50">RUT:</span> {normalizeRutNoDotsWithHyphen(f.rut) || "—"}</div>
                <div><span className="text-white/50">Nombre:</span> {(f.nombres + " " + f.apellidos).trim() || "—"}</div>
                <div><span className="text-white/50">Sexo:</span> {f.sexo || "—"}</div>
                <div><span className="text-white/50">Nacimiento:</span> {f.fecha_nacimiento || "—"}</div>
                <div><span className="text-white/50">DED:</span> {f.ded || "—"}</div>
                <div><span className="text-white/50">Estado:</span> {f.estado_membresia || "—"}</div>
                <div><span className="text-white/50">Vehículo:</span> {f.tiene_vehiculo ? "Sí" : "No"}</div>
                <div><span className="text-white/50">Patente:</span> {f.patente || "—"}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer sticky de navegación */}
      <div className="sticky bottom-4 z-20">
        <div className="rounded-xl border border-white/10 bg-black/60 backdrop-blur px-4 py-3 flex items-center justify-between">
          <div className="text-sm text-white/60">
            Paso {stepIdx + 1} de {steps.length}: <span className="text-white/80">{step.title}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={back}
              disabled={stepIdx === 0 || submitting}
              className={classNames(
                "rounded-lg border border-white/10 px-4 py-2 text-sm",
                stepIdx === 0 || submitting
                  ? "bg-white/5 text-white/30 cursor-not-allowed"
                  : "bg-black/30 text-white/80 hover:bg-white/5"
              )}
            >
              ← Atrás
            </button>

            {stepIdx < steps.length - 1 ? (
              <button
                type="button"
                onClick={next}
                disabled={submitting}
                className={classNames(
                  "rounded-lg border border-white/10 px-4 py-2 text-sm",
                  submitting ? "bg-white/5 text-white/30 cursor-not-allowed" : "bg-white/10 text-white hover:bg-white/15"
                )}
              >
                Siguiente →
              </button>
            ) : (
              <button
                type="button"
                onClick={submitAll}
                disabled={submitting}
                className={classNames(
                  "rounded-lg border border-white/10 px-4 py-2 text-sm",
                  submitting ? "bg-white/5 text-white/30 cursor-not-allowed" : "bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/25"
                )}
              >
                {submitting ? "Guardando..." : "Guardar miembro"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}