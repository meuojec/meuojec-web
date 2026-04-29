-- Presupuestos mensuales por categoría
CREATE TABLE IF NOT EXISTS public.fin_presupuestos (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  area        text NOT NULL DEFAULT 'IGLESIA',
  categoria_id uuid NOT NULL REFERENCES public.fin_categorias(id) ON DELETE CASCADE,
  mes         text NOT NULL, -- formato YYYY-MM
  monto       numeric(14,2) NOT NULL DEFAULT 0,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  UNIQUE(area, categoria_id, mes)
);

-- RLS: solo usuarios autenticados pueden leer; solo admin puede escribir
ALTER TABLE public.fin_presupuestos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "autenticados pueden leer presupuestos"
  ON public.fin_presupuestos FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "service_role puede todo en presupuestos"
  ON public.fin_presupuestos FOR ALL
  USING (auth.role() = 'service_role');
