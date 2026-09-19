// Listas cerradas y reglas de Vencimiento (Partes 2.9, 5.6, F-15 y RB-006/Regla 10).
// No se amplían ni se renombran.

/** 'Pagado' solo lo asigna el motor de conciliación (registrarConciliacion). */
export const ESTADOS_VENCIMIENTO = ["Previsto", "Pendiente", "Pagado"] as const;

/** Estados seleccionables en el alta: 'Pagado' nunca es asignable a mano. */
export const ESTADOS_VENCIMIENTO_ALTA = ["Previsto", "Pendiente"] as const;

export const TIPOS_VENCIMIENTO = [
  "Proveedor",
  "Impuesto",
  "Nómina",
  "Financiación",
  "Otro",
] as const;

export const CLASES_VENCIMIENTO = ["Pago", "Cobro"] as const;

export type EstadoVencimiento = (typeof ESTADOS_VENCIMIENTO)[number];
export type EstadoVencimientoAlta = (typeof ESTADOS_VENCIMIENTO_ALTA)[number];
export type TipoVencimiento = (typeof TIPOS_VENCIMIENTO)[number];
export type ClaseVencimiento = (typeof CLASES_VENCIMIENTO)[number];

/** Estado por defecto según origen (Parte 2.9). */
export const ESTADO_DEFECTO_ALTA_MANUAL: EstadoVencimientoAlta = "Pendiente";
export const ESTADO_DEFECTO_COMPROMISO: EstadoVencimientoAlta = "Previsto";

// Mensajes literales del documento (Partes 5.6 y 12).
export const MENSAJE_REGLA_10_NINGUNO =
  "Rechazado (Regla 10): falta factura o compromiso.";
export const MENSAJE_REGLA_10_AMBOS =
  "Rechazado (Regla 10): un vencimiento no puede nacer de una factura y de un compromiso a la vez.";
export const MENSAJE_IMPORTE_VENCIMIENTO =
  "El importe de un vencimiento debe ser mayor que cero: no se admiten importes negativos ni cero (un abono se representa como documento relacionado, no como un vencimiento en negativo).";
export const MENSAJE_FECHA_VENCIMIENTO = "El vencimiento necesita una fecha.";
export const MENSAJE_FACTURA_NO_ENCONTRADA = "Factura no encontrada.";
export const MENSAJE_REGLA_9 =
  "Regla 9: una factura en posible duplicado o duplicado confirmado no puede generar vencimientos hasta resolverse.";
/** CompromisoFijo no está construido todavía: no se inventa su validación. */
export const MENSAJE_COMPROMISO_NO_DISPONIBLE =
  "Los compromisos fijos todavía no existen en el sistema: por ahora un vencimiento solo puede nacer de una factura.";

/** Estados de duplicado que bloquean la generación de vencimientos (RB-006 / Regla 9). */
export const ESTADOS_DUPLICADO_QUE_BLOQUEAN = [
  "Posible duplicado",
  "Duplicado confirmado",
] as const;

export function duplicadoBloqueaVencimiento(estadoDuplicado: string) {
  return (ESTADOS_DUPLICADO_QUE_BLOQUEAN as readonly string[]).includes(estadoDuplicado);
}

/**
 * F-15 · facturasElegiblesParaVencimiento: excluye del alta cualquier factura
 * en duplicado no resuelto. La misma regla se re-valida al escribir (RB-006).
 */
export function facturasElegiblesParaVencimiento<T extends { estado_duplicado: string }>(
  facturas: T[],
) {
  return facturas.filter((f) => !duplicadoBloqueaVencimiento(f.estado_duplicado));
}

/** Origen visible en el listado global: de factura o de compromiso fijo. */
export function origenVencimiento(v: {
  factura_id: string | null;
  compromiso_fijo_id: string | null;
}): "Factura" | "Compromiso fijo" {
  return v.factura_id ? "Factura" : "Compromiso fijo";
}
