-- Conciliación (Parte 2.11) + motor de pagos (Parte 5).
-- Escritura atómica: conciliación + detalle + estado de vencimiento + estado de
-- movimiento + auditoría se confirman o se deshacen juntos dentro de la función
-- registrar_conciliacion().

CREATE TYPE public.conciliacion_tipo AS ENUM ('Exacta', 'Parcial', 'Agrupada');

CREATE TABLE public.conciliaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo public.conciliacion_tipo NOT NULL,
  nivel_confianza numeric,
  confirmado_por text,
  fecha_confirmacion timestamptz,
  exceso_autorizado boolean NOT NULL DEFAULT false,
  motivo_exceso text,
  autorizado_por text,
  entorno public.entorno_tipo NOT NULL DEFAULT 'produccion',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT conciliaciones_nivel_confianza_rango
    CHECK (nivel_confianza IS NULL OR (nivel_confianza >= 0 AND nivel_confianza <= 100)),
  -- Regla 7 (RB-004): Parcial o Agrupada exige confirmado_por.
  CONSTRAINT conciliaciones_regla_7
    CHECK (tipo = 'Exacta' OR (confirmado_por IS NOT NULL AND btrim(confirmado_por) <> '')),
  -- Una sobre-conciliación autorizada exige motivo explícito.
  CONSTRAINT conciliaciones_motivo_exceso
    CHECK (NOT exceso_autorizado OR (motivo_exceso IS NOT NULL AND btrim(motivo_exceso) <> ''))
);

CREATE TABLE public.conciliacion_detalle (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conciliacion_id uuid NOT NULL REFERENCES public.conciliaciones(id),
  vencimiento_id uuid NOT NULL REFERENCES public.vencimientos(id),
  movimiento_id uuid NOT NULL REFERENCES public.movimientos(id),
  importe_aplicado numeric NOT NULL CHECK (importe_aplicado > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX conciliacion_detalle_conciliacion_idx ON public.conciliacion_detalle (conciliacion_id);
CREATE INDEX conciliacion_detalle_vencimiento_idx ON public.conciliacion_detalle (vencimiento_id);
CREATE INDEX conciliacion_detalle_movimiento_idx ON public.conciliacion_detalle (movimiento_id);

GRANT ALL ON public.conciliaciones TO service_role;
GRANT ALL ON public.conciliacion_detalle TO service_role;

ALTER TABLE public.conciliaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conciliacion_detalle ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conciliaciones solo service_role" ON public.conciliaciones
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "conciliacion_detalle solo service_role" ON public.conciliacion_detalle
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Única vía de escritura de una conciliación (Parte 5.5), en una sola
-- transacción. Re-valida en el servidor de base de datos el mismo orden exacto
-- de comprobaciones, con los mensajes literales del documento, y bloquea las
-- filas implicadas para que dos conciliaciones simultáneas no sobre-apliquen un
-- mismo movimiento o vencimiento.
CREATE OR REPLACE FUNCTION public.registrar_conciliacion(
  p_vencimiento_id uuid,
  p_movimiento_id uuid,
  p_importe_aplicado numeric,
  p_tipo public.conciliacion_tipo,
  p_nivel_confianza numeric,
  p_confirmado_por text,
  p_autorizar_exceso boolean,
  p_motivo_exceso text,
  p_actor text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tol constant numeric := 0.01;
  v public.vencimientos;
  m public.movimientos;
  conciliado numeric;
  aplicado numeric;
  pendiente_v numeric;
  disponible_m numeric;
  excede_v boolean;
  excede_m boolean;
  hay_exceso boolean;
  detalle_exceso text := '';
  nueva_id uuid;
  detalle_id uuid;
  conciliado_tras numeric;
  disponible_tras numeric;
  estado_calculado text;
  marcado_pagado boolean := false;
  movimiento_conciliado boolean := false;
  fila_conciliacion jsonb;
BEGIN
  -- a) Errores de entrada (validarConciliacion).
  SELECT * INTO v FROM public.vencimientos WHERE id = p_vencimiento_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Vencimiento no encontrado.';
  END IF;

  SELECT * INTO m FROM public.movimientos WHERE id = p_movimiento_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Movimiento no encontrado.';
  END IF;

  IF p_importe_aplicado IS NULL OR p_importe_aplicado <= 0 THEN
    RAISE EXCEPTION 'El importe aplicado debe ser mayor que cero: no hay ningún caso modelado que admita importes negativos o cero.';
  END IF;

  IF v.entorno <> m.entorno THEN
    RAISE EXCEPTION 'El vencimiento y el movimiento pertenecen a entornos distintos: no se pueden conciliar entre sí.';
  END IF;

  SELECT round(coalesce(sum(d.importe_aplicado), 0), 2) INTO conciliado
    FROM public.conciliacion_detalle d WHERE d.vencimiento_id = v.id;
  SELECT round(coalesce(sum(d.importe_aplicado), 0), 2) INTO aplicado
    FROM public.conciliacion_detalle d WHERE d.movimiento_id = m.id;

  pendiente_v := round(v.importe - conciliado, 2);
  disponible_m := round(abs(m.importe) - aplicado, 2);
  excede_v := p_importe_aplicado > pendiente_v + tol;
  excede_m := p_importe_aplicado > disponible_m + tol;
  hay_exceso := excede_v OR excede_m;

  -- b) Regla 7.
  IF p_tipo <> 'Exacta' AND (p_confirmado_por IS NULL OR btrim(p_confirmado_por) = '') THEN
    RAISE EXCEPTION 'Rechazado (Regla 7): una conciliación Parcial o Agrupada exige confirmado_por.';
  END IF;

  -- c) Exceso no autorizado, con el detalle exacto de cuánto excede cada lado.
  IF hay_exceso AND NOT coalesce(p_autorizar_exceso, false) THEN
    IF excede_v THEN
      detalle_exceso := detalle_exceso || 'excede el pendiente del vencimiento en '
        || to_char(round(p_importe_aplicado - pendiente_v, 2), 'FM999999999.00') || ' €';
    END IF;
    IF excede_m THEN
      IF detalle_exceso <> '' THEN
        detalle_exceso := detalle_exceso || ' y ';
      END IF;
      detalle_exceso := detalle_exceso || 'excede el importe disponible del movimiento en '
        || to_char(round(p_importe_aplicado - disponible_m, 2), 'FM999999999.00') || ' €';
    END IF;
    RAISE EXCEPTION 'Sobre-conciliación no autorizada: %.', detalle_exceso;
  END IF;

  -- d) Exceso autorizado sin motivo.
  IF hay_exceso AND (p_motivo_exceso IS NULL OR btrim(p_motivo_exceso) = '') THEN
    RAISE EXCEPTION 'Una sobre-conciliación autorizada exige un motivo explícito: sin motivo no se registra.';
  END IF;

  INSERT INTO public.conciliaciones (
    tipo, nivel_confianza, confirmado_por, fecha_confirmacion,
    exceso_autorizado, motivo_exceso, autorizado_por, entorno
  ) VALUES (
    p_tipo,
    p_nivel_confianza,
    nullif(btrim(coalesce(p_confirmado_por, '')), ''),
    now(),
    hay_exceso,
    CASE WHEN hay_exceso THEN nullif(btrim(coalesce(p_motivo_exceso, '')), '') ELSE NULL END,
    CASE WHEN hay_exceso THEN p_actor ELSE NULL END,
    v.entorno
  ) RETURNING id INTO nueva_id;

  INSERT INTO public.conciliacion_detalle (conciliacion_id, vencimiento_id, movimiento_id, importe_aplicado)
  VALUES (nueva_id, v.id, m.id, p_importe_aplicado)
  RETURNING id INTO detalle_id;

  SELECT to_jsonb(c) INTO fila_conciliacion FROM public.conciliaciones c WHERE c.id = nueva_id;

  INSERT INTO public.auditoria (entidad, entidad_id, accion, actor, antes, despues)
  VALUES ('Conciliacion', nueva_id::text, 'conciliar', p_actor, NULL,
          fila_conciliacion || jsonb_build_object(
            'detalle', jsonb_build_object(
              'vencimiento_id', v.id, 'movimiento_id', m.id, 'importe_aplicado', p_importe_aplicado)));

  IF hay_exceso THEN
    INSERT INTO public.auditoria (entidad, entidad_id, accion, actor, antes, despues)
    VALUES ('Conciliacion', nueva_id::text, 'sobre_conciliacion_autorizada', p_actor, NULL,
            jsonb_build_object(
              'importe_aplicado', p_importe_aplicado,
              'pendiente_vencimiento', pendiente_v,
              'disponible_movimiento', disponible_m,
              'excede_vencimiento', excede_v,
              'excede_movimiento', excede_m,
              'motivo_exceso', p_motivo_exceso,
              'autorizado_por', p_actor));
  END IF;

  -- F-30 · estadoVencimientoCalculado tras la conciliación.
  conciliado_tras := round(conciliado + p_importe_aplicado, 2);
  IF conciliado_tras <= tol THEN
    estado_calculado := CASE WHEN v.estado = 'Previsto' THEN 'Previsto' ELSE 'Pendiente' END;
  ELSIF conciliado_tras >= v.importe - tol THEN
    estado_calculado := 'Pagado';
  ELSE
    estado_calculado := 'Pendiente';
  END IF;

  IF estado_calculado = 'Pagado' AND v.estado <> 'Pagado' THEN
    UPDATE public.vencimientos SET estado = 'Pagado' WHERE id = v.id;
    marcado_pagado := true;
    INSERT INTO public.auditoria (entidad, entidad_id, accion, actor, antes, despues)
    VALUES ('Vencimiento', v.id::text, 'marcar_pagado', p_actor,
            jsonb_build_object('estado', v.estado),
            jsonb_build_object('estado', 'Pagado', 'importe_conciliado', conciliado_tras));
  END IF;

  -- El movimiento pasa a Conciliado solo cuando queda totalmente aplicado.
  disponible_tras := round(abs(m.importe) - (aplicado + p_importe_aplicado), 2);
  IF disponible_tras <= tol AND m.estado <> 'Conciliado' THEN
    UPDATE public.movimientos SET estado = 'Conciliado' WHERE id = m.id;
    movimiento_conciliado := true;
    INSERT INTO public.auditoria (entidad, entidad_id, accion, actor, antes, despues)
    VALUES ('Movimiento', m.id::text, 'conciliar', p_actor,
            jsonb_build_object('estado', m.estado),
            jsonb_build_object('estado', 'Conciliado', 'importe_aplicado_total', round(aplicado + p_importe_aplicado, 2)));
  END IF;

  RETURN jsonb_build_object(
    'conciliacion_id', nueva_id,
    'detalle_id', detalle_id,
    'importe_aplicado', p_importe_aplicado,
    'hubo_exceso', hay_exceso,
    'vencimiento_marcado_pagado', marcado_pagado,
    'movimiento_conciliado', movimiento_conciliado,
    'pendiente_vencimiento_tras', round(v.importe - conciliado_tras, 2),
    'disponible_movimiento_tras', disponible_tras
  );
END;
$$;

REVOKE ALL ON FUNCTION public.registrar_conciliacion(uuid, uuid, numeric, public.conciliacion_tipo, numeric, text, boolean, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.registrar_conciliacion(uuid, uuid, numeric, public.conciliacion_tipo, numeric, text, boolean, text, text) TO service_role;