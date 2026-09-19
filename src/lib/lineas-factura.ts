import { dentroDeTolerancia, redondearEuros } from "@/lib/dinero";

// Listas cerradas de FacturaLinea (Partes 2.7 y 7.8). No se amplían ni se renombran.
export const ESTADOS_LINEA_FACTURA = ["Activa", "Eliminada"] as const;
export const TIPOS_DESCUENTO_LINEA = ["Porcentual", "Absoluto"] as const;
export const ORIGENES_IMPORTES_LINEA = ["formula", "documento"] as const;

export type EstadoLineaFactura = (typeof ESTADOS_LINEA_FACTURA)[number];
export type TipoDescuentoLinea = (typeof TIPOS_DESCUENTO_LINEA)[number];
export type OrigenImportesLinea = (typeof ORIGENES_IMPORTES_LINEA)[number];

/** Parte 3.7: campos de entrada de la fórmula. */
export const CAMPOS_FORMULA_LINEA = [
  "cantidad",
  "precio_unitario",
  "descuento_tipo",
  "descuento_valor",
  "tipo_impositivo",
] as const;

/** Parte 3.7: importes que, si se tocan, se respetan tal cual (origen 'documento'). */
export const CAMPOS_IMPORTE_LINEA = ["base_imponible", "cuota_impuesto", "total"] as const;

export type EntradaLinea = {
  cantidad?: number | null;
  precio_unitario?: number | null;
  descuento_tipo?: TipoDescuentoLinea | null;
  descuento_valor?: number | null;
  tipo_impositivo?: number | null;
  base_imponible?: number | null;
  cuota_impuesto?: number | null;
  total?: number | null;
};

export type ImportesLinea = {
  importe_bruto: number | null;
  descuento_importe: number;
  base_imponible: number | null;
  cuota_impuesto: number | null;
  total: number | null;
};

/**
 * F-19 · calcularLineaFactura(l) — fórmula literal de la Parte 3.7.
 * Se aplica solo donde faltan datos: un importe ya fijado en la línea se
 * respeta tal cual y nunca se le superpone la fórmula.
 */
export function calcularLineaFactura(l: EntradaLinea): ImportesLinea {
  const cantidad = l.cantidad ?? null;
  const precio = l.precio_unitario ?? null;
  const importe_bruto =
    cantidad != null && precio != null ? redondearEuros(cantidad * precio) : null;

  const descuento_importe = calcularDescuentoImporteLinea(importe_bruto, l);

  const base_imponible =
    l.base_imponible ??
    (importe_bruto != null ? redondearEuros(importe_bruto - descuento_importe) : null);

  const cuota_impuesto =
    l.cuota_impuesto ??
    (base_imponible != null && l.tipo_impositivo != null
      ? Math.round(base_imponible * l.tipo_impositivo) / 100
      : null);

  const total =
    l.total ??
    (base_imponible != null ? redondearEuros(base_imponible + (cuota_impuesto || 0)) : null);

  return { importe_bruto, descuento_importe, base_imponible, cuota_impuesto, total };
}

/** F-20 · calcularDescuentoImporteLinea. */
export function calcularDescuentoImporteLinea(
  importe_bruto: number | null,
  l: Pick<EntradaLinea, "descuento_tipo" | "descuento_valor">,
) {
  const valor = l.descuento_valor ?? 0;
  if (l.descuento_tipo === "Porcentual") {
    return Math.round((importe_bruto ?? 0) * valor) / 100;
  }
  if (l.descuento_tipo === "Absoluto") return valor;
  return 0;
}

export type LineaCalculable = {
  base_imponible: number | null;
  cuota_impuesto: number | null;
  total: number | null;
};

/** F-21 · calcularTotalesLineasFactura: suma de líneas activas. */
export function calcularTotalesLineasFactura(lineas: LineaCalculable[]) {
  let baseTotal = 0;
  let cuotaTotal = 0;
  let total = 0;
  for (const l of lineas) {
    baseTotal += Number(l.base_imponible ?? 0);
    cuotaTotal += Number(l.cuota_impuesto ?? 0);
    total += Number(l.total ?? 0);
  }
  return {
    lineas: lineas.length,
    baseTotal: redondearEuros(baseTotal),
    cuotaTotal: redondearEuros(cuotaTotal),
    total: redondearEuros(total),
  };
}

export type TipoFiscalCabecera = {
  impuesto_tipo?: string | null;
  base_imponible?: number | null;
  cuota_impuesto?: number | null;
};

/**
 * F-16 · resumenFiscalFactura(f) — desglose fiscal de CABECERA.
 * Sin desglose registrado devuelve 'No registrado', nunca un 0 € implícito (RB-020).
 */
export function resumenFiscalFactura(desglose_fiscal: unknown) {
  const tramos: TipoFiscalCabecera[] = Array.isArray(desglose_fiscal)
    ? (desglose_fiscal as TipoFiscalCabecera[])
    : [];
  if (tramos.length === 0) {
    return { estado: "No registrado" as const, tipos: [] as string[], baseTotal: 0, cuotaTotal: 0 };
  }
  const baseTotal = redondearEuros(tramos.reduce((s, t) => s + Number(t.base_imponible ?? 0), 0));
  const cuotaTotal = redondearEuros(tramos.reduce((s, t) => s + Number(t.cuota_impuesto ?? 0), 0));
  const tipos = Array.from(
    new Set(tramos.map((t) => t.impuesto_tipo).filter((t): t is string => !!t)),
  );
  return { estado: "Registrado" as const, tipos, baseTotal, cuotaTotal };
}

export type ComparacionLineasCabecera =
  | { tieneLineas: false }
  | {
      tieneLineas: true;
      lineas: number;
      baseLineas: number;
      cuotaLineas: number;
      totalLineas: number;
      cabeceraConFiscalidad: boolean;
      baseCabecera: number | null;
      totalCabecera: number;
      diferenciaBase: number | null;
      diferenciaTotal: number;
      coherenteBase: boolean | null;
      coherenteTotal: boolean;
    };

/**
 * F-22 · compararTotalesLineasCabecera — nunca corrige nada, solo expone la
 * diferencia (Parte 3.7). La base solo se compara si la cabecera tiene
 * fiscalidad registrada; si no, no es una incoherencia.
 */
export function compararTotalesLineasCabecera(
  factura: { total: number; desglose_fiscal: unknown },
  lineasActivas: LineaCalculable[],
): ComparacionLineasCabecera {
  if (lineasActivas.length === 0) return { tieneLineas: false };
  const sumas = calcularTotalesLineasFactura(lineasActivas);
  const fiscal = resumenFiscalFactura(factura.desglose_fiscal);
  const cabeceraConFiscalidad = fiscal.estado === "Registrado";
  const totalCabecera = redondearEuros(Number(factura.total));
  return {
    tieneLineas: true,
    lineas: sumas.lineas,
    baseLineas: sumas.baseTotal,
    cuotaLineas: sumas.cuotaTotal,
    totalLineas: sumas.total,
    cabeceraConFiscalidad,
    baseCabecera: cabeceraConFiscalidad ? fiscal.baseTotal : null,
    totalCabecera,
    diferenciaBase: cabeceraConFiscalidad
      ? redondearEuros(sumas.baseTotal - fiscal.baseTotal)
      : null,
    diferenciaTotal: redondearEuros(sumas.total - totalCabecera),
    coherenteBase: cabeceraConFiscalidad
      ? dentroDeTolerancia(sumas.baseTotal, fiscal.baseTotal)
      : null,
    coherenteTotal: dentroDeTolerancia(sumas.total, totalCabecera),
  };
}
