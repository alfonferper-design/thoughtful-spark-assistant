CREATE TYPE public.movimiento_tipo AS ENUM ('Ingreso', 'Gasto', 'Financiación', 'Transferencia interna');
CREATE TYPE public.movimiento_subtipo_financiacion AS ENUM ('Principal recibido', 'Principal devuelto', 'Intereses', 'Comisiones');
CREATE TYPE public.movimiento_direccion AS ENUM ('entrada', 'salida');
CREATE TYPE public.movimiento_estado AS ENUM ('Previsto', 'Pendiente', 'Confirmado', 'Conciliado');
CREATE TYPE public.movimiento_origen AS ENUM ('Manual', 'Importado', 'Regla');
CREATE TYPE public.movimiento_clasificacion_origen AS ENUM ('automatica', 'manual');

CREATE TABLE public.movimientos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cuenta_id UUID NOT NULL REFERENCES public.cuentas(id),
  fecha DATE NOT NULL,
  importe NUMERIC NOT NULL CHECK (importe > 0),
  tipo public.movimiento_tipo NOT NULL,
  subtipo_financiacion public.movimiento_subtipo_financiacion,
  direccion public.movimiento_direccion,
  categoria_id UUID REFERENCES public.categorias(id),
  subcategoria_id UUID REFERENCES public.categorias(id),
  proveedor_id UUID REFERENCES public.proveedores(id),
  metodo_cobro_pago TEXT,
  estado public.movimiento_estado NOT NULL DEFAULT 'Confirmado',
  origen public.movimiento_origen NOT NULL DEFAULT 'Manual',
  relacionado_con_farmacia BOOLEAN NOT NULL DEFAULT true,
  clasificacion_origen public.movimiento_clasificacion_origen,
  entorno public.entorno_tipo NOT NULL DEFAULT 'produccion',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT movimientos_financiacion_subtipo CHECK (
    (tipo = 'Financiación' AND subtipo_financiacion IS NOT NULL)
    OR (tipo <> 'Financiación' AND subtipo_financiacion IS NULL)
  ),
  CONSTRAINT movimientos_direccion_solo_transferencia CHECK (
    (tipo = 'Transferencia interna' AND direccion IS NOT NULL)
    OR (tipo <> 'Transferencia interna' AND direccion IS NULL)
  ),
  CONSTRAINT movimientos_metodo_solo_operativos CHECK (
    metodo_cobro_pago IS NULL
    OR (tipo IN ('Ingreso', 'Gasto') AND metodo_cobro_pago IN ('TPV', 'Bizum', 'Efectivo', 'Transferencia'))
  )
);

CREATE INDEX idx_movimientos_cuenta_fecha ON public.movimientos (cuenta_id, fecha);
CREATE INDEX idx_movimientos_fecha ON public.movimientos (fecha DESC);
CREATE INDEX idx_movimientos_proveedor ON public.movimientos (proveedor_id);

GRANT ALL ON public.movimientos TO service_role;
ALTER TABLE public.movimientos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "movimientos solo service_role" ON public.movimientos FOR ALL TO service_role USING (true) WITH CHECK (true);