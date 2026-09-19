CREATE TYPE public.linea_estado AS ENUM ('Activa', 'Eliminada');
CREATE TYPE public.linea_descuento_tipo AS ENUM ('Porcentual', 'Absoluto');
CREATE TYPE public.linea_origen_importes AS ENUM ('formula', 'documento');

CREATE TABLE public.factura_lineas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  factura_id uuid NOT NULL REFERENCES public.facturas(id),
  orden integer NOT NULL CHECK (orden >= 1),
  descripcion text,
  codigo_producto text,
  referencia_proveedor text,
  cantidad numeric,
  precio_unitario numeric,
  descuento_tipo public.linea_descuento_tipo,
  descuento_valor numeric,
  tipo_impuesto text,
  nombre_impuesto text,
  tipo_impositivo numeric,
  base_imponible numeric,
  cuota_impuesto numeric,
  total numeric,
  origen_importes public.linea_origen_importes NOT NULL DEFAULT 'formula',
  observaciones text,
  estado_linea public.linea_estado NOT NULL DEFAULT 'Activa',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  entorno public.entorno_tipo NOT NULL DEFAULT 'produccion'
);

CREATE INDEX factura_lineas_factura_id_idx ON public.factura_lineas (factura_id, orden);

GRANT ALL ON public.factura_lineas TO service_role;

ALTER TABLE public.factura_lineas ENABLE ROW LEVEL SECURITY;
