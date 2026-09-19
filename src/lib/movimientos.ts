// Listas cerradas y fórmulas de Movimiento (Partes 2.5, 7.7 y F-00/F-01 del documento).
// No se amplían ni se renombran.

/** Lista completa del documento. 'Transferencia interna' NO se ofrece en el alta (RB-003 / Regla 6). */
export const TIPOS_MOVIMIENTO = [
  "Ingreso",
  "Gasto",
  "Financiación",
  "Transferencia interna",
] as const;

/** Tipos seleccionables en el formulario general de Movimientos (RB-003). */
export const TIPOS_MOVIMIENTO_ALTA = ["Ingreso", "Gasto", "Financiación"] as const;

export const SUBTIPOS_FINANCIACION = [
  "Principal recibido",
  "Principal devuelto",
  "Intereses",
  "Comisiones",
] as const;

export const DIRECCIONES_MOVIMIENTO = ["entrada", "salida"] as const;

/** Lista fija en código, no es una colección del sistema (Parte 2.5). */
export const METODOS_COBRO_PAGO = ["TPV", "Bizum", "Efectivo", "Transferencia"] as const;

export const ESTADOS_MOVIMIENTO = ["Previsto", "Pendiente", "Confirmado", "Conciliado"] as const;

/** 'Conciliado' solo lo asigna el motor de conciliación (Parte 7.7). */
export const ESTADOS_MOVIMIENTO_ALTA = ["Previsto", "Pendiente", "Confirmado"] as const;

export const ORIGENES_MOVIMIENTO = ["Manual", "Importado", "Regla"] as const;

export const CLASIFICACIONES_ORIGEN = ["automatica", "manual"] as const;

export type TipoMovimiento = (typeof TIPOS_MOVIMIENTO)[number];
export type TipoMovimientoAlta = (typeof TIPOS_MOVIMIENTO_ALTA)[number];
export type SubtipoFinanciacion = (typeof SUBTIPOS_FINANCIACION)[number];
export type DireccionMovimiento = (typeof DIRECCIONES_MOVIMIENTO)[number];
export type MetodoCobroPago = (typeof METODOS_COBRO_PAGO)[number];
export type EstadoMovimiento = (typeof ESTADOS_MOVIMIENTO)[number];
export type OrigenMovimiento = (typeof ORIGENES_MOVIMIENTO)[number];
export type ClasificacionOrigen = (typeof CLASIFICACIONES_ORIGEN)[number];

/** Mensaje literal de RB-001 (Regla 1). */
export const MENSAJE_REGLA_1 = "Rechazado (Regla 1): falta subtipo.";

/** Estados que participan en saldoInterno() y movimientosFiltrados() (F-01, Parte 7.7). */
export const ESTADOS_QUE_SUMAN_AL_SALDO: EstadoMovimiento[] = ["Confirmado", "Conciliado"];

export type MovimientoParaSigno = {
  tipo: TipoMovimiento | string;
  subtipo_financiacion?: SubtipoFinanciacion | string | null;
  direccion?: DireccionMovimiento | string | null;
};

/**
 * F-00 · signoMovimiento. El signo nunca se guarda (RB-002): se deriva siempre.
 * Cualquier tipo no reconocido cuenta como 0, sin error.
 */
export function signoMovimiento(m: MovimientoParaSigno): -1 | 0 | 1 {
  if (m.tipo === "Ingreso") return 1;
  if (m.tipo === "Gasto") return -1;
  if (m.tipo === "Transferencia interna") return m.direccion === "entrada" ? 1 : -1;
  if (m.tipo === "Financiación") {
    return m.subtipo_financiacion === "Principal recibido" ? 1 : -1;
  }
  return 0;
}

export type MovimientoParaSaldo = MovimientoParaSigno & {
  importe: number;
  estado: EstadoMovimiento | string;
  fecha: string;
};

/**
 * F-01 · saldoInterno. total = saldo_apertura + Σ |importe| × signo(m), con los
 * movimientos de la cuenta en estado Confirmado o Conciliado cuya fecha está
 * entre fecha_saldo_apertura y la fecha pedida (ambas incluidas).
 * Sin redondeo explícito: el redondeo ocurre en los consumidores.
 */
export function saldoInterno(
  cuenta: { saldo_apertura: number; fecha_saldo_apertura: string },
  movimientos: MovimientoParaSaldo[],
  fechaISO: string,
) {
  let total = Number(cuenta.saldo_apertura);
  for (const m of movimientos) {
    if (!ESTADOS_QUE_SUMAN_AL_SALDO.includes(m.estado as EstadoMovimiento)) continue;
    if (m.fecha < cuenta.fecha_saldo_apertura || m.fecha > fechaISO) continue;
    total += Math.abs(Number(m.importe)) * signoMovimiento(m);
  }
  return total;
}

/** ¿Este movimiento queda fuera del saldo interno por su fecha? (aviso de interfaz) */
export function fueraDeRangoDeSaldo(
  cuenta: { fecha_saldo_apertura: string },
  fechaMovimiento: string,
) {
  return fechaMovimiento < cuenta.fecha_saldo_apertura;
}
