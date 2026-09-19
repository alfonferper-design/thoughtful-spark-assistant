/**
 * Redondeo y tolerancia monetaria (RB-016 / F-24 del documento).
 * TOLERANCIA_REDONDEO_EUR es el único margen admitido en todo el sistema:
 * ninguna otra función define su propio margen.
 */
export const TOLERANCIA_REDONDEO_EUR = 0.01;

export function redondearEuros(n: number | null | undefined) {
  return Math.round((n || 0) * 100) / 100;
}

export function dentroDeTolerancia(a: number, b: number) {
  return Math.abs(a - b) <= TOLERANCIA_REDONDEO_EUR + 1e-9;
}
