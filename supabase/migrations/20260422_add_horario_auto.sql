-- Migración: agrega columna horario_auto a la tabla eventos
-- Estructura del JSON:
-- {
--   "activo": true,
--   "franjas": [
--     { "dia": 0, "hora_inicio": "08:00", "hora_fin": "09:59" },
--     { "dia": 0, "hora_inicio": "10:00", "hora_fin": "13:00" }
--   ]
-- }
-- dia: 0=domingo, 1=lunes, 2=martes, 3=miércoles, 4=jueves, 5=viernes, 6=sábado

ALTER TABLE public.eventos
  ADD COLUMN IF NOT EXISTS horario_auto jsonb DEFAULT NULL;

-- Índice parcial para buscar rápido eventos con horario activo
CREATE INDEX IF NOT EXISTS idx_eventos_horario_auto
  ON public.eventos ((horario_auto->>'activo'))
  WHERE horario_auto IS NOT NULL;

-- Comentario descriptivo
COMMENT ON COLUMN public.eventos.horario_auto IS
  'Configuración de activación automática. Estructura: {"activo":bool,"franjas":[{"dia":0-6,"hora_inicio":"HH:MM","hora_fin":"HH:MM"}]}';
