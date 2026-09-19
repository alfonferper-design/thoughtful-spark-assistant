// Listas y límites del documento adjunto de una factura (Partes 2.13 y 3.8).
// El contenido exacto de TIPOS_DOC_PERMITIDOS no se transcribió en el documento;
// se usan literalmente los cuatro tipos que nombra el mensaje de error
// ("Solo se aceptan PDF, JPG, PNG o WEBP."), sin añadir ninguno más.
export const TIPOS_DOC_PERMITIDOS: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const MAX_DOC_BYTES = 10 * 1024 * 1024; // 10 MB por documento

export const ESTADOS_DOCUMENTO = ["Activo", "Sustituido"] as const;
export type EstadoDocumento = (typeof ESTADOS_DOCUMENTO)[number];

export const RESULTADOS_SUBIDA_DOCUMENTO = [
  "sin_cambios",
  "duplicado_detectado",
  "sustituido",
  "asociado",
] as const;
export type ResultadoSubidaDocumento = (typeof RESULTADOS_SUBIDA_DOCUMENTO)[number];

// Mensajes literales del documento, en el orden exacto de validación.
export const MENSAJE_TIPO_NO_PERMITIDO = "Solo se aceptan PDF, JPG, PNG o WEBP.";
export const MENSAJE_ARCHIVO_VACIO = "El archivo está vacío.";
export const MENSAJE_DEMASIADO_GRANDE = "El archivo supera el máximo de 10 MB por documento.";
export const MENSAJE_ALMACENAMIENTO_NO_DISPONIBLE =
  "El almacenamiento de documentos (assets) no está disponible en esta vista.";

export function extensionDeTipo(tipoMime: string): string {
  return TIPOS_DOC_PERMITIDOS[tipoMime] ?? "bin";
}

export function tamanoLegible(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
