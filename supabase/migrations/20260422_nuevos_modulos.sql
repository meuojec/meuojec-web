-- ============================================================
-- MIGRACIÓN: Nuevos módulos de administración eclesiástica
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Campos de ciclo de vida en miembros
ALTER TABLE public.miembros
  ADD COLUMN IF NOT EXISTS estado text DEFAULT 'activo',
  ADD COLUMN IF NOT EXISTS fecha_conversion date,
  ADD COLUMN IF NOT EXISTS fecha_bautismo_agua date,
  ADD COLUMN IF NOT EXISTS fecha_bautismo_espiritu date,
  ADD COLUMN IF NOT EXISTS discipulador_rut text,
  ADD COLUMN IF NOT EXISTS apellidos text;

-- 2. Ministerios / Departamentos
CREATE TABLE IF NOT EXISTS public.ministerios (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre text NOT NULL,
  descripcion text,
  lider_rut text,
  color text DEFAULT '#6366f1',
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 3. Miembros en ministerios (muchos a muchos)
CREATE TABLE IF NOT EXISTS public.miembros_ministerios (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  miembro_rut text NOT NULL,
  ministerio_id uuid REFERENCES public.ministerios(id) ON DELETE CASCADE,
  rol text DEFAULT 'miembro',
  fecha_ingreso date DEFAULT CURRENT_DATE,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(miembro_rut, ministerio_id)
);

-- 4. Contribuciones individuales (diezmos y ofrendas)
CREATE TABLE IF NOT EXISTS public.contribuciones (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  miembro_rut text,
  anonimo boolean DEFAULT false,
  tipo text NOT NULL DEFAULT 'diezmo',
  monto numeric(12,2) NOT NULL,
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  evento_id uuid,
  notas text,
  registrado_por uuid,
  created_at timestamptz DEFAULT now()
);

-- 5. Visitantes
CREATE TABLE IF NOT EXISTS public.visitantes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nombres text NOT NULL,
  apellidos text,
  telefono text,
  email text,
  fecha_primera_visita date NOT NULL DEFAULT CURRENT_DATE,
  origen text DEFAULT 'invitado',
  discipulador_rut text,
  estado text DEFAULT 'nuevo',
  notas text,
  rut_miembro text,
  created_at timestamptz DEFAULT now()
);

-- 6. Seguimiento de visitantes
CREATE TABLE IF NOT EXISTS public.visitantes_seguimiento (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  visitante_id uuid REFERENCES public.visitantes(id) ON DELETE CASCADE,
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  tipo text DEFAULT 'contacto',
  descripcion text,
  registrado_por uuid,
  created_at timestamptz DEFAULT now()
);

-- 7. Seguimiento pastoral (de miembros)
CREATE TABLE IF NOT EXISTS public.seguimiento_pastoral (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  miembro_rut text,
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  tipo text DEFAULT 'visita',
  descripcion text NOT NULL,
  pastor_id uuid,
  privado boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 8. Anuncios / Comunicaciones internas
CREATE TABLE IF NOT EXISTS public.anuncios (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo text NOT NULL,
  contenido text NOT NULL,
  tipo text DEFAULT 'general',
  audiencia text DEFAULT 'todos',
  activo boolean DEFAULT true,
  expira_en date,
  autor_id uuid,
  created_at timestamptz DEFAULT now()
);

-- 9. Agenda / Calendario
CREATE TABLE IF NOT EXISTS public.agenda (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo text NOT NULL,
  descripcion text,
  fecha date NOT NULL,
  hora_inicio time,
  hora_fin time,
  tipo text DEFAULT 'reunion',
  ministerio_id uuid,
  lugar text,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Índices de rendimiento
CREATE INDEX IF NOT EXISTS idx_contribuciones_fecha ON public.contribuciones(fecha);
CREATE INDEX IF NOT EXISTS idx_contribuciones_miembro ON public.contribuciones(miembro_rut);
CREATE INDEX IF NOT EXISTS idx_visitantes_estado ON public.visitantes(estado);
CREATE INDEX IF NOT EXISTS idx_seguimiento_pastoral_rut ON public.seguimiento_pastoral(miembro_rut);
CREATE INDEX IF NOT EXISTS idx_agenda_fecha ON public.agenda(fecha);
CREATE INDEX IF NOT EXISTS idx_anuncios_activo ON public.anuncios(activo);
