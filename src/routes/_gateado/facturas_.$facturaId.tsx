import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { PanelDocumentoFactura } from "@/components/PanelDocumentoFactura";
import { PanelVencimientosFactura } from "@/components/PanelVencimientosFactura";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  useActor,
  useFactura,
  useLineasFactura,
  useProveedores,
  type FacturaLinea,
} from "@/lib/datos";
import {
  actualizarLineaFactura,
  crearLineaFactura,
  eliminarLogicamenteLineaFactura,
  recalcularImportesLineaFactura,
  reordenarLineasFactura,
} from "@/lib/datos.functions";
import {
  calcularLineaFactura,
  compararTotalesLineasCabecera,
  TIPOS_DESCUENTO_LINEA,
  type TipoDescuentoLinea,
} from "@/lib/lineas-factura";
import { TOLERANCIA_REDONDEO_EUR } from "@/lib/dinero";

export const Route = createFileRoute("/_gateado/facturas_/$facturaId")({
  head: () => ({
    meta: [
      { title: "Ficha de factura · Farmatrack" },
      {
        name: "description",
        content:
          "Desglose por líneas de una factura, con su base, cuota e importe total y la coherencia frente a la cabecera.",
      },
      { property: "og:title", content: "Ficha de factura · Farmatrack" },
      {
        property: "og:description",
        content: "Panel de líneas de una factura de la farmacia.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PantallaFicha,
});

const euros = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });

function importe(n: number | null | undefined) {
  return n === null || n === undefined ? "—" : euros.format(Number(n));
}

type FormularioLinea = {
  descripcion: string;
  codigo_producto: string;
  referencia_proveedor: string;
  cantidad: string;
  precio_unitario: string;
  descuento_tipo: "" | TipoDescuentoLinea;
  descuento_valor: string;
  tipo_impuesto: string;
  tipo_impositivo: string;
  base_imponible: string;
  cuota_impuesto: string;
  total: string;
  observaciones: string;
};

const formularioVacio: FormularioLinea = {
  descripcion: "",
  codigo_producto: "",
  referencia_proveedor: "",
  cantidad: "",
  precio_unitario: "",
  descuento_tipo: "",
  descuento_valor: "",
  tipo_impuesto: "",
  tipo_impositivo: "",
  base_imponible: "",
  cuota_impuesto: "",
  total: "",
  observaciones: "",
};

function texto(v: string) {
  const t = v.trim();
  return t === "" ? null : t;
}

function numero(v: string) {
  const t = v.trim().replace(",", ".");
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function PantallaFicha() {
  const { facturaId } = Route.useParams();
  const { data: factura, isLoading } = useFactura(facturaId);
  const [verEliminadas, setVerEliminadas] = useState(false);
  const { data: lineas } = useLineasFactura(facturaId, verEliminadas);
  const { data: proveedores } = useProveedores();
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormularioLinea>(formularioVacio);
  const [guardando, setGuardando] = useState(false);

  const activas = useMemo(
    () => (lineas ?? []).filter((l: FacturaLinea) => l.estado_linea === "Activa"),
    [lineas],
  );

  const comparacion = useMemo(() => {
    if (!factura) return null;
    return compararTotalesLineasCabecera(
      { total: Number(factura.total), desglose_fiscal: factura.desglose_fiscal },
      activas.map((l) => ({
        base_imponible: l.base_imponible === null ? null : Number(l.base_imponible),
        cuota_impuesto: l.cuota_impuesto === null ? null : Number(l.cuota_impuesto),
        total: l.total === null ? null : Number(l.total),
      })),
    );
  }, [factura, activas]);

  const previsualizacion = useMemo(
    () =>
      calcularLineaFactura({
        cantidad: numero(form.cantidad),
        precio_unitario: numero(form.precio_unitario),
        descuento_tipo: form.descuento_tipo === "" ? null : form.descuento_tipo,
        descuento_valor: numero(form.descuento_valor),
        tipo_impositivo: numero(form.tipo_impositivo),
        base_imponible: numero(form.base_imponible),
        cuota_impuesto: numero(form.cuota_impuesto),
        total: numero(form.total),
      }),
    [form],
  );

  const traeImportes =
    numero(form.base_imponible) !== null ||
    numero(form.cuota_impuesto) !== null ||
    numero(form.total) !== null;

  async function refrescar() {
    await queryClient.invalidateQueries({ queryKey: ["factura-lineas", facturaId] });
    await queryClient.invalidateQueries({ queryKey: ["auditoria"] });
  }

  async function ejecutar(accion: () => Promise<unknown>, exito: string) {
    try {
      await accion();
    } catch (error) {
      toast.error("No se pudo guardar: " + (error as Error).message);
      return false;
    }
    await refrescar();
    toast.success(exito);
    return true;
  }

  async function anadirLinea(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    const ok = await ejecutar(
      () =>
        crearLineaFactura({
          data: {
            facturaId,
            actor,
            descripcion: texto(form.descripcion),
            codigo_producto: texto(form.codigo_producto),
            referencia_proveedor: texto(form.referencia_proveedor),
            cantidad: numero(form.cantidad),
            precio_unitario: numero(form.precio_unitario),
            descuento_tipo: form.descuento_tipo === "" ? null : form.descuento_tipo,
            descuento_valor: numero(form.descuento_valor),
            tipo_impuesto: texto(form.tipo_impuesto),
            nombre_impuesto: texto(form.tipo_impuesto),
            tipo_impositivo: numero(form.tipo_impositivo),
            base_imponible: numero(form.base_imponible),
            cuota_impuesto: numero(form.cuota_impuesto),
            total: numero(form.total),
            observaciones: texto(form.observaciones),
          },
        }),
      "Línea añadida",
    );
    setGuardando(false);
    if (ok) setForm(formularioVacio);
  }

  async function mover(linea: FacturaLinea, direccion: -1 | 1) {
    const ids = activas.map((l) => l.id);
    const i = ids.indexOf(linea.id);
    const j = i + direccion;
    if (i < 0 || j < 0 || j >= ids.length) return;
    const nuevo = [...ids];
    const a = nuevo[i]!;
    nuevo[i] = nuevo[j]!;
    nuevo[j] = a;
    await ejecutar(
      () => reordenarLineasFactura({ data: { facturaId, ordenIds: nuevo, actor } }),
      "Líneas reordenadas",
    );
  }

  const nombreProveedor = factura
    ? ((proveedores ?? []).find((p) => p.id === factura.proveedor_id)?.nombre_visible ?? "—")
    : "—";

  return (
    <AppShell
      titulo="Ficha de factura"
      descripcion="Desglose por líneas y documento adjunto de la factura. El resto de paneles llegará en etapas posteriores."
      acciones={
        <Button asChild size="sm" variant="outline">
          <Link to="/facturas">Volver al listado</Link>
        </Button>
      }
    >
      {isLoading && <p className="text-sm text-muted-foreground">Cargando…</p>}

      {factura && (
        <>
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {factura.numero_factura ?? "Sin número"} · {nombreProveedor}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 text-sm sm:grid-cols-4">
              <Dato etiqueta="Fecha" valor={factura.fecha} />
              <Dato etiqueta="Total de cabecera" valor={importe(Number(factura.total))} />
              <Dato etiqueta="Estado documental" valor={factura.estado_documental} />
              <Dato etiqueta="Entorno" valor={factura.entorno} />
            </CardContent>
          </Card>

          <PanelDocumentoFactura facturaId={facturaId} actor={actor} />

          <PanelVencimientosFactura
            facturaId={facturaId}
            actor={actor}
            estadoDuplicado={factura.estado_duplicado}
            totalFactura={Number(factura.total)}
            fechaEmision={factura.fecha_emision}
            fechaVencimientoCabecera={factura.fecha_vencimiento}
          />

          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3">
              <CardTitle className="text-base">Líneas de la factura</CardTitle>
              <div className="flex items-center gap-2">
                <Label htmlFor="ver-eliminadas" className="text-xs text-muted-foreground">
                  Ver eliminadas
                </Label>
                <Switch
                  id="ver-eliminadas"
                  checked={verEliminadas}
                  onCheckedChange={setVerEliminadas}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {activas.length === 0 && !verEliminadas ? (
                <p className="px-6 py-8 text-sm text-muted-foreground">
                  Esta factura no tiene desglose por líneas. Es un estado válido: no se inventan
                  líneas a partir del total (RB-019).
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Orden</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead className="text-right">Cantidad</TableHead>
                      <TableHead className="text-right">Precio</TableHead>
                      <TableHead>Descuento</TableHead>
                      <TableHead>Impuesto</TableHead>
                      <TableHead className="text-right">Base</TableHead>
                      <TableHead className="text-right">Cuota</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Importes</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(lineas ?? []).map((l: FacturaLinea) => {
                      const eliminada = l.estado_linea === "Eliminada";
                      return (
                        <TableRow key={l.id} className={eliminada ? "opacity-50" : undefined}>
                          <TableCell className="font-mono text-xs">{l.orden}</TableCell>
                          <TableCell>
                            <span className="block">{l.descripcion ?? "—"}</span>
                            {l.codigo_producto && (
                              <span className="font-mono text-[0.7rem] text-muted-foreground">
                                {l.codigo_producto}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs">
                            {l.cantidad ?? "—"}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs">
                            {importe(l.precio_unitario)}
                          </TableCell>
                          <TableCell className="text-xs">
                            {l.descuento_tipo
                              ? `${l.descuento_tipo} ${l.descuento_valor ?? 0}`
                              : "—"}
                          </TableCell>
                          <TableCell className="text-xs">
                            {l.nombre_impuesto ?? l.tipo_impuesto ?? "—"}
                            {l.tipo_impositivo != null && ` ${l.tipo_impositivo}%`}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {importe(l.base_imponible)}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {importe(l.cuota_impuesto)}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {importe(l.total)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[0.65rem]">
                              {eliminada ? "Eliminada" : l.origen_importes}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {!eliminada && (
                              <div className="flex justify-end gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => mover(l, -1)}
                                  aria-label="Subir línea"
                                >
                                  ↑
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => mover(l, 1)}
                                  aria-label="Bajar línea"
                                >
                                  ↓
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    ejecutar(
                                      () =>
                                        recalcularImportesLineaFactura({
                                          data: { id: l.id, actor },
                                        }),
                                      "Importes recalculados con la fórmula",
                                    )
                                  }
                                >
                                  Recalcular
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    ejecutar(
                                      () =>
                                        eliminarLogicamenteLineaFactura({
                                          data: { id: l.id, actor },
                                        }),
                                      "Línea marcada como eliminada",
                                    )
                                  }
                                >
                                  Eliminar
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Coherencia líneas ↔ cabecera</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {!comparacion || comparacion.tieneLineas === false ? (
                <p className="text-muted-foreground">
                  Esta factura no tiene desglose por líneas, así que no hay nada que comparar.
                </p>
              ) : (
                <>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Dato
                      etiqueta="Suma de líneas (total)"
                      valor={importe(comparacion.totalLineas)}
                    />
                    <Dato
                      etiqueta="Total de cabecera"
                      valor={importe(comparacion.totalCabecera)}
                    />
                    <Dato
                      etiqueta="Diferencia"
                      valor={importe(comparacion.diferenciaTotal)}
                    />
                  </div>
                  <p className={comparacion.coherenteTotal ? "text-muted-foreground" : "text-destructive"}>
                    {comparacion.coherenteTotal
                      ? `El total de las líneas cuadra con el de la cabecera (margen de ${TOLERANCIA_REDONDEO_EUR} €).`
                      : `El total de las líneas no cuadra con el de la cabecera. Solo se muestra la diferencia: nada se corrige automáticamente.`}
                  </p>
                  {comparacion.cabeceraConFiscalidad ? (
                    <div className="grid gap-4 sm:grid-cols-3">
                      <Dato etiqueta="Base de líneas" valor={importe(comparacion.baseLineas)} />
                      <Dato etiqueta="Base de cabecera" valor={importe(comparacion.baseCabecera)} />
                      <Dato
                        etiqueta="Diferencia de base"
                        valor={importe(comparacion.diferenciaBase)}
                      />
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      La cabecera no tiene desglose fiscal registrado, así que la base no se
                      compara. No es una incoherencia: es un dato que la cabecera no fijó.
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Añadir línea</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={anadirLinea} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <Campo etiqueta="Descripción">
                    <Input
                      value={form.descripcion}
                      onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                    />
                  </Campo>
                  <Campo etiqueta="Código de producto">
                    <Input
                      value={form.codigo_producto}
                      onChange={(e) => setForm({ ...form, codigo_producto: e.target.value })}
                    />
                  </Campo>
                  <Campo etiqueta="Referencia del proveedor">
                    <Input
                      value={form.referencia_proveedor}
                      onChange={(e) => setForm({ ...form, referencia_proveedor: e.target.value })}
                    />
                  </Campo>
                  <Campo etiqueta="Cantidad">
                    <Input
                      value={form.cantidad}
                      onChange={(e) => setForm({ ...form, cantidad: e.target.value })}
                      inputMode="decimal"
                    />
                  </Campo>
                  <Campo etiqueta="Precio unitario">
                    <Input
                      value={form.precio_unitario}
                      onChange={(e) => setForm({ ...form, precio_unitario: e.target.value })}
                      inputMode="decimal"
                    />
                  </Campo>
                  <Campo etiqueta="Tipo de descuento">
                    <Select
                      value={form.descuento_tipo === "" ? "ninguno" : form.descuento_tipo}
                      onValueChange={(v) =>
                        setForm({
                          ...form,
                          descuento_tipo: v === "ninguno" ? "" : (v as TipoDescuentoLinea),
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ninguno">Sin descuento</SelectItem>
                        {TIPOS_DESCUENTO_LINEA.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Campo>
                  <Campo etiqueta="Valor del descuento">
                    <Input
                      value={form.descuento_valor}
                      onChange={(e) => setForm({ ...form, descuento_valor: e.target.value })}
                      inputMode="decimal"
                    />
                  </Campo>
                  <Campo etiqueta="Impuesto (texto libre)">
                    <Input
                      value={form.tipo_impuesto}
                      onChange={(e) => setForm({ ...form, tipo_impuesto: e.target.value })}
                      placeholder="IGIC, IVA…"
                    />
                  </Campo>
                  <Campo etiqueta="Tipo impositivo (%)">
                    <Input
                      value={form.tipo_impositivo}
                      onChange={(e) => setForm({ ...form, tipo_impositivo: e.target.value })}
                      inputMode="decimal"
                    />
                  </Campo>
                  <Campo etiqueta="Base del documento">
                    <Input
                      value={form.base_imponible}
                      onChange={(e) => setForm({ ...form, base_imponible: e.target.value })}
                      inputMode="decimal"
                    />
                  </Campo>
                  <Campo etiqueta="Cuota del documento">
                    <Input
                      value={form.cuota_impuesto}
                      onChange={(e) => setForm({ ...form, cuota_impuesto: e.target.value })}
                      inputMode="decimal"
                    />
                  </Campo>
                  <Campo etiqueta="Total del documento">
                    <Input
                      value={form.total}
                      onChange={(e) => setForm({ ...form, total: e.target.value })}
                      inputMode="decimal"
                    />
                  </Campo>
                </div>

                <p className="text-xs text-muted-foreground">
                  Cálculo previsto: base {importe(previsualizacion.base_imponible)} · cuota{" "}
                  {importe(previsualizacion.cuota_impuesto)} · total{" "}
                  {importe(previsualizacion.total)} ·{" "}
                  {traeImportes
                    ? "los importes escritos a mano se respetan tal cual (origen: documento)."
                    : "los importes se calculan con la fórmula (origen: fórmula)."}
                </p>

                <Campo etiqueta="Observaciones">
                  <Input
                    value={form.observaciones}
                    onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
                  />
                </Campo>

                <Button type="submit" disabled={guardando}>
                  {guardando ? "Guardando…" : "Añadir línea"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </>
      )}
    </AppShell>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{etiqueta}</p>
      <p className="font-mono">{valor}</p>
    </div>
  );
}

function Campo({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{etiqueta}</Label>
      {children}
    </div>
  );
}
