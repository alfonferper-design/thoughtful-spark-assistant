import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDocumentosFactura, type DocumentoFactura } from "@/lib/datos";
import { enlaceDocumento, subirDocumentoFactura } from "@/lib/datos.functions";
import { MAX_DOC_BYTES, TIPOS_DOC_PERMITIDOS, tamanoLegible } from "@/lib/documentos";

const ACEPTADOS = Object.keys(TIPOS_DOC_PERMITIDOS).join(",");

function fechaLegible(iso: string) {
  return new Date(iso).toLocaleString("es-ES");
}

async function aBase64(archivo: File) {
  const buffer = await archivo.arrayBuffer();
  let binario = "";
  const bytes = new Uint8Array(buffer);
  const trozo = 0x8000;
  for (let i = 0; i < bytes.length; i += trozo) {
    binario += String.fromCharCode(...bytes.subarray(i, i + trozo));
  }
  return btoa(binario);
}

export function PanelDocumentoFactura({
  facturaId,
  actor,
}: {
  facturaId: string;
  actor: string;
}) {
  const { data: documentos } = useDocumentosFactura(facturaId);
  const queryClient = useQueryClient();
  const entrada = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [duplicado, setDuplicado] = useState<{ archivo: File; facturas: string[] } | null>(null);

  const lista = (documentos ?? []) as DocumentoFactura[];
  const activo = lista.find((d) => d.estado_documento === "Activo") ?? null;

  async function refrescar() {
    await queryClient.invalidateQueries({ queryKey: ["factura-documentos", facturaId] });
    await queryClient.invalidateQueries({ queryKey: ["auditoria"] });
  }

  async function subir(archivo: File, forzarDuplicado: boolean) {
    setSubiendo(true);
    try {
      const respuesta = await subirDocumentoFactura({
        data: {
          facturaId,
          actor,
          nombre: archivo.name,
          tipoMime: archivo.type,
          contenidoBase64: await aBase64(archivo),
          forzarDuplicado,
        },
      });
      if (respuesta.resultado === "sin_cambios") {
        toast.info("Es el mismo archivo que ya está adjunto: no se ha cambiado nada.");
      } else if (respuesta.resultado === "duplicado_detectado") {
        setDuplicado({ archivo, facturas: respuesta.facturasConEseHash ?? [] });
        toast.warning("Este archivo ya está guardado en el sistema. Revísalo antes de seguir.");
        return;
      } else if (respuesta.resultado === "sustituido") {
        toast.success("Documento sustituido. El anterior se conserva como sustituido.");
      } else {
        toast.success("Documento asociado a la factura.");
      }
      setDuplicado(null);
      if (entrada.current) entrada.current.value = "";
      await refrescar();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSubiendo(false);
    }
  }

  async function abrir(id: string, descargar = false) {
    try {
      const { url } = await enlaceDocumento({ data: { id, descargar } });
      if (descargar) window.location.href = url;
      else window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      toast.error("No se pudo abrir la factura original. Inténtalo de nuevo.");
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Documentación</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {activo ? (
          <div className="rounded-md border p-4">
            <p className="font-medium">📄 Factura original</p>
            <p className="mb-3 text-muted-foreground">
              {activo.nombre_original} · {tamanoLegible(Number(activo.tamano_bytes))}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => void abrir(activo.id)}>
                📄 Ver factura original
              </Button>
              <Button size="sm" variant="outline" onClick={() => void abrir(activo.id, true)}>
                Descargar
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-md border border-dashed p-4">
            <p className="font-medium">Sin factura original</p>
            <p className="text-muted-foreground">
              Esta factura todavía no tiene un documento adjunto.
            </p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <Input
            ref={entrada}
            type="file"
            accept={ACEPTADOS}
            className="max-w-sm"
            disabled={subiendo}
            onChange={() => setDuplicado(null)}
          />
          <Button
            size="sm"
            variant={activo ? "outline" : "default"}
            disabled={subiendo}
            onClick={() => {
              const archivo = entrada.current?.files?.[0];
              if (!archivo) {
                toast.error("Elige primero un archivo.");
                return;
              }
              void subir(archivo, false);
            }}
          >
            {subiendo ? "Subiendo…" : activo ? "Sustituir documento" : "+ Adjuntar factura"}
          </Button>
          <span className="text-xs text-muted-foreground">
            PDF, JPG, PNG o WEBP · máximo {tamanoLegible(MAX_DOC_BYTES)}
          </span>
        </div>

        {duplicado && (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3">
            <p className="mb-2">
              Este mismo archivo ya está guardado
              {duplicado.facturas.length > 1
                ? ` en ${duplicado.facturas.length} facturas.`
                : " en otra factura."}{" "}
              Si aun así quieres asociarlo aquí, se reutiliza el archivo ya guardado y no se sube
              otra copia.
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={subiendo}
                onClick={() => void subir(duplicado.archivo, true)}
              >
                Asociarlo de todas formas
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setDuplicado(null)}>
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {lista.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Archivo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Tamaño</TableHead>
                <TableHead>Incorporado</TableHead>
                <TableHead>Quién</TableHead>
                <TableHead>Huella SHA-256</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {lista.map((d) => (
                <TableRow
                  key={d.id}
                  className={d.estado_documento === "Sustituido" ? "opacity-60" : undefined}
                >
                  <TableCell>{d.nombre_original}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[0.65rem]">
                      {d.estado_documento}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {tamanoLegible(Number(d.tamano_bytes))}
                  </TableCell>
                  <TableCell className="text-xs">{fechaLegible(d.fecha_incorporacion)}</TableCell>
                  <TableCell className="text-xs">{d.actor}</TableCell>
                  <TableCell className="font-mono text-[0.65rem]">
                    {d.hash_sha256.slice(0, 16)}…
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => void abrir(d.id)}>
                      Ver
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <p className="text-xs text-muted-foreground">
          Los archivos se guardan en almacenamiento privado y solo se abren con un enlace temporal
          de 60 segundos. Ningún documento se borra: al sustituirlo, el anterior queda marcado como
          sustituido.
        </p>
      </CardContent>
    </Card>
  );
}
