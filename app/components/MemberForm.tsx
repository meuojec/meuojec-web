"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

const DED_OPTIONS = [
  "Aspirantes",
  "Jovenes",
  "Varones",
  "Damas",
  "Niños",
  "Adolescentes",
] as const;

const NACIONALIDAD = [
  "Haitian",
  "Chilena",
  "Colombiana",
  "Peruana",
  "Venezolana",
] as const;

const ESTADO_CIVIL = [
  "Soltero(a)",
  "Casado(a)",
  "Divorciado(a)",
  "Viudo(a)",
  "Separado(a)",
  "Unión Libre",
  "Conviviente",
] as const;

const COMUNAS = [
  "Quilicura",
  "Conchalí",
  "Independencia",
  "Colina",
  "Huechuraba",
  "Lampa",
  "Recoleta",
] as const;

const RAZON_ALTA = [
  "Incorporación",
  "Bautismo",
  "Traslado",
  "Recomendación",
  "Otras",
] as const;

const DEPARTAMENTO = [
  "Administración",
  "Aseo y Decoración",
  "Coro de Adoración",
  "Comunicaciones",
  "Damas",
  "Diáconos",
  "Escuela Dominical",
  "Evangelistas",
  "Juventud",
  "Músicos",
  "Niñez",
  "Recepción / Acogida",
  "Soldados",
  "Varones",
  "Vigilantes",
] as const;

const ESTADO_MEMBRESIA = [
  "Miembro",
  "Creyente",
  "Visitante",
  "Activo",
  "Inactivo",
  "En Proceso",
] as const;

const NIVEL_ACADEMICO = [
  "Básica",
  "Media",
  "Técnica-Profesional",
  "Universitaria",
  "Postgrado",
  "Otro",
] as const;

const PREVISION = [
  "Fonasa A",
  "Fonasa B",
  "Fonasa C",
  "Fonasa D",
  "Isapre",
  "Particular",
  "No sabe",
] as const;

const SEXO = ["Masculino", "Femenino"] as const;

const inputCls =
  "w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/20 disabled:opacity-60 disabled:cursor-not-allowed";
const textareaCls =
  "w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/20 min-h-[110px] disabled:opacity-60 disabled:cursor-not-allowed";

function uniqPreserve<T>(arr: T[]): T[] {
  const seen = new Set<T>();
  const out: T[] = [];
  for (const x of arr) {
    if (!seen.has(x)) {
      seen.add(x);
      out.push(x);
    }
  }
  return out;
}

function optionsWithCurrent(current: string, options: readonly string[]): string[] {
  const c = (current ?? "").trim();
  if (!c) return [...options];
  return uniqPreserve([c, ...options]);
}

function isHttpUrl(s: string) {
  return /^https?:\/\//i.test(s);
}

export type MemberRow = {
  rut: string;
  nombres: string;
  apellidos: string;

  foto_identidad_url?: string | null;

  sexo?: string | null;
  fecha_nacimiento?: string | null;
  nacionalidad?: string | null;
  edad?: number | null;
  estado_civil?: string | null;

  fecha_matrimonio?: string | null;
  anio_matrimonio?: number | null;
  nombre_conyuge?: string | null;
  numero_hijos?: number | null;

  direccion?: string | null;
  comuna?: string | null;
  telefono?: string | null;
  correo_electronico?: string | null;

  razon_alta?: string | null;
  fecha_conversion?: string | null;
  fecha_bautizo?: string | null;
  departamento?: string | null;
  asiste_antes_otra_iglesia?: boolean | null;
  nombre_iglesia_anterior?: string | null;

  estado_membresia?: string | null;
  ded?: string | null;

  profesion_oficio?: string | null;
  lugar_trabajo_estudio?: string | null;
  nivel_academico?: string | null;
  prevision?: string | null;
  alergia_medicamento?: string | null;
  medicacion_permanente?: string | null;
  discapacidad_fisica?: boolean | null;

  tiene_vehiculo?: boolean | null;
  marca_modelo?: string | null;
  patente?: string | null;

  observaciones?: string | null;

  foto_url?: string | null;
  foto_path?: string | null;

  created_at?: string | null;
  updated_at?: string | null;
};

type Props = {
  mode: "create" | "detail" | "edit";
  initialData?: MemberRow | null;
  initialFotoUrl?: string | null;
};

export default function MemberForm({ mode, initialData, initialFotoUrl }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const [isEditing, setIsEditing] = useState(mode === "create");

  // --- Foto ---
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(
    initialFotoUrl ??
      (initialData?.foto_identidad_url && isHttpUrl(initialData.foto_identidad_url)
        ? initialData.foto_identidad_url
        : initialData?.foto_url && isHttpUrl(initialData.foto_url)
        ? initialData.foto_url
        : null)
  );

  // --- Datos personales ---
  const [rut, setRut] = useState(initialData?.rut ?? "");
  const [nombres, setNombres] = useState(initialData?.nombres ?? "");
  const [apellidos, setApellidos] = useState(initialData?.apellidos ?? "");
  const [sexo, setSexo] = useState(initialData?.sexo ?? "");
  const [fechaNacimiento, setFechaNacimiento] = useState(initialData?.fecha_nacimiento ?? "");
  const [nacionalidad, setNacionalidad] = useState(initialData?.nacionalidad ?? "");
  const [estadoCivil, setEstadoCivil] = useState(initialData?.estado_civil ?? "");

  // --- Familia ---
  const [fechaMatrimonio, setFechaMatrimonio] = useState(initialData?.fecha_matrimonio ?? "");
  const [anioMatrimonio, setAnioMatrimonio] = useState(
    initialData?.anio_matrimonio != null ? String(initialData.anio_matrimonio) : ""
  );
  const [nombreConyuge, setNombreConyuge] = useState(initialData?.nombre_conyuge ?? "");
  const [numeroHijos, setNumeroHijos] = useState(
    initialData?.numero_hijos != null ? String(initialData.numero_hijos) : ""
  );

  // --- Contacto ---
  const [direccion, setDireccion] = useState(initialData?.direccion ?? "");
  const [comuna, setComuna] = useState(initialData?.comuna ?? "");
  const [telefono, setTelefono] = useState(initialData?.telefono ?? "");
  const [correoElectronico, setCorreoElectronico] = useState(initialData?.correo_electronico ?? "");

  // --- Iglesia / altas ---
  const [razonAlta, setRazonAlta] = useState(initialData?.razon_alta ?? "");
  const [fechaConversion, setFechaConversion] = useState(initialData?.fecha_conversion ?? "");
  const [fechaBautizo, setFechaBautizo] = useState(initialData?.fecha_bautizo ?? "");
  const [asisteAntesOtraIglesia, setAsisteAntesOtraIglesia] = useState(Boolean(initialData?.asiste_antes_otra_iglesia ?? false));
  const [nombreIglesiaAnterior, setNombreIglesiaAnterior] = useState(initialData?.nombre_iglesia_anterior ?? "");

  // --- Iglesia interna ---
  const [estadoMembresia, setEstadoMembresia] = useState(initialData?.estado_membresia ?? "");
  const [ded, setDed] = useState(initialData?.ded ?? "");
  const [departamento, setDepartamento] = useState<string[]>(
    (initialData?.departamento ?? "").split(",").map((s) => s.trim()).filter(Boolean)
  );

  // --- Laboral / salud ---
  const [profesionOficio, setProfesionOficio] = useState(initialData?.profesion_oficio ?? "");
  const [lugarTrabajoEstudio, setLugarTrabajoEstudio] = useState(initialData?.lugar_trabajo_estudio ?? "");
  const [nivelAcademico, setNivelAcademico] = useState(initialData?.nivel_academico ?? "");
  const [prevision, setPrevision] = useState(initialData?.prevision ?? "");
  const [alergiaMedicamento, setAlergiaMedicamento] = useState(initialData?.alergia_medicamento ?? "");
  const [medicacionPermanente, setMedicacionPermanente] = useState(initialData?.medicacion_permanente ?? "");
  const [discapacidadFisica, setDiscapacidadFisica] = useState(Boolean(initialData?.discapacidad_fisica ?? false));

  // --- Vehículo ---
  const [tieneVehiculo, setTieneVehiculo] = useState(Boolean(initialData?.tiene_vehiculo ?? false));
  const [patente, setPatente] = useState(initialData?.patente ?? "");
  const [marcaModelo, setMarcaModelo] = useState(initialData?.marca_modelo ?? "");

  // --- Notas ---
  const [observaciones, setObservaciones] = useState(initialData?.observaciones ?? "");

  // UI
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");
  const [okMsg, setOkMsg] = useState<string>("");

  const disabled = mode === "detail";

  // ✅ Para que nunca “queden en blanco” si el valor viene distinto desde DB
  const nacionalidadOptions = useMemo(() => optionsWithCurrent(nacionalidad, NACIONALIDAD), [nacionalidad]);
  const estadoCivilOptions = useMemo(() => optionsWithCurrent(estadoCivil, ESTADO_CIVIL), [estadoCivil]);
  const nivelAcademicoOptions = useMemo(() => optionsWithCurrent(nivelAcademico, NIVEL_ACADEMICO), [nivelAcademico]);

  // ✅ edad automática (siempre readOnly)
  const edad = useMemo(() => {
    if (!fechaNacimiento) return "";
    const d = new Date(fechaNacimiento);
    if (Number.isNaN(d.getTime())) return "";
    const today = new Date();
    let years = today.getFullYear() - d.getFullYear();
    const m = today.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < d.getDate())) years--;
    return years >= 0 ? String(years) : "";
  }, [fechaNacimiento]);

  // ✅ preview si el usuario selecciona nueva foto
  useEffect(() => {
    if (!fotoFile) return;
    const url = URL.createObjectURL(fotoFile);
    setFotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [fotoFile]);

  // ✅ clave: sincronizar estados cuando llega initialData (Detalle)
  useEffect(() => {
    if (!initialData) return;

    setRut(initialData.rut ?? "");
    setNombres(initialData.nombres ?? "");
    setApellidos(initialData.apellidos ?? "");
    setSexo((initialData.sexo ?? "").trim());
    setFechaNacimiento(initialData.fecha_nacimiento ?? "");
    setNacionalidad((initialData.nacionalidad ?? "").trim());
	setEstadoCivil((initialData.estado_civil ?? "").trim());

    setFechaMatrimonio(initialData.fecha_matrimonio ?? "");
    setAnioMatrimonio(initialData.anio_matrimonio != null ? String(initialData.anio_matrimonio) : "");
    setNombreConyuge(initialData.nombre_conyuge ?? "");
    setNumeroHijos(initialData.numero_hijos != null ? String(initialData.numero_hijos) : "");

    setDireccion(initialData.direccion ?? "");
    setComuna((initialData.comuna ?? "").trim());
    setTelefono(initialData.telefono ?? "");
    setCorreoElectronico(initialData.correo_electronico ?? "");

    setRazonAlta(initialData.razon_alta ?? "");
    setFechaConversion(initialData.fecha_conversion ?? "");
    setFechaBautizo(initialData.fecha_bautizo ?? "");

    setEstadoMembresia((initialData.estado_membresia ?? "").trim());
    setDed((initialData.ded ?? "").trim());

    setProfesionOficio(initialData.profesion_oficio ?? "");
    setLugarTrabajoEstudio(initialData.lugar_trabajo_estudio ?? "");
    setNivelAcademico((initialData.nivel_academico ?? "").trim());
    setPrevision(initialData.prevision ?? "");

    setTieneVehiculo(Boolean(initialData.tiene_vehiculo ?? false));
    setPatente(initialData.patente ?? "");
    setMarcaModelo(initialData.marca_modelo ?? "");

    setObservaciones(initialData.observaciones ?? "");

    // ✅ foto en detalle
    if (initialFotoUrl) {
      setFotoPreview(initialFotoUrl);
    } else {
      const url = initialData.foto_identidad_url ?? initialData.foto_url ?? null;
      if (url && isHttpUrl(url)) setFotoPreview(url);
    }
  }, [initialData, initialFotoUrl]);

  // Si no es casado(a), limpiamos familia
  useEffect(() => {
    if (estadoCivil !== "Casado(a)") {
      setFechaMatrimonio("");
      setAnioMatrimonio("");
      setNombreConyuge("");
      setNumeroHijos("");
    }
  }, [estadoCivil]);

  // Si no asiste antes otra iglesia, limpiamos nombre
  useEffect(() => {
    if (!asisteAntesOtraIglesia) setNombreIglesiaAnterior("");
  }, [asisteAntesOtraIglesia]);

  // Si no tiene vehículo, limpiamos campos
  useEffect(() => {
    if (!tieneVehiculo) {
      setPatente("");
      setMarcaModelo("");
    }
  }, [tieneVehiculo]);

  function normalizeRutInput(v: string) {
    let s = v.toUpperCase().replace(/\s+/g, "").replace(/\./g, "");
    s = s.replace(/[^0-9K-]/g, "");
    const parts = s.split("-").filter(Boolean);
    if (parts.length >= 2) {
      const body = parts[0];
      const dv = parts[1].slice(0, 1);
      return `${body}-${dv}`;
    }
    if (!s.includes("-") && s.length >= 2) {
      const body = s.slice(0, -1);
      const dv = s.slice(-1);
      return `${body}-${dv}`;
    }
    return s;
  }

  function resetAll() {
    setFotoFile(null);
    setFotoPreview(null);

    setRut("");
    setNombres("");
    setApellidos("");
    setSexo("");
    setFechaNacimiento("");
    setNacionalidad("");
    setEstadoCivil("");

    setFechaMatrimonio("");
    setAnioMatrimonio("");
    setNombreConyuge("");
    setNumeroHijos("");

    setDireccion("");
    setComuna("");
    setTelefono("");
    setCorreoElectronico("");

    setRazonAlta("");
    setFechaConversion("");
    setFechaBautizo("");
    setAsisteAntesOtraIglesia(false);
    setNombreIglesiaAnterior("");

    setEstadoMembresia("");
    setDed("");
    setDepartamento([]);

    setProfesionOficio("");
    setLugarTrabajoEstudio("");
    setNivelAcademico("");
    setPrevision("");
    setAlergiaMedicamento("");
    setMedicacionPermanente("");
    setDiscapacidadFisica(false);

    setTieneVehiculo(false);
    setPatente("");
    setMarcaModelo("");

    setObservaciones("");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setOkMsg("");

    const rutNorm = normalizeRutInput(rut);

    if (!rutNorm || !rutNorm.includes("-")) {
      setErr("RUT inválido. Debe ser sin puntos y con guion (Ej: 12345678-9).");
      return;
    }
    if (!nombres.trim() || !apellidos.trim()) {
      setErr("Completa Nombres y Apellidos.");
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();

      if (fotoFile) fd.set("foto", fotoFile);

      fd.set("rut", rutNorm);
      fd.set("nombres", nombres.trim());
      fd.set("apellidos", apellidos.trim());
      fd.set("sexo", sexo || "");
      fd.set("fecha_nacimiento", fechaNacimiento || "");
      fd.set("edad", edad || "");
      fd.set("nacionalidad", nacionalidad || "");
      fd.set("estado_civil", estadoCivil || "");

      if (estadoCivil === "Casado(a)") {
        fd.set("fecha_matrimonio", fechaMatrimonio || "");
        fd.set("anio_matrimonio", anioMatrimonio || "");
        fd.set("nombre_conyuge", nombreConyuge.trim() || "");
        fd.set("numero_hijos", numeroHijos || "");
      }

      fd.set("direccion", direccion.trim() || "");
      fd.set("comuna", comuna || "");
      fd.set("telefono", telefono.trim() || "");
      fd.set("correo_electronico", correoElectronico.trim() || "");

      fd.set("razon_alta", razonAlta || "");
      fd.set("fecha_conversion", fechaConversion || "");
      fd.set("fecha_bautizo", fechaBautizo || "");
      fd.set("asiste_antes_otra_iglesia", asisteAntesOtraIglesia ? "true" : "false");
      fd.set("nombre_iglesia_anterior", asisteAntesOtraIglesia ? (nombreIglesiaAnterior.trim() || "") : "");

      fd.set("estado_membresia", estadoMembresia || "");
      fd.set("ded", ded || "");
      fd.set("departamento", departamento.join(", "));

      fd.set("profesion_oficio", profesionOficio.trim() || "");
      fd.set("lugar_trabajo_estudio", lugarTrabajoEstudio.trim() || "");
      fd.set("nivel_academico", nivelAcademico || "");
      fd.set("prevision", prevision || "");
      fd.set("alergia_medicamento", alergiaMedicamento.trim() || "");
      fd.set("medicacion_permanente", medicacionPermanente.trim() || "");
      fd.set("discapacidad_fisica", discapacidadFisica ? "true" : "false");

      fd.set("tiene_vehiculo", tieneVehiculo ? "true" : "false");
      if (tieneVehiculo) {
        fd.set("patente", patente.trim().toUpperCase() || "");
        fd.set("marca_modelo", marcaModelo.trim() || "");
      }

      fd.set("observaciones", observaciones.trim() || "");

      const url = mode === "create" ? "/api/miembros" : `/api/miembros/${encodeURIComponent(rutNorm)}`;
      const method = mode === "create" ? "POST" : "PUT";

      const res = await fetch(url, { method, body: fd });

      let json: any = {};
      try {
        json = await res.json();
      } catch {}

      if (!res.ok) {
        throw new Error(json?.error || "Error al guardar");
      }

      const rutGuardado = String(json?.rut ?? rutNorm).trim();
      setOkMsg(`✅ Guardado: ${rutGuardado}`);

      if (mode === "create") {
        resetAll();
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
  // ✅ quitar ?edit=1 y volver a modo detalle
  router.replace(pathname);
  router.refresh();
}
    } catch (e: any) {
      setErr(String(e?.message ?? "Error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* DATOS PERSONALES */}
      <Card title="Datos Personales">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_210px] gap-4 items-stretch">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="RUT" hint="Sin puntos, con guion. Ej: 12345678-9">
                <input
                  className={inputCls}
                  value={rut}
                  onChange={(e) => setRut(normalizeRutInput(e.target.value))}
                  placeholder="12345678-9"
                  disabled={mode === "detail"} // rut siempre bloqueado en detalle
                />
              </Field>

              <Field label="Edad (auto)" hint="Calculada con fecha de nacimiento">
                <input className={inputCls} value={edad} readOnly placeholder="—" />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <Field label="Nombres">
                <input className={inputCls} value={nombres} onChange={(e) => setNombres(e.target.value)} disabled={disabled} />
              </Field>

              <Field label="Apellidos">
                <input className={inputCls} value={apellidos} onChange={(e) => setApellidos(e.target.value)} disabled={disabled} />
              </Field>

              <Field label="Sexo">
                <select className={inputCls} value={sexo} onChange={(e) => setSexo(e.target.value)} disabled={disabled}>
                  <option value="">—</option>
                  {SEXO.map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Fecha de Nacimiento" hint="Formato YYYY-MM-DD">
                <input type="date" className={inputCls} value={fechaNacimiento} onChange={(e) => setFechaNacimiento(e.target.value)} disabled={disabled} />
              </Field>

              <Field label="Nacionalidad">
                <select className={inputCls} value={nacionalidad} onChange={(e) => setNacionalidad(e.target.value)} disabled={disabled}>
                  <option value="">—</option>
                  {nacionalidadOptions.map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Estado Civil">
                <select className={inputCls} value={estadoCivil} onChange={(e) => setEstadoCivil(e.target.value)} disabled={disabled}>
                  <option value="">—</option>
                  {estadoCivilOptions.map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </div>

          <FotoBox
            fotoPreview={fotoPreview}
            fotoFile={fotoFile}
            onFotoChange={(f) => setFotoFile(f)}
            onClear={() => setFotoFile(null)}
            disabled={disabled}
          />
        </div>

        {estadoCivil === "Casado(a)" && (
          <div className="mt-5">
            <SectionTitle>Familia</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <Field label="Fecha Matrimonio">
                <input type="date" className={inputCls} value={fechaMatrimonio} onChange={(e) => setFechaMatrimonio(e.target.value)} disabled={disabled} />
              </Field>

              <Field label="Año Matrimonio">
                <input className={inputCls} value={anioMatrimonio} onChange={(e) => setAnioMatrimonio(e.target.value.replace(/[^\d]/g, ""))} placeholder="Ej: 2010" disabled={disabled} />
              </Field>

              <Field label="Nombre Cónyuge">
                <input className={inputCls} value={nombreConyuge} onChange={(e) => setNombreConyuge(e.target.value)} disabled={disabled} />
              </Field>

              <Field label="Número Hijos">
                <input className={inputCls} value={numeroHijos} onChange={(e) => setNumeroHijos(e.target.value.replace(/[^\d]/g, ""))} placeholder="0" disabled={disabled} />
              </Field>
            </div>
          </div>
        )}
      </Card>

      {/* CONTACTO */}
      <Card title="Contacto">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <Field label="Dirección">
            <input className={inputCls} value={direccion} onChange={(e) => setDireccion(e.target.value)} disabled={disabled} />
          </Field>

          <Field label="Comuna">
            <select className={inputCls} value={comuna} onChange={(e) => setComuna(e.target.value)} disabled={disabled}>
              <option value="">—</option>
              {COMUNAS.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Teléfono">
            <input className={inputCls} value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="Ej: 9 1234 5678" disabled={disabled} />
          </Field>

          <Field label="Correo electrónico">
            <input className={inputCls} value={correoElectronico} onChange={(e) => setCorreoElectronico(e.target.value)} placeholder="correo@dominio.com" disabled={disabled} />
          </Field>
        </div>
      </Card>

      {/* IGLESIA / ALTAS */}
      <Card title="Iglesia / Alta">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <Field label="Razón de Alta">
            <select className={inputCls} value={razonAlta} onChange={(e) => setRazonAlta(e.target.value)} disabled={disabled}>
              <option value="">—</option>
              {RAZON_ALTA.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Fecha Conversión">
            <input type="date" className={inputCls} value={fechaConversion} onChange={(e) => setFechaConversion(e.target.value)} disabled={disabled} />
          </Field>

          <Field label="Fecha Bautizo">
            <input type="date" className={inputCls} value={fechaBautizo} onChange={(e) => setFechaBautizo(e.target.value)} disabled={disabled} />
          </Field>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <input id="asisteAntes" type="checkbox" className="h-4 w-4" checked={asisteAntesOtraIglesia} onChange={(e) => setAsisteAntesOtraIglesia(e.target.checked)} disabled={disabled} />
          <label htmlFor="asisteAntes" className="text-sm text-white/85">
            Asistía antes a otra iglesia
          </label>
        </div>

        {asisteAntesOtraIglesia && (
          <div className="mt-3 max-w-[520px]">
            <Field label="Nombre iglesia anterior">
              <input className={inputCls} value={nombreIglesiaAnterior} onChange={(e) => setNombreIglesiaAnterior(e.target.value)} disabled={disabled} />
            </Field>
          </div>
        )}
      </Card>

      {/* IGLESIA INTERNA */}
      <Card title="Datos de Membresía">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <Field label="Estado Membresía">
            <select className={inputCls} value={estadoMembresia} onChange={(e) => setEstadoMembresia(e.target.value)} disabled={disabled}>
              <option value="">—</option>
              {ESTADO_MEMBRESIA.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </Field>

          <Field label="DED">
            <select className={inputCls} value={ded} onChange={(e) => setDed(e.target.value)} disabled={disabled}>
              <option value="">—</option>
              {DED_OPTIONS.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="mt-4 max-w-[980px]">
          <MultiSelectDropdown
            label="Departamento"
            hint="Selecciona uno o varios"
            options={DEPARTAMENTO}
            value={departamento}
            onChange={setDepartamento}
            placeholder="Seleccionar departamentos..."
            disabled={disabled}
          />
        </div>
      </Card>

      {/* LABORAL / SALUD */}
      <Card title="Laboral / Salud">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <Field label="Profesión / Oficio">
            <input className={inputCls} value={profesionOficio} onChange={(e) => setProfesionOficio(e.target.value)} disabled={disabled} />
          </Field>

          <Field label="Lugar trabajo / estudio">
            <input className={inputCls} value={lugarTrabajoEstudio} onChange={(e) => setLugarTrabajoEstudio(e.target.value)} disabled={disabled} />
          </Field>

          <Field label="Nivel académico">
            <select className={inputCls} value={nivelAcademico} onChange={(e) => setNivelAcademico(e.target.value)} disabled={disabled}>
              <option value="">—</option>
              {nivelAcademicoOptions.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Previsión de Salud">
            <select className={inputCls} value={prevision} onChange={(e) => setPrevision(e.target.value)} disabled={disabled}>
              <option value="">—</option>
              {PREVISION.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Alergia a medicamentos">
            <input className={inputCls} value={alergiaMedicamento} onChange={(e) => setAlergiaMedicamento(e.target.value)} placeholder="No / ¿Cuál?" disabled={disabled} />
          </Field>

          <Field label="Medicación permanente">
            <input className={inputCls} value={medicacionPermanente} onChange={(e) => setMedicacionPermanente(e.target.value)} placeholder="No / ¿Cuál?" disabled={disabled} />
          </Field>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <input id="discapacidad" type="checkbox" className="h-4 w-4" checked={discapacidadFisica} onChange={(e) => setDiscapacidadFisica(e.target.checked)} disabled={disabled} />
          <label htmlFor="discapacidad" className="text-sm text-white/85">
            Discapacidad física
          </label>
        </div>
      </Card>

      {/* VEHICULO */}
      <Card title="Vehículo">
        <div className="flex items-center gap-3 mb-3">
          <input id="tieneVehiculo" type="checkbox" className="h-4 w-4" checked={tieneVehiculo} onChange={(e) => setTieneVehiculo(e.target.checked)} disabled={disabled} />
          <label htmlFor="tieneVehiculo" className="text-sm text-white/85">
            Tiene vehículo
          </label>
          <span className="text-xs text-white/50">(si no, se ocultan los campos)</span>
        </div>

        {tieneVehiculo && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <Field label="Patente">
              <input className={inputCls} value={patente} onChange={(e) => setPatente(e.target.value)} placeholder="Ej: ABCD12" disabled={disabled} />
            </Field>

            <Field label="Marca / Modelo" hint="">
              <input className={inputCls} value={marcaModelo} onChange={(e) => setMarcaModelo(e.target.value)} placeholder="Ej: Hyundai Creta" disabled={disabled} />
            </Field>
          </div>
        )}
      </Card>

      {/* NOTAS */}
      <Card title="Notas">
        <Field label="Observaciones">
          <textarea className={textareaCls} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} disabled={disabled} />
        </Field>
      </Card>

      {/* MENSAJES */}
      {err && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{err}</div>
      )}
      {okMsg && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">{okMsg}</div>
      )}

      {/* BOTONES edit (aparecen solo cuando estás en ?edit=1) */}
{mode === "edit" && (
  <div className="flex flex-wrap items-center gap-3">
    <button
      type="submit"
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white text-black px-4 py-2 text-sm hover:bg-white/90 disabled:opacity-60"
    >
      <span aria-hidden>💾</span>
      {loading ? "Guardando..." : "Guardar"}
    </button>
  </div>
)}

      {/* BOTONES create */}
      {mode === "create" && (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg border border-white/10 bg-white text-black px-4 py-2 text-sm hover:bg-white/90 disabled:opacity-60"
          >
            {loading ? "Guardando..." : "Guardar y seguir"}
          </button>

          <button
            type="button"
            onClick={() => resetAll()}
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
          >
            Limpiar
          </button>
        </div>
      )}
    </form>
  );
}

/* ---------------- UI helpers ---------------- */

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
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-3">
        <div className="text-sm text-white/80">{label}</div>
        {hint ? <div className="text-xs text-white/50">{hint}</div> : null}
      </div>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="text-sm font-semibold text-white/80 mb-3">{children}</div>;
}

function FotoBox({
  fotoPreview,
  fotoFile,
  onFotoChange,
  onClear,
  disabled,
}: {
  fotoPreview: string | null;
  fotoFile: File | null;
  onFotoChange: (f: File | null) => void;
  onClear: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-3 h-full flex flex-col self-start">
      <div className="text-center font-semibold mb-3">Foto de Identidad</div>

      <div className="mx-auto max-w-[150px]">
        <div className="aspect-[4/5] w-full overflow-hidden rounded-xl border border-white/10 bg-black/30 flex items-center justify-center">
          {fotoPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={fotoPreview} alt="Foto" className="h-full w-full object-cover" />
          ) : (
            <div className="text-sm text-white/50">Sin foto</div>
          )}
        </div>

        <div className="mt-3 space-y-2 text-center">
          <label
            className={[
              "inline-block rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs hover:bg-white/10",
              disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer",
            ].join(" ")}
          >
            Seleccionar archivo
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={disabled}
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                onFotoChange(f);
              }}
            />
          </label>

          <div className="text-xs text-white/50">
            {fotoFile ? fotoFile.name : "Sin archivos seleccionados"}
          </div>

          {fotoFile && !disabled && (
            <button type="button" onClick={onClear} className="text-xs text-white/60 hover:text-white">
              Quitar foto
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * ✅ Desplegable compacto con checkboxes (multi-select) — sin Ctrl
 */
function MultiSelectDropdown({
  label,
  hint,
  options,
  value,
  onChange,
  placeholder = "Seleccionar...",
  disabled,
}: {
  label: string;
  hint?: string;
  options: readonly string[];
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const selectedText =
    value.length === 0 ? "" : value.length <= 2 ? value.join(", ") : `${value.length} seleccionados`;

  return (
    <div className="space-y-1" ref={boxRef}>
      <div className="flex items-baseline justify-between gap-3">
        <div className="text-sm text-white/80">{label}</div>
        {hint ? <div className="text-xs text-white/50">{hint}</div> : null}
      </div>

      <button
        type="button"
        onClick={() => !disabled && setOpen((s) => !s)}
        disabled={disabled}
        className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-left text-sm hover:bg-white/5 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <div className="flex items-center justify-between gap-3">
          <span className={selectedText ? "text-white/90" : "text-white/50"}>{selectedText || placeholder}</span>
          <span className="text-white/50">{open ? "▲" : "▼"}</span>
        </div>
      </button>

      {open && !disabled && (
        <div className="mt-2 rounded-xl border border-white/10 bg-black/60 backdrop-blur p-2 max-h-[260px] overflow-auto">
          <div className="flex items-center justify-between gap-2 px-2 py-1">
            <div className="text-xs text-white/50">Marca uno o varios</div>
            {value.length > 0 && (
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-xs rounded-md border border-white/10 bg-white/5 px-2 py-1 hover:bg-white/10"
              >
                Limpiar
              </button>
            )}
          </div>

          <div className="mt-1 space-y-1">
            {options.map((opt) => {
              const checked = value.includes(opt);
              return (
                <label
                  key={opt}
                  className={[
                    "flex items-center gap-2 rounded-lg px-2 py-2 cursor-pointer select-none",
                    checked ? "bg-white/10" : "hover:bg-white/5",
                  ].join(" ")}
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={checked}
                    onChange={() => {
                      onChange(checked ? value.filter((x) => x !== opt) : [...value, opt]);
                    }}
                  />
                  <span className="text-sm text-white/90">{opt}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {value.length > 0 && (
        <div className="text-xs text-white/50">
          Seleccionados: <span className="text-white/70">{value.join(", ")}</span>
        </div>
      )}
    </div>
  );
}