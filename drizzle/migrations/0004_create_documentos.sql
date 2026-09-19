CREATE TYPE public.documento_estado AS ENUM ('Activo', 'Sustituido');

CREATE TABLE public.documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  factura_id UUID NOT NULL REFERENCES public.facturas(id),
  nombre_original TEXT NOT NULL,
  tipo_mime TEXT NOT NULL,
  tamano_bytes BIGINT NOT NULL,
  hash_sha256 TEXT NOT NULL,
  fecha_incorporacion TIMESTAMPTZ NOT NULL DEFAULT now(),
  actor TEXT NOT NULL DEFAULT 'Alfonso',
  referencia_almacenamiento TEXT NOT NULL,
  estado_documento public.documento_estado NOT NULL DEFAULT 'Activo',
  entorno public.entorno_tipo NOT NULL DEFAULT 'produccion',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_documentos_factura ON public.documentos (factura_id);
CREATE INDEX idx_documentos_hash ON public.documentos (hash_sha256);

-- Solo un documento 'Activo' por factura.
CREATE UNIQUE INDEX idx_documentos_activo_unico
  ON public.documentos (factura_id)
  WHERE estado_documento = 'Activo';

GRANT ALL ON public.documentos TO service_role;

ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "documentos solo service_role"
  ON public.documentos
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- El bucket es privado: ningún rol anónimo o autenticado puede leer ni escribir
-- objetos; solo las funciones de servidor con la clave de la aplicación.
CREATE POLICY "documentos facturas solo service_role"
  ON storage.objects
  FOR ALL
  TO service_role
  USING (bucket_id = 'documentos-facturas')
  WITH CHECK (bucket_id = 'documentos-facturas');
