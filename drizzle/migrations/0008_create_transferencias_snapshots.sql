CREATE TYPE public.snapshot_origen AS ENUM ('Manual', 'Importado');

CREATE TABLE public.snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cuenta_id uuid NOT NULL REFERENCES public.cuentas(id),
  fecha date NOT NULL,
  saldo_comunicado_banco numeric NOT NULL,
  origen public.snapshot_origen NOT NULL DEFAULT 'Manual',
  entorno public.entorno_tipo NOT NULL DEFAULT 'produccion',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.snapshots TO service_role;
ALTER TABLE public.snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "snapshots solo service_role" ON public.snapshots FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE INDEX snapshots_cuenta_fecha_idx ON public.snapshots (cuenta_id, fecha);

CREATE TABLE public.transferencias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  movimiento_origen_id uuid NOT NULL REFERENCES public.movimientos(id),
  movimiento_destino_id uuid NOT NULL REFERENCES public.movimientos(id),
  cuenta_origen_id uuid NOT NULL REFERENCES public.cuentas(id),
  cuenta_destino_id uuid NOT NULL REFERENCES public.cuentas(id),
  entorno public.entorno_tipo NOT NULL DEFAULT 'produccion',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT transferencias_cuentas_distintas CHECK (cuenta_origen_id <> cuenta_destino_id)
);

GRANT ALL ON public.transferencias TO service_role;
ALTER TABLE public.transferencias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "transferencias solo service_role" ON public.transferencias FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE INDEX transferencias_created_idx ON public.transferencias (created_at DESC);

-- F-12 · crearTransferencia, como una sola operación atómica.
-- A diferencia del artefacto original (hallazgo H-04: no auditaba), aquí cada
-- transferencia deja tres entradas de auditoría: los dos movimientos y la propia
-- transferencia.
CREATE OR REPLACE FUNCTION public.crear_transferencia(
  p_cuenta_origen uuid,
  p_cuenta_destino uuid,
  p_fecha date,
  p_importe numeric,
  p_estado movimiento_estado,
  p_entorno entorno_tipo,
  p_actor text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  co public.cuentas;
  cd public.cuentas;
  importe numeric;
  salida_id uuid;
  entrada_id uuid;
  transferencia_id uuid;
BEGIN
  IF p_cuenta_origen = p_cuenta_destino THEN
    RAISE EXCEPTION 'La cuenta de origen y la de destino no pueden ser la misma.';
  END IF;

  SELECT * INTO co FROM public.cuentas WHERE id = p_cuenta_origen;
  IF NOT FOUND THEN RAISE EXCEPTION 'Cuenta de origen no encontrada.'; END IF;
  SELECT * INTO cd FROM public.cuentas WHERE id = p_cuenta_destino;
  IF NOT FOUND THEN RAISE EXCEPTION 'Cuenta de destino no encontrada.'; END IF;

  IF co.entorno <> cd.entorno THEN
    RAISE EXCEPTION 'Las dos cuentas pertenecen a entornos distintos: no se pueden transferir entre sí.';
  END IF;
  IF co.entorno <> p_entorno THEN
    RAISE EXCEPTION 'El entorno indicado no coincide con el de las cuentas.';
  END IF;

  importe := round(abs(p_importe), 2);
  IF importe IS NULL OR importe <= 0 THEN
    RAISE EXCEPTION 'El importe debe ser mayor que cero (el signo lo determina la dirección).';
  END IF;

  INSERT INTO public.movimientos (
    cuenta_id, fecha, importe, tipo, direccion, estado, origen,
    relacionado_con_farmacia, entorno
  ) VALUES (
    p_cuenta_origen, p_fecha, importe, 'Transferencia interna', 'salida', p_estado, 'Manual',
    true, p_entorno
  ) RETURNING id INTO salida_id;

  INSERT INTO public.movimientos (
    cuenta_id, fecha, importe, tipo, direccion, estado, origen,
    relacionado_con_farmacia, entorno
  ) VALUES (
    p_cuenta_destino, p_fecha, importe, 'Transferencia interna', 'entrada', p_estado, 'Manual',
    true, p_entorno
  ) RETURNING id INTO entrada_id;

  INSERT INTO public.transferencias (
    movimiento_origen_id, movimiento_destino_id, cuenta_origen_id, cuenta_destino_id, entorno
  ) VALUES (
    salida_id, entrada_id, p_cuenta_origen, p_cuenta_destino, p_entorno
  ) RETURNING id INTO transferencia_id;

  INSERT INTO public.auditoria (entidad, entidad_id, accion, actor, antes, despues)
  VALUES ('Movimiento', salida_id::text, 'crear', p_actor, NULL,
          jsonb_build_object('cuenta_id', p_cuenta_origen, 'fecha', p_fecha, 'importe', importe,
                             'tipo', 'Transferencia interna', 'direccion', 'salida',
                             'estado', p_estado, 'transferencia_id', transferencia_id));

  INSERT INTO public.auditoria (entidad, entidad_id, accion, actor, antes, despues)
  VALUES ('Movimiento', entrada_id::text, 'crear', p_actor, NULL,
          jsonb_build_object('cuenta_id', p_cuenta_destino, 'fecha', p_fecha, 'importe', importe,
                             'tipo', 'Transferencia interna', 'direccion', 'entrada',
                             'estado', p_estado, 'transferencia_id', transferencia_id));

  INSERT INTO public.auditoria (entidad, entidad_id, accion, actor, antes, despues)
  VALUES ('Transferencia', transferencia_id::text, 'crear_transferencia', p_actor, NULL,
          jsonb_build_object('cuenta_origen_id', p_cuenta_origen, 'cuenta_destino_id', p_cuenta_destino,
                             'fecha', p_fecha, 'importe', importe, 'estado', p_estado,
                             'movimiento_origen_id', salida_id, 'movimiento_destino_id', entrada_id,
                             'entorno', p_entorno));

  RETURN jsonb_build_object(
    'transferencia_id', transferencia_id,
    'movimiento_origen_id', salida_id,
    'movimiento_destino_id', entrada_id,
    'importe', importe
  );
END;
$function$;