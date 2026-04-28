-- Agrega columna estado a seguimiento_pastoral
ALTER TABLE seguimiento_pastoral
  ADD COLUMN IF NOT EXISTS estado text NOT NULL DEFAULT 'pendiente'
  CHECK (estado IN ('pendiente', 'contactado', 'resuelto'));

-- Índice para filtrar por estado
CREATE INDEX IF NOT EXISTS idx_seguimiento_estado ON seguimiento_pastoral(estado);
