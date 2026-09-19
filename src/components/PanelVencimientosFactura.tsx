import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useVencimientosFactura } from "@/lib/datos";
import { crearVencimientoFactura } from "@/lib/datos.functions";
import {
  CLASES_VENCIMIENTO,
  ESTADOS_VENCIMIENTO_ALTA,
  ESTADO_DEFECTO_ALTA_MANUAL,
  MENSAJE_REGLA_9,
  TIPOS_VENCIMIENTO,
  duplicadoBloqueaVencimiento,
  type ClaseVencimiento,
  type EstadoVencimientoAlta,
  type TipoVencimiento,
} from "@/lib/vencimientos";
import { formatoEuros } from "@/lib/secciones";

type Props = {
  facturaId: string;
  actor: string;
  estadoDuplicado: string;
  totalFactura: number;
  fechaEmision: string;
  fechaVencimientoCabecera: string | null;
};

export function PanelVencimientosFactura({
  facturaId,
  actor,
  estadoDuplicado,
  totalFactura,
  fechaEmision,
  fechaVencimientoCabecera,
}: Props) {
  const { data: vencimientos, isLoading } = useVencimientosFactura(facturaId);
  const queryClient = useQueryClient();

  const bloqueada = duplicadoBloqueaVencimiento(estadoDuplicado);

  const [abierto, setAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [fecha, setFecha] = useState("");
  const [importe, setImporte] = useState("");
  const [estado, setEstado] = useState<EstadoVencimientoAlta>(ESTADO_DEFECTO_ALTA_MANUAL);
  const [tipo, setTipo] = useState<TipoVencimiento>("Proveedor");
  const [clase, setClase] = useState<ClaseVencimiento>("Pago");

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    try {
      await crearVencimientoFactura({
        data: {
          facturaId,
          fecha,
          importe: Number(importe),
          estado,
          tipo,
          tipo_vencimiento: clase,
          actor,
        },
      });
      await queryClient.invalidateQueries({ queryKey: ["vencimientos-factura", facturaId] });
      await queryClient.invalidateQueries({ queryKey: ["vencimientos"] });
      await queryClient.invalidateQueries({ queryKey: ["auditoria"] });
      toast.success("Vencimiento creado.");
      setFecha("");
      setImporte("");
      setAbierto(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se ha podido crear el vencimiento.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3">
        <CardTitle className="text-base">Vencimientos de la factura</CardTitle>
        {!abierto && (
          <Button
            size="sm"
            disabled={bloqueada}
            onClick={() => setAbierto(true)}
            title={bloqueada ? MENSAJE_REGLA_9 : undefined}
          >
            Crear vencimiento
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {bloqueada && (
          <p className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
            {MENSAJE_REGLA_9}
          </p>
        )}

        <p className="text-xs text-muted-foreground">
          Referencia de la factura: total {formatoEuros(totalFactura)} · emitida el {fechaEmision}
          {fechaVencimientoCabecera ? ` · fecha de vencimiento de cabecera ${fechaVencimientoCabecera}` : ""}.
          La fecha y el importe del vencimiento se indican a mano.
        </p>

        {abierto && !bloqueada && (
          <form onSubmit={crear} className="grid gap-4 sm:grid-cols-5">
            <div className="space-y-1.5">
              <Label htmlFor="venc-fecha">Fecha</Label>
              <Input
                id="venc-fecha"
                type="date"
                required
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="venc-importe">Importe (€)</Label>
              <Input
                id="venc-importe"
                type="number"
                step="0.01"
                min="0.01"
                required
                value={importe}
                onChange={(e) => setImporte(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as TipoVencimiento)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_VENCIMIENTO.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Pago o cobro</Label>
              <Select value={clase} onValueChange={(v) => setClase(v as ClaseVencimiento)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CLASES_VENCIMIENTO.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Estado</Label>
              <Select
                value={estado}
                onValueChange={(v) => setEstado(v as EstadoVencimientoAlta)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ESTADOS_VENCIMIENTO_ALTA.map((e) => (
                    <SelectItem key={e} value={e}>
                      {e}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2 sm:col-span-5">
              <Button type="submit" disabled={guardando}>
                {guardando ? "Guardando…" : "Guardar vencimiento"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setAbierto(false)}>
                Cancelar
              </Button>
              <span className="text-xs text-muted-foreground">
                «Pagado» no es seleccionable: solo lo asignará la conciliación.
              </span>
            </div>
          </form>
        )}

        {isLoading && <p className="text-sm text-muted-foreground">Cargando…</p>}

        {!isLoading && (vencimientos ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">
            Esta factura todavía no tiene vencimientos registrados.
          </p>
        )}

        {(vencimientos ?? []).length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Importe</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Pago/Cobro</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(vencimientos ?? []).map((v) => (
                <TableRow key={v.id}>
                  <TableCell>{v.fecha}</TableCell>
                  <TableCell className="text-right">{formatoEuros(Number(v.importe))}</TableCell>
                  <TableCell>{v.tipo}</TableCell>
                  <TableCell>{v.tipo_vencimiento}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{v.estado}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
