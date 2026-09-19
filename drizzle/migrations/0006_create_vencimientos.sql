CREATE TYPE public.vencimiento_estado AS ENUM ('Previsto', 'Pendiente', 'Pagado');
CREATE TYPE public.vencimiento_tipo AS ENUM ('Proveedor', 'Impuesto', 'Nómina', 'Financiación', 'Otro');
CREATE TYPE public.vencimiento_clase AS ENUM ('Pago', 'Cobro');

CREATE TABLE public.vencimientos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  factura_id uuid REFERENCES public.facturas(id),
  compromiso_fijo_id uuid,
  fecha date NOT NULL,
  importe numeric NOT NULL,
  estado public.vencimiento_estado NOT NULL DEFAULT 'Previsto',
  tipo public.vencimiento_tipo NOT NULL,
  tipo_vencimiento public.vencimiento_clase NOT NULL DEFAULT 'Pago',
  entorno public.entorno_tipo NOT NULL DEFAULT 'produccion',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT vencimientos_importe_positivo CHECK (importe > 0),
  CONSTRAINT vencimientos_regla_10 CHECK (
    (factura_id IS NOT NULL AND compromiso_fijo_id IS NULL)
    OR (factura_id IS NULL AND compromiso_fijo_id IS NOT NULL)
  )
);

CREATE INDEX vencimientos_factura_id_idx ON public.vencimientos (factura_id);
CREATE INDEX vencimientos_compromiso_fijo_id_idx ON public.vencimientos (compromiso_fijo_id);
CREATE INDEX vencimientos_fecha_idx ON public.vencimientos (fecha);

GRANT ALL ON public.vencimientos TO service_role;

ALTER TABLE public.vencimientos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vencimientos solo service_role" ON public.vencimientos
  AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);