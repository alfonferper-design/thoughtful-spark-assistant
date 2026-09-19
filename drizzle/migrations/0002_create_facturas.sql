CREATE TYPE public.factura_estado_documental AS ENUM ('Recibida','En revisión','Validada','Incidencia','Anulada');
CREATE TYPE public.factura_estado_duplicado AS ENUM ('No detectado','Posible duplicado','Duplicado confirmado','Falso positivo');
CREATE TYPE public.factura_estado_contable AS ENUM ('Pendiente','Contabilizada','Revisada');
CREATE TYPE public.factura_tipo AS ENUM ('Normal','Rectificativa','Abono');

CREATE TABLE public.facturas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Campos legacy (Parte 2.6): se conservan tal cual, nunca se borran
  estado TEXT NOT NULL DEFAULT 'Recibida',
  base_imponible NUMERIC,
  iva NUMERIC,
  documento_original TEXT,
  resuelto_por TEXT,
  fecha_resolucion TIMESTAMPTZ,
  -- Modelo extendido ETAPA D
  proveedor_id UUID NOT NULL REFERENCES public.proveedores(id),
  fecha DATE NOT NULL,
  fecha_emision DATE NOT NULL,
  fecha_recepcion DATE,
  fecha_vencimiento DATE,
  fecha_contabilizacion TIMESTAMPTZ,
  numero_factura TEXT,
  total NUMERIC NOT NULL,
  estado_documental public.factura_estado_documental NOT NULL DEFAULT 'Recibida',
  estado_duplicado public.factura_estado_duplicado NOT NULL DEFAULT 'No detectado',
  estado_contable public.factura_estado_contable NOT NULL DEFAULT 'Pendiente',
  naturaleza TEXT,
  categoria_id UUID REFERENCES public.categorias(id),
  moneda TEXT NOT NULL DEFAULT 'EUR',
  forma_pago TEXT,
  condiciones_pago TEXT,
  observaciones TEXT,
  usuario_crea TEXT NOT NULL,
  usuario_valida TEXT,
  tipo_factura public.factura_tipo NOT NULL DEFAULT 'Normal',
  factura_relacionada_id UUID REFERENCES public.facturas(id),
  desglose_fiscal JSONB NOT NULL DEFAULT '[]'::jsonb,
  entorno public.entorno_tipo NOT NULL DEFAULT 'produccion',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_facturas_proveedor ON public.facturas(proveedor_id);
CREATE INDEX idx_facturas_fecha ON public.facturas(fecha DESC);

-- Regla del modelo: factura_relacionada_id obligatorio si tipo_factura<>'Normal',
-- prohibido si ='Normal'; y nunca auto-referencia.
CREATE OR REPLACE FUNCTION public.validar_relacion_factura()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.tipo_factura = 'Normal' AND NEW.factura_relacionada_id IS NOT NULL THEN
    RAISE EXCEPTION 'Una factura Normal no puede tener factura relacionada';
  END IF;
  IF NEW.tipo_factura <> 'Normal' AND NEW.factura_relacionada_id IS NULL THEN
    RAISE EXCEPTION 'Una factura Rectificativa o Abono exige factura relacionada';
  END IF;
  IF NEW.factura_relacionada_id IS NOT NULL AND NEW.factura_relacionada_id = NEW.id THEN
    RAISE EXCEPTION 'Una factura no puede relacionarse consigo misma';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validar_relacion_factura
BEFORE INSERT OR UPDATE ON public.facturas
FOR EACH ROW EXECUTE FUNCTION public.validar_relacion_factura();

-- Acceso cerrado: solo el rol de servicio (las funciones de servidor tras la clave)
GRANT ALL ON public.facturas TO service_role;
ALTER TABLE public.facturas ENABLE ROW LEVEL SECURITY;