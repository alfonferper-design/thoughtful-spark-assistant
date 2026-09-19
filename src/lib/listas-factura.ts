// Listas cerradas de Factura (Parte 7 del documento). No se amplían ni se renombran.
export const ESTADOS_DOCUMENTALES_FACTURA = [
  "Recibida",
  "En revisión",
  "Validada",
  "Incidencia",
  "Anulada",
] as const;

export const ESTADOS_DUPLICADO_FACTURA = [
  "No detectado",
  "Posible duplicado",
  "Duplicado confirmado",
  "Falso positivo",
] as const;

export const ESTADOS_CONTABLES_FACTURA = ["Pendiente", "Contabilizada", "Revisada"] as const;

export const TIPOS_FACTURA = ["Normal", "Rectificativa", "Abono"] as const;

/**
 * Naturaleza: el documento la lista como valores observados, no como lista
 * cerrada del motor (Parte 2.6). Se ofrece como sugerencia de interfaz.
 */
export const NATURALEZAS_SUGERIDAS = [
  "Compra de mercancía",
  "Gasto fijo",
  "Gasto variable",
  "Servicio",
  "Impuesto",
  "Nómina",
  "Financiación",
  "Otro",
] as const;

export type EstadoDocumentalFactura = (typeof ESTADOS_DOCUMENTALES_FACTURA)[number];
export type EstadoDuplicadoFactura = (typeof ESTADOS_DUPLICADO_FACTURA)[number];
export type EstadoContableFactura = (typeof ESTADOS_CONTABLES_FACTURA)[number];
export type TipoFactura = (typeof TIPOS_FACTURA)[number];

/** RB-006 (Regla 9): estos dos estados bloquean la generación de vencimientos. */
export function facturaBloqueadaPorDuplicado(estado: EstadoDuplicadoFactura) {
  return estado === "Posible duplicado" || estado === "Duplicado confirmado";
}
