/**
 * Diagnóstico (Parte 9.1) — núcleo puro: salud documental (F-39), informe de
 * estado del almacenamiento y candidatos a limpieza. Nada de esto borra: solo
 * informa. La limpieza real vive en una función de servidor y exige
 * confirmación explícita, y nunca toca datos de producción (RB-018).
 */

export type FacturaDiag = { id: string; numero_factura: string | null; entorno: string };
export type DocumentoDiag = {
  id: string;
  factura_id: string;
  hash_sha256: string;
  estado_documento: string;
  entorno: string;
};

export type SaludDocumental = {
  totalFacturas: number;
  conDocumento: number;
  sinDocumento: number;
  porcentajeConDocumento: number;
  documentosActivos: number;
  documentosSustituidos: number;
  facturasSinDocumento: FacturaDiag[];
  posiblesDuplicadosDocumentales: { hash: string; facturas: string[] }[];
};

/**
 * F-39 · saludDocumental. Cuenta facturas con/sin documento activo, documentos
 * activos/sustituidos y detecta duplicados documentales (mismo hash en más de
 * una factura distinta) sin corregir nada.
 */
export function saludDocumental(
  facturas: FacturaDiag[],
  documentos: DocumentoDiag[],
  soloProduccion = true,
): SaludDocumental {
  const f = soloProduccion ? facturas.filter((x) => x.entorno === "produccion") : facturas;
  const d = soloProduccion ? documentos.filter((x) => x.entorno === "produccion") : documentos;

  const activos = d.filter((x) => x.estado_documento === "Activo");
  const conDocumento = f.filter((x) => activos.some((doc) => doc.factura_id === x.id));
  const sinDocumento = f.filter((x) => !activos.some((doc) => doc.factura_id === x.id));

  const porHash = new Map<string, Set<string>>();
  for (const doc of d) {
    const set = porHash.get(doc.hash_sha256) ?? new Set<string>();
    set.add(doc.factura_id);
    porHash.set(doc.hash_sha256, set);
  }

  return {
    totalFacturas: f.length,
    conDocumento: conDocumento.length,
    sinDocumento: sinDocumento.length,
    porcentajeConDocumento:
      f.length === 0 ? 0 : Math.round((conDocumento.length / f.length) * 1000) / 10,
    documentosActivos: activos.length,
    documentosSustituidos: d.filter((x) => x.estado_documento === "Sustituido").length,
    facturasSinDocumento: sinDocumento,
    posiblesDuplicadosDocumentales: [...porHash.entries()]
      .filter(([, facturasDelHash]) => facturasDelHash.size > 1)
      .map(([hash, facturasDelHash]) => ({ hash, facturas: [...facturasDelHash] })),
  };
}

/** Las 13 entidades nombradas explícitamente en la Parte 9.1, en ese orden. */
export const ENTIDADES_ALMACENAMIENTO = [
  "CuentaBancaria",
  "Movimiento",
  "Proveedor",
  "Factura",
  "Vencimiento",
  "CompromisoFijo",
  "SnapshotSaldoBancario",
  "Conciliacion",
  "Transferencia",
  "Categoria",
  "Subcategoria",
  "Documento",
  "Auditoria",
] as const;
export type EntidadAlmacenamiento = (typeof ENTIDADES_ALMACENAMIENTO)[number];

export type FilaAlmacenamiento = {
  entidad: string;
  total: number;
  produccion: number;
  prueba: number;
  huerfanos: number;
  nota?: string;
};

export type CandidatoLimpieza = {
  coleccion: string;
  id: string;
  etiqueta: string;
  motivo: string;
};

/**
 * Nota literal del documento: `MetodoCobroPago` no es una colección real, es
 * una lista fija en código (TPV/Bizum/Efectivo/Transferencia).
 */
export const NOTA_METODOS =
  "MetodoCobroPago no es una colección real: es una lista fija en código (TPV, Bizum, Efectivo, Transferencia).";
