"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

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
  "w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/20";
const textareaCls =
  "w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/20 min-h-[110px]";

export default function MemberCreateForm() {
  const router = useRouter();

  // --- Foto ---
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);

  // --- Datos personales ---
  const [rut, setRut] = useState("");
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [sexo, setSexo] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState(""); // YYYY-MM-DD
  const [nacionalidad, setNacionalidad] = useState("");
  const [estadoCivil, setEstadoCivil] = useState("");

  // --- Familia (solo si Casado(a)) ---
  const [fechaMatrimonio, setFechaMatrimonio] = useState("");
  const [anioMatrimonio, setAnioMatrimonio] = useState(""); // int
  const [nombreConyuge, setNombreConyuge] = useState("");
  const [numeroHijos, setNumeroHijos] = useState(""); // int

  // --- Contacto ---
  const [direccion, setDireccion] = useState("");
  const [comuna, setComuna] = useState("");
  const [telefono, setTelefono] = useState("");
  const [correoElectronico, setCorreoElectronico] = useState("");

  // --- Iglesia / altas ---
  const [razonAlta, setRazonAlta] = useState("");
  const [fechaConversion, setFechaConversion] = useState("");
  const [fechaBautizo, setFechaBautizo] = useState("");
  const [asisteAntesOtraIglesia, setAsisteAntesOtraIglesia] = useState(false);
  const [nombreIglesiaAnterior, setNombreIglesiaAnterior] = useState("");

  // --- Iglesia interna ---
  const [estadoMembresia, setEstadoMembresia] = useState("");
  const [ded, setDed] = useState("");
  const [departamento, setDepartamento] = useState<string[]>([]); // ✅ multi

  // --- Laboral / salud ---
  const [profesionOficio, setProfesionOficio] = useState("");
  const [lugarTrabajoEstudio, setLugarTrabajoEstudio] = useState("");
  const [nivelAcademico, setNivelAcademico] = useState("");
  const [prevision, setPrevision] = useState("");
  const [alergiaMedicamento, setAlergiaMedicamento] = useState("");
  const [medicacionPermanente, setMedicacionPermanente] = useState("");
  const [discapacidadFisica, setDiscapacidadFisica] = useState(false);

  // --- Vehículo ---
  const [tieneVehiculo, setTieneVehiculo] = useState(false);
  const [patente, setPatente] = useState("");
  const [marcaModelo, setMarcaModelo] = useState(""); // campo: marca_modelo

  // --- Notas ---
  const [observaciones, setObservaciones] = useState("");

  // UI
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");
  const [okMsg, setOkMsg] = useState<string>("");

  // ✅ edad automática
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

  // ✅ foto preview
  useEffect(() => {
    if (!fotoFile) {
      setFotoPreview(null);
      return;
    }
    const url = URL.createObjectURL(fotoFile);
    setFotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [fotoFile]);

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

  function resetAll() {
    setFotoFile(null);
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

  function normalizeRutInput(v: string) {
    // Permite que el usuario pegue con puntos/espacios. Guardamos SIN puntos y CON guion.
    let s = v.toUpperCase().replace(/\s+/g, "").replace(/\./g, "");
    // Deja solo 0-9 K y guion
    s = s.replace(/[^0-9K-]/g, "");
    // Si hay más de un guion, deja el primero
    const parts = s.split("-").filter(Boolean);
    if (parts.length >= 2) {
      const body = parts[0];
      const dv = parts[1].slice(0, 1);
      return `${body}-${dv}`;
    }
    // Si no hay guion y el largo >=2, intenta poner guion antes del último char
    if (!s.includes("-") && s.length >= 2) {
      const body = s.slice(0, -1);
      const dv = s.slice(-1);
      return `${body}-${dv}`;
    }
    return s;
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

      // foto (opcional)
      if (fotoFile) fd.set("foto", fotoFile);

      // obligatorios base
      fd.set("rut", rutNorm);
      fd.set("nombres", nombres.trim());
      fd.set("apellidos", apellidos.trim());
      fd.set("sexo", sexo || "");
      fd.set("fecha_nacimiento", fechaNacimiento || "");
      fd.set("edad", edad || ""); // por si tu API/DB lo guarda
      fd.set("nacionalidad", nacionalidad || "");
      fd.set("estado_civil", estadoCivil || "");

      // familia solo si casado(a)
      if (estadoCivil === "Casado(a)") {
        fd.set("fecha_matrimonio", fechaMatrimonio || "");
        fd.set("anio_matrimonio", anioMatrimonio || "");
        fd.set("nombre_conyuge", nombreConyuge.trim() || "");
        fd.set("numero_hijos", numeroHijos || "");
      }

      // contacto
      fd.set("direccion", direccion.trim() || "");
      fd.set("comuna", comuna || "");
      fd.set("telefono", telefono.trim() || "");
      fd.set("correo_electronico", correoElectronico.trim() || "");

      // altas / iglesia
      fd.set("razon_alta", razonAlta || "");
      fd.set("fecha_conversion", fechaConversion || "");
      fd.set("fecha_bautizo", fechaBautizo || "");
      fd.set("asiste_antes_otra_iglesia", asisteAntesOtraIglesia ? "true" : "false");
      fd.set("nombre_iglesia_anterior", asisteAntesOtraIglesia ? (nombreIglesiaAnterior.trim() || "") : "");

      // iglesia interna
      fd.set("estado_membresia", estadoMembresia || "");
      fd.set("ded", ded || "");
      fd.set("departamento", departamento.join(", ")); // ✅ CSV en texto

      // laboral / salud
      fd.set("profesion_oficio", profesionOficio.trim() || "");
      fd.set("lugar_trabajo_estudio", lugarTrabajoEstudio.trim() || "");
      fd.set("nivel_academico", nivelAcademico || "");
      fd.set("prevision", prevision || "");
      fd.set("alergia_medicamento", alergiaMedicamento.trim() || "");
      fd.set("medicacion_permanente", medicacionPermanente.trim() || "");
      fd.set("discapacidad_fisica", discapacidadFisica ? "true" : "false");

      // vehículo
      fd.set("tiene_vehiculo", tieneVehiculo ? "true" : "false");
      if (tieneVehiculo) {
        fd.set("patente", patente.trim().toUpperCase() || "");
        fd.set("marca_modelo", marcaModelo.trim() || ""); // ✅ tu campo correcto
      }

      // notas
      fd.set("observaciones", observaciones.trim() || "");

      const res = await fetch("/api/miembros", { method: "POST", body: fd });

      let json: any = {};
      try {
        json = await res.json();
      } catch {}

      if (!res.ok) {
        throw new Error(json?.error || "Error al guardar");
      }

      const rutGuardado = String(json?.rut ?? rutNorm).trim();
      setOkMsg(`✅ Guardado: ${rutGuardado}`);

      // dejar listo para seguir ingresando
      resetAll();
      // opcional: mantener scroll arriba
      window.scrollTo({ top: 0, behavior: "smooth" });
      // refresca lista si vuelves
      router.refresh();
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
        {/* ✅ grid superior: izquierda contenido, derecha foto pequeña */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_210px] gap-4 items-stretch">
          <div className="space-y-4">
            {/* RUT + Edad (sin hueco raro) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="RUT" hint="Sin puntos, con guion. Ej: 12345678-9">
                <input
                  className={inputCls}
                  value={rut}
                  onChange={(e) => setRut(normalizeRutInput(e.target.value))}
                  placeholder="12345678-9"
                />
              </Field>

              <Field label="Edad (auto)" hint="Calculada con fecha de nacimiento">
                <input className={inputCls} value={edad} readOnly placeholder="—" />
              </Field>
            </div>

            {/* 3 por fila en pantallas grandes */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <Field label="Nombres">
                <input className={inputCls} value={nombres} onChange={(e) => setNombres(e.target.value)} />
              </Field>

              <Field label="Apellidos">
                <input className={inputCls} value={apellidos} onChange={(e) => setApellidos(e.target.value)} />
              </Field>

              <Field label="Sexo">
                <select className={inputCls} value={sexo} onChange={(e) => setSexo(e.target.value)}>
                  <option value="">—</option>
                  {SEXO.map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Fecha de Nacimiento" hint="Formato YYYY-MM-DD">
                <input
                  type="date"
                  className={inputCls}
                  value={fechaNacimiento}
                  onChange={(e) => setFechaNacimiento(e.target.value)}
                />
              </Field>

              <Field label="Nacionalidad">
                <select className={inputCls} value={nacionalidad} onChange={(e) => setNacionalidad(e.target.value)}>
                  <option value="">—</option>
                  {NACIONALIDAD.map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Estado Civil">
                <select className={inputCls} value={estadoCivil} onChange={(e) => setEstadoCivil(e.target.value)}>
                  <option value="">—</option>
                  {ESTADO_CIVIL.map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </div>

          {/* ✅ Foto pequeña y h-fit */}
          <FotoBox
            fotoPreview={fotoPreview}
            fotoFile={fotoFile}
            onFotoChange={(f) => setFotoFile(f)}
            onClear={() => setFotoFile(null)}
          />
        </div>

        {/* Familia solo si Casado(a) */}
        {estadoCivil === "Casado(a)" && (
          <div className="mt-5">
            <SectionTitle>Familia</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <Field label="Fecha Matrimonio">
                <input
                  type="date"
                  className={inputCls}
                  value={fechaMatrimonio}
                  onChange={(e) => setFechaMatrimonio(e.target.value)}
                />
              </Field>

              <Field label="Año Matrimonio">
                <input
                  className={inputCls}
                  value={anioMatrimonio}
                  onChange={(e) => setAnioMatrimonio(e.target.value.replace(/[^\d]/g, ""))}
                  placeholder="Ej: 2010"
                />
              </Field>

              <Field label="Nombre Cónyuge">
                <input className={inputCls} value={nombreConyuge} onChange={(e) => setNombreConyuge(e.target.value)} />
              </Field>

              <Field label="Número Hijos">
                <input
                  className={inputCls}
                  value={numeroHijos}
                  onChange={(e) => setNumeroHijos(e.target.value.replace(/[^\d]/g, ""))}
                  placeholder="0"
                />
              </Field>
            </div>
          </div>
        )}
      </Card>

      {/* CONTACTO */}
      <Card title="Contacto">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <Field label="Dirección">
            <input className={inputCls} value={direccion} onChange={(e) => setDireccion(e.target.value)} />
          </Field>

          <Field label="Comuna">
            <select className={inputCls} value={comuna} onChange={(e) => setComuna(e.target.value)}>
              <option value="">—</option>
              {COMUNAS.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Teléfono">
            <input className={inputCls} value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="Ej: 9 1234 5678" />
          </Field>

          <Field label="Correo electrónico">
            <input
              className={inputCls}
              value={correoElectronico}
              onChange={(e) => setCorreoElectronico(e.target.value)}
              placeholder="correo@dominio.com"
            />
          </Field>
        </div>
      </Card>

      {/* IGLESIA / ALTAS */}
      <Card title="Iglesia / Alta">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <Field label="Razón de Alta">
            <select className={inputCls} value={razonAlta} onChange={(e) => setRazonAlta(e.target.value)}>
              <option value="">—</option>
              {RAZON_ALTA.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Fecha Conversión">
            <input type="date" className={inputCls} value={fechaConversion} onChange={(e) => setFechaConversion(e.target.value)} />
          </Field>

          <Field label="Fecha Bautizo">
            <input type="date" className={inputCls} value={fechaBautizo} onChange={(e) => setFechaBautizo(e.target.value)} />
          </Field>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <input
            id="asisteAntes"
            type="checkbox"
            className="h-4 w-4"
            checked={asisteAntesOtraIglesia}
            onChange={(e) => setAsisteAntesOtraIglesia(e.target.checked)}
          />
          <label htmlFor="asisteAntes" className="text-sm text-white/85">
            Asistía antes a otra iglesia
          </label>
        </div>

        {asisteAntesOtraIglesia && (
          <div className="mt-3 max-w-[520px]">
            <Field label="Nombre iglesia anterior">
              <input className={inputCls} value={nombreIglesiaAnterior} onChange={(e) => setNombreIglesiaAnterior(e.target.value)} />
            </Field>
          </div>
        )}
      </Card>

      {/* IGLESIA INTERNA */}
      <Card title="Datos de Membresía">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <Field label="Estado Membresía">
            <select className={inputCls} value={estadoMembresia} onChange={(e) => setEstadoMembresia(e.target.value)}>
              <option value="">—</option>
              {ESTADO_MEMBRESIA.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </Field>

          <Field label="DED">
            <select className={inputCls} value={ded} onChange={(e) => setDed(e.target.value)}>
              <option value="">—</option>
              {DED_OPTIONS.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {/* ✅ Departamento compacto (dropdown multi checkbox) */}
        <div className="mt-4 max-w-[980px]">
          <MultiSelectDropdown
            label="Departamento"
            hint="Selecciona uno o varios"
            options={DEPARTAMENTO}
            value={departamento}
            onChange={setDepartamento}
            placeholder="Seleccionar departamentos..."
          />
        </div>
      </Card>

      {/* LABORAL / SALUD */}
      <Card title="Laboral / Salud">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <Field label="Profesión / Oficio">
            <input className={inputCls} value={profesionOficio} onChange={(e) => setProfesionOficio(e.target.value)} />
          </Field>

          <Field label="Lugar trabajo / estudio">
            <input className={inputCls} value={lugarTrabajoEstudio} onChange={(e) => setLugarTrabajoEstudio(e.target.value)} />
          </Field>

          <Field label="Nivel académico">
            <select className={inputCls} value={nivelAcademico} onChange={(e) => setNivelAcademico(e.target.value)}>
              <option value="">—</option>
              {NIVEL_ACADEMICO.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Previsión de Salud">
            <select className={inputCls} value={prevision} onChange={(e) => setPrevision(e.target.value)}>
              <option value="">—</option>
              {PREVISION.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Alergia a medicamentos">
            <input className={inputCls} value={alergiaMedicamento} onChange={(e) => setAlergiaMedicamento(e.target.value)} placeholder="No / ¿Cuál?" />
          </Field>

          <Field label="Medicación permanente">
            <input className={inputCls} value={medicacionPermanente} onChange={(e) => setMedicacionPermanente(e.target.value)} placeholder="No / ¿Cuál?" />
          </Field>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <input
            id="discapacidad"
            type="checkbox"
            className="h-4 w-4"
            checked={discapacidadFisica}
            onChange={(e) => setDiscapacidadFisica(e.target.checked)}
          />
          <label htmlFor="discapacidad" className="text-sm text-white/85">
            Discapacidad física
          </label>
        </div>
      </Card>

      {/* VEHICULO */}
      <Card title="Vehículo">
        {/* ✅ checkbox a la izquierda */}
        <div className="flex items-center gap-3 mb-3">
          <input
            id="tieneVehiculo"
            type="checkbox"
            className="h-4 w-4"
            checked={tieneVehiculo}
            onChange={(e) => setTieneVehiculo(e.target.checked)}
          />
          <label htmlFor="tieneVehiculo" className="text-sm text-white/85">
            Tiene vehículo
          </label>
          <span className="text-xs text-white/50">(si no, se ocultan los campos)</span>
        </div>

        {tieneVehiculo && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <Field label="Patente">
              <input className={inputCls} value={patente} onChange={(e) => setPatente(e.target.value)} placeholder="Ej: ABCD12" />
            </Field>

            <Field label="Marca / Modelo" hint="campo: marca_modelo">
              <input className={inputCls} value={marcaModelo} onChange={(e) => setMarcaModelo(e.target.value)} placeholder="Ej: Hyundai Creta" />
            </Field>
          </div>
        )}
      </Card>

      {/* NOTAS */}
      <Card title="Notas">
        <Field label="Observaciones">
          <textarea className={textareaCls} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
        </Field>
      </Card>

      {/* MENSAJES */}
      {err && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {err}
        </div>
      )}
      {okMsg && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
          {okMsg}
        </div>
      )}

      {/* BOTONES */}
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
}: {
  fotoPreview: string | null;
  fotoFile: File | null;
  onFotoChange: (f: File | null) => void;
  onClear: () => void;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-3 h-full flex flex-col self-start">
      
      {/* TÍTULO CENTRADO */}
      <div className="text-center font-semibold mb-3">
        Foto de Identidad
      </div>

      {/* FOTO */}
      <div className="mx-auto max-w-[150px]">
        <div className="aspect-[4/5] w-full overflow-hidden rounded-xl border border-white/10 bg-black/30 flex items-center justify-center">
          {fotoPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={fotoPreview}
              alt="Foto"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="text-sm text-white/50">
              Sin foto
            </div>
          )}
        </div>

        {/* BOTÓN SUBIR */}
        <div className="mt-3 space-y-2 text-center">
          <label className="inline-block cursor-pointer rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs hover:bg-white/10">
            Seleccionar archivo
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                onFotoChange(f);
              }}
            />
          </label>

          {/* TEXTO ARCHIVO SELECCIONADO DEBAJO */}
          <div className="text-xs text-white/50">
            {fotoFile ? fotoFile.name : "Sin archivos seleccionados"}
          </div>

          {fotoFile && (
            <button
              type="button"
              onClick={onClear}
              className="text-xs text-white/60 hover:text-white"
            >
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
}: {
  label: string;
  hint?: string;
  options: readonly string[];
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
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
    value.length === 0
      ? ""
      : value.length <= 2
      ? value.join(", ")
      : `${value.length} seleccionados`;

  return (
    <div className="space-y-1" ref={boxRef}>
      <div className="flex items-baseline justify-between gap-3">
        <div className="text-sm text-white/80">{label}</div>
        {hint ? <div className="text-xs text-white/50">{hint}</div> : null}
      </div>

      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-left text-sm hover:bg-white/5"
      >
        <div className="flex items-center justify-between gap-3">
          <span className={selectedText ? "text-white/90" : "text-white/50"}>
            {selectedText || placeholder}
          </span>
          <span className="text-white/50">{open ? "▲" : "▼"}</span>
        </div>
      </button>

      {open && (
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
                      onChange(
                        checked ? value.filter((x) => x !== opt) : [...value, opt]
                      );
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