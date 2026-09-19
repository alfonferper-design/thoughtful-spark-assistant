/**
 * Motor de pagos (Parte 5 del documento) — núcleo puro, sin acceso a datos.
 *
 * Todas las funciones reciben un contexto en memoria (`ContextoPagos`), igual
 * que el `ctx` del código original, y no escriben nada. Las fórmulas se
 * transcriben literalmente: F-10, F-28, F-29, F-30, F-31, F-32 y la validación
 * previa de conciliación (5.4). Ninguna magnitud se mezcla con otra.
 */
import { TOLERANCIA_REDONDEO_EUR, redondearEuros } from "./dinero";

export const TIPOS_CONCILIACION = ["Exacta", "Parcial", "Agrupada"] as const;
export type TipoConciliacion = (typeof TIPOS_CONCILIACION)[number];

/** Estados de pago de la familia (Parte 5.2). Nunca se persisten (RB-017). */
export const ESTADOS_PAGO_FAMILIA = [
  "Anulada",
  "Sin vencimiento registrado",
  "Pagada con saldo a favor",
  "Pagada",
  "Pendiente",
  "Parcialmente pagada",
] as const;
export type EstadoPagoFamilia = (typeof ESTADOS_PAGO_FAMILIA)[number];

// Mensajes literales (Partes 5.4 y 5.5).
export const MENSAJE_VENCIMIENTO_NO_ENCONTRADO = "Vencimiento no encontrado.";
export const MENSAJE_MOVIMIENTO_NO_ENCONTRADO = "Movimiento no encontrado.";
export const MENSAJE_IMPORTE_APLICADO =
  "El importe aplicado debe ser mayor que cero: no hay ningún caso modelado que admita importes negativos o cero.";
export const MENSAJE_REGLA_7 =
  "Rechazado (Regla 7): una conciliación Parcial o Agrupada exige confirmado_por.";
export const MENSAJE_MOTIVO_EXCESO =
  "Una sobre-conciliación autorizada exige un motivo explícito: sin motivo no se registra.";
export const MENSAJE_ENTORNOS_DISTINTOS =
  "El vencimiento y el movimiento pertenecen a entornos distintos: no se pueden conciliar entre sí.";

// ---------- Tipos del contexto ----------

export type FacturaPagos = {
  id: string;
  total: number;
  tipo_factura: string;
  factura_relacionada_id: string | null;
  estado_documental: string;
  entorno: string;
};

export type VencimientoPagos = {
  id: string;
  factura_id: string | null;
  compromiso_fijo_id: string | null;
  fecha: string;
  importe: number;
  estado: string;
  tipo: string;
  tipo_vencimiento: string;
  entorno: string;
};

export type MovimientoPagos = {
  id: string;
  importe: number;
  entorno: string;
};

export type DetalleConciliacionPagos = {
  vencimiento_id: string;
  movimiento_id: string;
  importe_aplicado: number;
};

export type ContextoPagos = {
  facturas: FacturaPagos[];
  vencimientos: VencimientoPagos[];
  movimientos: MovimientoPagos[];
  detalles: DetalleConciliacionPagos[];
};

const LIMITE_PROFUNDIDAD_CADENA = 200;

// ---------- F-10 / F-28 / F-29 ----------

/** F-10 · vencimientoYaConciliado: suma de importe_aplicado sobre ese vencimiento. */
export function vencimientoYaConciliado(vencimientoId: string, ctx: ContextoPagos) {
  return redondearEuros(
    ctx.detalles
      .filter((d) => d.vencimiento_id === vencimientoId)
      .reduce((suma, d) => suma + Number(d.importe_aplicado), 0),
  );
}

/** F-28 · movimientoYaAplicado: suma de importe_aplicado de ese movimiento. */
export function movimientoYaAplicado(movimientoId: string, ctx: ContextoPagos) {
  return redondearEuros(
    ctx.detalles
      .filter((d) => d.movimiento_id === movimientoId)
      .reduce((suma, d) => suma + Number(d.importe_aplicado), 0),
  );
}

/** F-29 · importeDisponibleMovimiento: |importe| − movimientoYaAplicado. */
export function importeDisponibleMovimiento(movimientoId: string, ctx: ContextoPagos) {
  const m = ctx.movimientos.find((x) => x.id === movimientoId);
  if (!m) return 0;
  return redondearEuros(Math.abs(Number(m.importe)) - movimientoYaAplicado(movimientoId, ctx));
}

// ---------- Familia documental ----------

export function esDocumentoRelacionado(f: FacturaPagos) {
  return f.tipo_factura !== "Normal" || !!f.factura_relacionada_id;
}

/** Sube la cadena documental hasta la factura original, con protección anti-ciclo. */
export function facturaOriginalDe(facturaId: string, ctx: ContextoPagos) {
  const visitados = new Set<string>();
  let actual = ctx.facturas.find((f) => f.id === facturaId) ?? null;
  let profundidad = 0;
  while (actual && actual.factura_relacionada_id) {
    if (visitados.has(actual.id) || profundidad > LIMITE_PROFUNDIDAD_CADENA) {
      return { original: null, cicloDetectado: true };
    }
    visitados.add(actual.id);
    profundidad += 1;
    const padre: FacturaPagos | null =
      ctx.facturas.find((f) => f.id === actual!.factura_relacionada_id) ?? null;
    if (!padre) break;
    actual = padre;
  }
  return { original: actual, cicloDetectado: false };
}

/** Descendientes (rectificativas/abonos, a cualquier profundidad) de una original. */
export function documentosRelacionadosDeFactura(originalId: string, ctx: ContextoPagos) {
  const encontrados: FacturaPagos[] = [];
  const visitados = new Set<string>([originalId]);
  let frontera = [originalId];
  let profundidad = 0;
  while (frontera.length > 0) {
    if (profundidad > LIMITE_PROFUNDIDAD_CADENA) {
      return { ajustes: encontrados, cicloDetectado: true };
    }
    const siguiente: string[] = [];
    for (const padreId of frontera) {
      for (const f of ctx.facturas) {
        if (f.factura_relacionada_id !== padreId) continue;
        if (visitados.has(f.id)) continue;
        visitados.add(f.id);
        encontrados.push(f);
        siguiente.push(f.id);
      }
    }
    frontera = siguiente;
    profundidad += 1;
  }
  return { ajustes: encontrados, cicloDetectado: false };
}

/**
 * familiaDocumentalFactura: la factura original de la cadena más todos sus
 * documentos relacionados. Hoy no existen rectificativas ni abonos, así que
 * `ajustes` viene vacío; la función es genérica, no asume que lo esté.
 */
export function familiaDocumentalFactura(facturaId: string, ctx: ContextoPagos) {
  const { original, cicloDetectado } = facturaOriginalDe(facturaId, ctx);
  if (!original || cicloDetectado) {
    return { original: null, ajustes: [] as FacturaPagos[], cicloDetectado: true };
  }
  const relacionados = documentosRelacionadosDeFactura(original.id, ctx);
  return {
    original,
    ajustes: relacionados.ajustes,
    cicloDetectado: relacionados.cicloDetectado,
  };
}

/** Vencimientos directos de una factura (filtro simple por factura_id). */
export function vencimientosDeFactura(facturaId: string, ctx: ContextoPagos) {
  return ctx.vencimientos.filter((v) => v.factura_id === facturaId);
}

// ---------- F-30 ----------

/** F-30 · estadoVencimientoCalculado. */
export function estadoVencimientoCalculado(
  v: Pick<VencimientoPagos, "id" | "importe" | "estado">,
  ctx: ContextoPagos,
): "Previsto" | "Pendiente" | "Pagado" {
  const conciliado = vencimientoYaConciliado(v.id, ctx);
  if (conciliado <= TOLERANCIA_REDONDEO_EUR) {
    return v.estado === "Previsto" ? "Previsto" : "Pendiente";
  }
  if (conciliado >= Number(v.importe) - TOLERANCIA_REDONDEO_EUR) return "Pagado";
  return "Pendiente";
}

export type DetalleVencimiento = {
  id: string;
  fecha: string;
  factura_id: string | null;
  compromiso_fijo_id: string | null;
  tipo: string;
  tipo_vencimiento: string;
  importeOriginal: number;
  importeConciliado: number;
  importePendiente: number;
  estadoAlmacenado: string;
  estadoCalculado: "Previsto" | "Pendiente" | "Pagado";
  /** Compara el estado guardado con el calculado. No corrige nada. */
  coherente: boolean;
};

/** F-30 · detalleVencimiento. */
export function detalleVencimiento(
  vencimientoId: string,
  ctx: ContextoPagos,
): DetalleVencimiento | null {
  const v = ctx.vencimientos.find((x) => x.id === vencimientoId);
  if (!v) return null;
  const importeConciliado = vencimientoYaConciliado(v.id, ctx);
  const estadoCalculado = estadoVencimientoCalculado(v, ctx);
  return {
    id: v.id,
    fecha: v.fecha,
    factura_id: v.factura_id,
    compromiso_fijo_id: v.compromiso_fijo_id,
    tipo: v.tipo,
    tipo_vencimiento: v.tipo_vencimiento,
    importeOriginal: redondearEuros(Number(v.importe)),
    importeConciliado,
    importePendiente: redondearEuros(Number(v.importe) - importeConciliado),
    estadoAlmacenado: v.estado,
    estadoCalculado,
    coherente: v.estado === estadoCalculado,
  };
}

// ---------- F-31 ----------

export type PosicionPagoFactura = {
  facturaOriginalId: string;
  /** T — importe documental de la factura original. */
  totalDocumental: number;
  /** A — ajustes posteriores (rectificativas/abonos), con su signo. */
  ajusteTotal: number;
  /** A' — parte de los ajustes que todavía no tiene vencimientos propios. */
  ajusteNoFormalizado: number;
  /** T + A */
  posicionDocumentalNeta: number;
  /** O — Σ importes de los vencimientos de la familia. */
  obligacionAbierta: number;
  /** P — Σ importes conciliados sobre esos vencimientos. */
  pagado: number;
  /** Uso interno, con signo. */
  netoPendiente: number | null;
  /** D — lo que realmente queda por pagar (siempre ≥ 0). */
  deudaPendiente: number | null;
  /** S — crédito generado por un ajuste ya pagado (siempre ≥ 0). */
  saldoAFavor: number | null;
  /** > 0 significa incoherencia de datos; se expone, nunca se absorbe. */
  excesoAjusteNoRespaldado: number | null;
  sinVencimientos: boolean;
  numVencimientos: number;
  numAjustes: number;
  /** O − T */
  diferenciaObligacionVsDocumento: number;
};

/**
 * F-31 · posicionPagoFactura — función central del sistema de pagos, a nivel
 * FAMILIA. Devuelve las seis magnitudes por separado, sin mezclarlas nunca.
 * Devuelve null si no hay factura original o se detecta un ciclo documental.
 */
export function posicionPagoFactura(
  facturaId: string,
  ctx: ContextoPagos,
): PosicionPagoFactura | null {
  const familia = familiaDocumentalFactura(facturaId, ctx);
  if (!familia.original || familia.cicloDetectado) return null;
  const original = familia.original;
  const ajustes = familia.ajustes;

  // T y A (documental)
  const totalDocumental = redondearEuros(Number(original.total));
  const ajusteTotal = redondearEuros(
    ajustes.reduce((suma, a) => suma + Number(a.total), 0),
  );
  const posicionDocumentalNeta = redondearEuros(totalDocumental + ajusteTotal);

  // O y P (vencimientos de toda la familia)
  const vencimientosFamilia = [original, ...ajustes].flatMap((f) =>
    vencimientosDeFactura(f.id, ctx),
  );
  const obligacionAbierta = redondearEuros(
    vencimientosFamilia.reduce((suma, v) => suma + Number(v.importe), 0),
  );
  const pagado = redondearEuros(
    vencimientosFamilia.reduce((suma, v) => suma + vencimientoYaConciliado(v.id, ctx), 0),
  );

  // A' — ajuste no formalizado: lo que un ajuste cambia y todavía no está
  // recogido en sus propios vencimientos (nunca doble conteo con O).
  const ajusteNoFormalizado = redondearEuros(
    ajustes.reduce((suma, a) => {
      const propios = vencimientosDeFactura(a.id, ctx).reduce(
        (s, v) => s + Number(v.importe),
        0,
      );
      return suma + (Number(a.total) - propios);
    }, 0),
  );

  const sinVencimientos = vencimientosFamilia.length === 0;
  const base = {
    facturaOriginalId: original.id,
    totalDocumental,
    ajusteTotal,
    ajusteNoFormalizado,
    posicionDocumentalNeta,
    obligacionAbierta,
    pagado,
    sinVencimientos,
    numVencimientos: vencimientosFamilia.length,
    numAjustes: ajustes.length,
    diferenciaObligacionVsDocumento: redondearEuros(obligacionAbierta - totalDocumental),
  };

  // Sin ningún vencimiento en la familia no se inventa ningún pago.
  if (sinVencimientos) {
    return {
      ...base,
      netoPendiente: null,
      deudaPendiente: null,
      saldoAFavor: null,
      excesoAjusteNoRespaldado: null,
    };
  }

  const netoPendiente = redondearEuros(obligacionAbierta - pagado + ajusteNoFormalizado);
  let deudaPendiente = redondearEuros(Math.max(0, netoPendiente));
  const saldoBruto = redondearEuros(Math.max(0, -netoPendiente));
  // Un crédito nunca puede superar lo efectivamente pagado.
  let saldoAFavor = redondearEuros(Math.min(saldoBruto, pagado));
  const excesoAjusteNoRespaldado = redondearEuros(saldoBruto - saldoAFavor);
  if (deudaPendiente <= TOLERANCIA_REDONDEO_EUR) deudaPendiente = 0;
  if (saldoAFavor <= TOLERANCIA_REDONDEO_EUR) saldoAFavor = 0;

  return { ...base, netoPendiente, deudaPendiente, saldoAFavor, excesoAjusteNoRespaldado };
}

// ---------- F-32 ----------

/**
 * F-32 · estadoPagoFamiliaFactura. Deriva siempre de posicionPagoFactura();
 * nunca se persiste (RB-017). La primera condición que se cumple gana.
 */
export function estadoPagoFamiliaFactura(
  facturaId: string,
  ctx: ContextoPagos,
): EstadoPagoFamilia | null {
  const p = posicionPagoFactura(facturaId, ctx);
  if (!p) return null;
  const original = ctx.facturas.find((f) => f.id === p.facturaOriginalId);
  if (original?.estado_documental === "Anulada") return "Anulada";
  if (p.sinVencimientos) return "Sin vencimiento registrado";
  if ((p.saldoAFavor ?? 0) > 0) return "Pagada con saldo a favor";
  if ((p.deudaPendiente ?? 0) <= TOLERANCIA_REDONDEO_EUR) return "Pagada";
  if (p.pagado <= TOLERANCIA_REDONDEO_EUR) return "Pendiente";
  return "Parcialmente pagada";
}

// ---------- 5.4 · validarConciliacion ----------

export type ResultadoValidacionConciliacion = {
  ok: boolean;
  errores: string[];
  pendienteVencimiento: number | null;
  disponibleMovimiento: number | null;
  excedeVencimiento: boolean;
  excedeMovimiento: boolean;
  excesoSobreVencimiento: number;
  excesoSobreMovimiento: number;
};

/** 5.4 · validarConciliacion — no escribe nada. */
export function validarConciliacion(
  entrada: { vencimientoId: string; movimientoId: string; importeAplicado: number },
  ctx: ContextoPagos,
): ResultadoValidacionConciliacion {
  const errores: string[] = [];
  const v = ctx.vencimientos.find((x) => x.id === entrada.vencimientoId);
  const m = ctx.movimientos.find((x) => x.id === entrada.movimientoId);
  if (!v) errores.push(MENSAJE_VENCIMIENTO_NO_ENCONTRADO);
  if (!m) errores.push(MENSAJE_MOVIMIENTO_NO_ENCONTRADO);
  if (!Number.isFinite(entrada.importeAplicado) || entrada.importeAplicado <= 0) {
    errores.push(MENSAJE_IMPORTE_APLICADO);
  }
  if (v && m && v.entorno !== m.entorno) errores.push(MENSAJE_ENTORNOS_DISTINTOS);

  if (errores.length > 0 || !v || !m) {
    return {
      ok: false,
      errores,
      pendienteVencimiento: null,
      disponibleMovimiento: null,
      excedeVencimiento: false,
      excedeMovimiento: false,
      excesoSobreVencimiento: 0,
      excesoSobreMovimiento: 0,
    };
  }

  const pendienteVencimiento = redondearEuros(
    Number(v.importe) - vencimientoYaConciliado(v.id, ctx),
  );
  const disponibleMovimiento = importeDisponibleMovimiento(m.id, ctx);
  const excedeVencimiento =
    entrada.importeAplicado > pendienteVencimiento + TOLERANCIA_REDONDEO_EUR;
  const excedeMovimiento =
    entrada.importeAplicado > disponibleMovimiento + TOLERANCIA_REDONDEO_EUR;

  return {
    ok: !excedeVencimiento && !excedeMovimiento,
    errores,
    pendienteVencimiento,
    disponibleMovimiento,
    excedeVencimiento,
    excedeMovimiento,
    excesoSobreVencimiento: excedeVencimiento
      ? redondearEuros(entrada.importeAplicado - pendienteVencimiento)
      : 0,
    excesoSobreMovimiento: excedeMovimiento
      ? redondearEuros(entrada.importeAplicado - disponibleMovimiento)
      : 0,
  };
}

function eurosPlano(n: number) {
  return `${n.toFixed(2).replace(".", ",")} €`;
}

/** Mensaje de rechazo por exceso, con el detalle exacto de cada lado. */
export function mensajeExcesoConciliacion(v: ResultadoValidacionConciliacion) {
  const partes: string[] = [];
  if (v.excedeVencimiento) {
    partes.push(`excede el pendiente del vencimiento en ${eurosPlano(v.excesoSobreVencimiento)}`);
  }
  if (v.excedeMovimiento) {
    partes.push(
      `excede el importe disponible del movimiento en ${eurosPlano(v.excesoSobreMovimiento)}`,
    );
  }
  return `Sobre-conciliación no autorizada: ${partes.join(" y ")}.`;
}
