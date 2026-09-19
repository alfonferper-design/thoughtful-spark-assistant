import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import {
  useDetallesVencimientosFactura,
  useMovimientosDisponibles,
  usePosicionPagoFactura,
} from "@/lib/datos";
import { registrarConciliacion } from "@/lib/datos.functions";
import { TIPOS_CONCILIACION, type TipoConciliacion } from "@/lib/conciliacion";
import { TOLERANCIA_REDONDEO_EUR, redondearEuros } from "@/lib/dinero";
import { formatoEuros } from "@/lib/secciones";

type Props = { facturaId: string; actor: string };

function magnitud(n: number | null | undefined) {
  return n === null || n === undefined ? "—" : formatoEuros(Number(n));
}

export function PanelPagosFactura({ facturaId, actor }: Props) {
  const { data, isLoading } = usePosicionPagoFactura(facturaId);
  const { data: detalles } = useDetallesVencimientosFactura(facturaId);
  const { data: movimientos } = useMovimientosDisponibles();
  const queryClient = useQueryClient();

  const [abierto, setAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [movimientoId, setMovimientoId] = useState("");
  const [vencimientoId, setVencimientoId] = useState("");
  const [importe, setImporte] = useState("");
  const [tipo, setTipo] = useState<TipoConciliacion>("Exacta");
  const [nivelConfianza, setNivelConfianza] = useState("");
  const [confirmadoPor, setConfirmadoPor] = useState(actor);
  const [autorizarExceso, setAutorizarExceso] = useState(false);
  const [motivoExceso, setMotivoExceso] = useState("");

  const posicion = data?.posicion ?? null;
  const estadoPago = data?.estadoPago ?? null;

  const movimientoElegido = (movimientos ?? []).find((m) => m.id === movimientoId);
  const vencimientoElegido = (detalles ?? []).find((d) => d.id === vencimientoId);

  // Aviso previo en pantalla con la misma aritmética del servidor (5.4).
  const aviso = useMemo(() => {
    const valor = Number(importe.trim().replace(",", "."));
    if (!Number.isFinite(valor) || valor <= 0 || !movimientoElegido || !vencimientoElegido) {
      return { excedeVencimiento: false, excedeMovimiento: false, sobreV: 0, sobreM: 0 };
    }
    const excedeVencimiento =
      valor > vencimientoElegido.importePendiente + TOLERANCIA_REDONDEO_EUR;
    const excedeMovimiento = valor > movimientoElegido.disponible + TOLERANCIA_REDONDEO_EUR;
    return {
      excedeVencimiento,
      excedeMovimiento,
      sobreV: excedeVencimiento
        ? redondearEuros(valor - vencimientoElegido.importePendiente)
        : 0,
      sobreM: excedeMovimiento ? redondearEuros(valor - movimientoElegido.disponible) : 0,
    };
  }, [importe, movimientoElegido, vencimientoElegido]);

  const hayExceso = aviso.excedeVencimiento || aviso.excedeMovimiento;

  async function conciliar(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    try {
      const resultado = await registrarConciliacion({
        data: {
          vencimientoId,
          movimientoId,
          importeAplicado: Number(importe.trim().replace(",", ".")),
          tipo,
          nivelConfianza:
            nivelConfianza.trim() === "" ? null : Number(nivelConfianza.trim().replace(",", ".")),
          confirmadoPor: confirmadoPor.trim() === "" ? null : confirmadoPor.trim(),
          autorizarExceso,
          motivoExceso: motivoExceso.trim() === "" ? null : motivoExceso.trim(),
          actor,
        },
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["posicion-pago", facturaId] }),
        queryClient.invalidateQueries({ queryKey: ["detalles-vencimientos", facturaId] }),
        queryClient.invalidateQueries({ queryKey: ["vencimientos-factura", facturaId] }),
        queryClient.invalidateQueries({ queryKey: ["vencimientos"] }),
        queryClient.invalidateQueries({ queryKey: ["movimientos"] }),
        queryClient.invalidateQueries({ queryKey: ["movimientos-disponibles"] }),
        queryClient.invalidateQueries({ queryKey: ["conciliaciones"] }),
        queryClient.invalidateQueries({ queryKey: ["estados-pago-facturas"] }),
        queryClient.invalidateQueries({ queryKey: ["saldos-internos"] }),
        queryClient.invalidateQueries({ queryKey: ["auditoria"] }),
      ]);
      const extras = [
        resultado.vencimiento_marcado_pagado ? "vencimiento marcado como pagado" : null,
        resultado.movimiento_conciliado ? "movimiento totalmente aplicado" : null,
        resultado.hubo_exceso ? "sobre-conciliación autorizada" : null,
      ].filter(Boolean);
      toast.success(
        `Conciliación registrada${extras.length ? ` (${extras.join(", ")})` : ""}.`,
      );
      setImporte("");
      setMotivoExceso("");
      setAutorizarExceso(false);
      setAbierto(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se ha podido conciliar.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3">
        <CardTitle className="text-base">Pagos de la factura</CardTitle>
        <div className="flex items-center gap-3">
          {estadoPago && <Badge variant="outline">{estadoPago}</Badge>}
          {!abierto && (
            <Button size="sm" onClick={() => setAbierto(true)}>
              Conciliar un pago
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {isLoading && <p className="text-sm text-muted-foreground">Cargando…</p>}

        {!isLoading && !posicion && (
          <p className="text-sm text-muted-foreground">
            No se puede calcular la posición de pago de esta factura (no se ha encontrado la
            factura original de su cadena documental).
          </p>
        )}

        {posicion && (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["Total documental", magnitud(posicion.totalDocumental)],
                ["Ajustes documentales", magnitud(posicion.ajusteTotal)],
                ["Obligación abierta", magnitud(posicion.obligacionAbierta)],
                ["Pagado", magnitud(posicion.pagado)],
                ["Deuda pendiente", magnitud(posicion.deudaPendiente)],
                ["Saldo a favor", magnitud(posicion.saldoAFavor)],
              ].map(([etiqueta, valor]) => (
                <div key={etiqueta} className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">{etiqueta}</p>
                  <p className="font-mono text-lg">{valor}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-x-6 gap-y-1 text-xs text-muted-foreground sm:grid-cols-2">
              <p>Posición documental neta (total + ajustes): {magnitud(posicion.posicionDocumentalNeta)}</p>
              <p>Ajuste todavía sin vencimientos propios: {magnitud(posicion.ajusteNoFormalizado)}</p>
              <p>Diferencia entre obligación y documento: {magnitud(posicion.diferenciaObligacionVsDocumento)}</p>
              <p>
                Vencimientos en la familia: {posicion.numVencimientos} · documentos de ajuste:{" "}
                {posicion.numAjustes}
              </p>
            </div>

            {posicion.sinVencimientos && (
              <p className="rounded-md border bg-muted/40 p-3 text-sm">
                Esta factura no tiene ningún vencimiento registrado: la deuda pendiente y el saldo
                a favor quedan sin calcular, nunca se dan por pagados.
              </p>
            )}

            {(posicion.excesoAjusteNoRespaldado ?? 0) > TOLERANCIA_REDONDEO_EUR && (
              <p className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
                Incoherencia de datos: hay {magnitud(posicion.excesoAjusteNoRespaldado)} de ajuste a
                la baja que ningún pago real respalda. Se muestra tal cual, no se absorbe.
              </p>
            )}
          </>
        )}

        {abierto && (
          <form onSubmit={conciliar} className="grid gap-4 rounded-md border p-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Movimiento disponible</Label>
              <Select value={movimientoId} onValueChange={setMovimientoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Elige un movimiento" />
                </SelectTrigger>
                <SelectContent>
                  {(movimientos ?? []).map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.fecha} · {m.tipo} · disponible {formatoEuros(m.disponible)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(movimientos ?? []).length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No hay movimientos con importe disponible.
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Vencimiento de la factura</Label>
              <Select value={vencimientoId} onValueChange={setVencimientoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Elige un vencimiento" />
                </SelectTrigger>
                <SelectContent>
                  {(detalles ?? []).map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.fecha} · pendiente {formatoEuros(d.importePendiente)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(detalles ?? []).length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Esta factura todavía no tiene vencimientos que conciliar.
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="conc-importe">Importe a aplicar (€)</Label>
              <Input
                id="conc-importe"
                type="number"
                step="0.01"
                min="0.01"
                required
                value={importe}
                onChange={(e) => setImporte(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Tipo de conciliación</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as TipoConciliacion)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_CONCILIACION.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="conc-confianza">Nivel de confianza (0–100, opcional)</Label>
              <Input
                id="conc-confianza"
                type="number"
                min="0"
                max="100"
                value={nivelConfianza}
                onChange={(e) => setNivelConfianza(e.target.value)}
              />
            </div>

            {tipo !== "Exacta" && (
              <div className="space-y-1.5">
                <Label htmlFor="conc-confirmado">Confirmado por</Label>
                <Input
                  id="conc-confirmado"
                  required
                  value={confirmadoPor}
                  onChange={(e) => setConfirmadoPor(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Regla 7: una conciliación Parcial o Agrupada exige confirmación explícita.
                </p>
              </div>
            )}

            {hayExceso && (
              <div className="space-y-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 sm:col-span-2">
                <p className="text-sm">
                  El importe indicado{" "}
                  {aviso.excedeVencimiento &&
                    `excede el pendiente del vencimiento en ${formatoEuros(aviso.sobreV)}`}
                  {aviso.excedeVencimiento && aviso.excedeMovimiento && " y "}
                  {aviso.excedeMovimiento &&
                    `excede el importe disponible del movimiento en ${formatoEuros(aviso.sobreM)}`}
                  .
                </p>
                <div className="flex items-center gap-2">
                  <Switch
                    id="conc-autorizar"
                    checked={autorizarExceso}
                    onCheckedChange={setAutorizarExceso}
                  />
                  <Label htmlFor="conc-autorizar">Autorizar la sobre-conciliación</Label>
                </div>
                {autorizarExceso && (
                  <div className="space-y-1.5">
                    <Label htmlFor="conc-motivo">Motivo del exceso</Label>
                    <Input
                      id="conc-motivo"
                      required
                      value={motivoExceso}
                      onChange={(e) => setMotivoExceso(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Sin motivo explícito no se registra.
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-2 sm:col-span-2">
              <Button type="submit" disabled={guardando || !movimientoId || !vencimientoId}>
                {guardando ? "Registrando…" : "Registrar conciliación"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setAbierto(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        )}

        {(detalles ?? []).length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium">Detalle por vencimiento</p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Importe</TableHead>
                  <TableHead className="text-right">Conciliado</TableHead>
                  <TableHead className="text-right">Pendiente</TableHead>
                  <TableHead>Estado guardado</TableHead>
                  <TableHead>Estado calculado</TableHead>
                  <TableHead>Coherencia</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(detalles ?? []).map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>{d.fecha}</TableCell>
                    <TableCell className="text-right font-mono">
                      {formatoEuros(d.importeOriginal)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatoEuros(d.importeConciliado)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatoEuros(d.importePendiente)}
                    </TableCell>
                    <TableCell>{d.estadoAlmacenado}</TableCell>
                    <TableCell>{d.estadoCalculado}</TableCell>
                    <TableCell>
                      {d.coherente ? (
                        <Badge variant="outline">Coherente</Badge>
                      ) : (
                        <Badge variant="destructive">Desincronizado</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="mt-2 text-xs text-muted-foreground">
              La coherencia solo informa: un estado desincronizado nunca se corrige de forma
              automática.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
