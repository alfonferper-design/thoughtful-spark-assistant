-- Entorno: produccion | prueba
CREATE TYPE public.entorno_tipo AS ENUM ('produccion', 'prueba');
CREATE TYPE public.cuenta_tipo AS ENUM ('Cuenta corriente', 'Línea de crédito', 'Cuenta de inversión');
CREATE TYPE public.categoria_tipo AS ENUM ('Ingreso', 'Gasto');
CREATE TYPE public.proveedor_tipo AS ENUM ('Cooperativa', 'Mayorista', 'Laboratorio', 'Servicio');

CREATE TABLE public.cuentas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  tipo public.cuenta_tipo NOT NULL,
  activa BOOLEAN NOT NULL DEFAULT true,
  saldo_apertura NUMERIC(14,2) NOT NULL,
  fecha_saldo_apertura DATE NOT NULL,
  entorno public.entorno_tipo NOT NULL DEFAULT 'produccion',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cuentas TO anon, authenticated;
GRANT ALL ON public.cuentas TO service_role;
ALTER TABLE public.cuentas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cuentas abiertas" ON public.cuentas FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  tipo public.categoria_tipo NOT NULL,
  categoria_padre_id UUID REFERENCES public.categorias(id) ON DELETE RESTRICT,
  entorno public.entorno_tipo NOT NULL DEFAULT 'produccion',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categorias TO anon, authenticated;
GRANT ALL ON public.categorias TO service_role;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categorias abiertas" ON public.categorias FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Solo 2 niveles: el padre debe ser de nivel 1
CREATE OR REPLACE FUNCTION public.validar_nivel_categoria()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE padre_de_padre UUID;
BEGIN
  IF NEW.categoria_padre_id IS NOT NULL THEN
    SELECT categoria_padre_id INTO padre_de_padre FROM public.categorias WHERE id = NEW.categoria_padre_id;
    IF padre_de_padre IS NOT NULL THEN
      RAISE EXCEPTION 'Solo se permiten 2 niveles de categoría';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_validar_nivel_categoria
BEFORE INSERT OR UPDATE ON public.categorias
FOR EACH ROW EXECUTE FUNCTION public.validar_nivel_categoria();

CREATE TABLE public.proveedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_visible TEXT NOT NULL,
  nombre_normalizado TEXT NOT NULL,
  tipo public.proveedor_tipo NOT NULL,
  cif TEXT,
  direccion TEXT,
  telefono TEXT,
  email TEXT,
  categoria_defecto_id UUID REFERENCES public.categorias(id) ON DELETE SET NULL,
  condiciones_pago TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  entorno public.entorno_tipo NOT NULL DEFAULT 'produccion',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT proveedores_nombre_normalizado_unico UNIQUE (nombre_normalizado)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.proveedores TO anon, authenticated;
GRANT ALL ON public.proveedores TO service_role;
ALTER TABLE public.proveedores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "proveedores abiertos" ON public.proveedores FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.auditoria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entidad TEXT NOT NULL,
  entidad_id TEXT,
  accion TEXT NOT NULL,
  actor TEXT NOT NULL DEFAULT 'Alfonso',
  antes JSONB,
  despues JSONB,
  fecha TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.auditoria TO anon, authenticated;
GRANT ALL ON public.auditoria TO service_role;
ALTER TABLE public.auditoria ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auditoria lectura" ON public.auditoria FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "auditoria escritura" ON public.auditoria FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE TABLE public.configuracion (
  clave TEXT PRIMARY KEY,
  valor JSONB NOT NULL,
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.configuracion TO anon, authenticated;
GRANT ALL ON public.configuracion TO service_role;
ALTER TABLE public.configuracion ENABLE ROW LEVEL SECURITY;
CREATE POLICY "configuracion abierta" ON public.configuracion FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

INSERT INTO public.configuracion (clave, valor) VALUES ('actor', '{"nombre":"Alfonso"}'::jsonb);
