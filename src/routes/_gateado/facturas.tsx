import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
  useEstadosPagoFacturas,
  useFacturas,
  useProveedores,
  type Factura,
} from "@/lib/datos";
import {
  cambiarEstadoContableFactura,
  cambiarEstadoDocumentalFactura,
  resolverDuplicadoFactura,
} from "@/lib/datos.functions";
import {
  ESTADOS_CONTABLES_FACTURA,
  ESTADOS_DOCUMENTALES_FACTURA,
  ESTADOS_DUPLICADO_FACTURA,
  facturaBloqueadaPorDuplicado,
  type EstadoContableFactura,
  type EstadoDocumentalFactura,
  type EstadoDuplicadoFactura,
} from "@/lib/listas-factura";

export const Route = createFileRoute("/_gateado/facturas")({
  head: () => ({
    meta: [
      { title: "Facturas · Farmatrack" },
      {
        name: "description",
        content:
          "Índice de facturas recibidas con su estado documental, estado de duplicado y estado contable.",
      },
      { property: "og:title", content: "Facturas · Farmatrack" },
      {
        property: "og:description",
        content: "Listado de facturas de la farmacia con sus tres estados guardados.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PantallaFacturas,
});

const euros = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });

function PantallaFacturas() {
  const { data: facturas, isLoading } = useFacturas();
  const { data: proveedores } = useProveedores();
  const { data: estadosPago } = useEstadosPagoFacturas();
  const { actor } = useActor();
  const queryClient = useQueryClient();

  const nombreProveedor = (id: string) =>
    (proveedores ?? []).find((p) => p.id === id)?.nombre_visible ?? "—";

  // El estado de pago nunca se guarda (RB-017): se calcula en cada consulta.
  const estadoPago = (id: string) =>
    (estadosPago ?? []).find((e) => e.factura_id === id)?.estado_pago ?? null;

  async function refrescar() {
    await queryClient.invalidateQueries({ queryKey: ["facturas"] });
    await queryClient.invalidateQueries({ queryKey: ["estados-pago-facturas"] });
    await queryClient.invalidateQueries({ queryKey: ["auditoria"] });
  }

  async function ejecutar(accion: () => Promise<unknown>, exito: string) {
    try {
      await accion();
    } catch (error) {
      toast.error("No se pudo guardar: " + (error as Error).message);
      return;
    }
    await refrescar();
    toast.success(exito);
  }

  const bloqueadas = (facturas ?? []).filter((f) =>
    facturaBloqueadaPorDuplicado(f.estado_duplicado as EstadoDuplicadoFactura),
  ).length;

  return (
    <AppShell
      titulo="Facturas"
      descripcion="Índice de facturas recibidas con su estado documental, de duplicado y contable."
      acciones={
        <Button asChild size="sm">
          <Link to="/facturas/nueva">Nueva factura</Link>
        </Button>
      }
    >
      {bloqueadas > 0 && (
        <Card className="mb-6 border-destructive/40 bg-destructive/5">
          <CardContent className="py-4 text-sm">
            <strong>{bloqueadas}</strong>{" "}
            {bloqueadas === 1 ? "factura está marcada" : "facturas están marcadas"} como posible
            duplicado o duplicado confirmado. Mientras lo estén, no podrán generar vencimientos
            (Regla 9).
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Número</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Pago (familia)</TableHead>
                <TableHead>Documental</TableHead>
                <TableHead>Duplicado</TableHead>
                <TableHead>Contable</TableHead>
                <TableHead>Entorno</TableHead>
                <TableHead className="text-right">Ficha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={10} className="py-8 text-center text-muted-foreground">
                    Cargando…
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && (facturas ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="py-8 text-center text-muted-foreground">
                    Todavía no hay facturas registradas.
                  </TableCell>
                </TableRow>
              )}
              {(facturas ?? []).map((f: Factura) => {
                const marcada = facturaBloqueadaPorDuplicado(
                  f.estado_duplicado as EstadoDuplicadoFactura,
                );
                return (
                  <TableRow key={f.id} className={marcada ? "bg-destructive/5" : undefined}>
                    <TableCell className="font-mono text-xs">{f.fecha}</TableCell>
                    <TableCell className="font-mono text-xs">{f.numero_factura ?? "—"}</TableCell>
                    <TableCell>{nombreProveedor(f.proveedor_id)}</TableCell>
                    <TableCell className="text-right font-mono">
                      {euros.format(Number(f.total))}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[0.65rem]">
                        {estadoPago(f.id) ?? "—"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={f.estado_documental}
                        onValueChange={(v) =>
                          ejecutar(
                            () =>
                              cambiarEstadoDocumentalFactura({
                                data: {
                                  id: f.id,
                                  estado: v as EstadoDocumentalFactura,
                                  actor,
                                },
                              }),
                            "Estado documental actualizado",
                          )
                        }
                      >
                        <SelectTrigger className="h-8 w-[9.5rem] text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ESTADOS_DOCUMENTALES_FACTURA.map((e) => (
                            <SelectItem key={e} value={e}>
                              {e}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {marcada && (
                          <Badge variant="destructive" className="shrink-0 text-[0.65rem]">
                            Regla 9
                          </Badge>
                        )}
                        <Select
                          value={f.estado_duplicado}
                          onValueChange={(v) =>
                            ejecutar(
                              () =>
                                resolverDuplicadoFactura({
                                  data: {
                                    id: f.id,
                                    resolucion: v as
                                      | "Duplicado confirmado"
                                      | "Falso positivo"
                                      | "Posible duplicado",
                                    actor,
                                  },
                                }),
                              "Estado de duplicado resuelto",
                            )
                          }
                        >
                          <SelectTrigger className="h-8 w-[11rem] text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ESTADOS_DUPLICADO_FACTURA.map((e) => (
                              <SelectItem key={e} value={e} disabled={e === "No detectado"}>
                                {e}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={f.estado_contable}
                        onValueChange={(v) =>
                          ejecutar(
                            () =>
                              cambiarEstadoContableFactura({
                                data: { id: f.id, estado: v as EstadoContableFactura, actor },
                              }),
                            "Estado contable actualizado",
                          )
                        }
                      >
                        <SelectTrigger className="h-8 w-[8.5rem] text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ESTADOS_CONTABLES_FACTURA.map((e) => (
                            <SelectItem key={e} value={e}>
                              {e}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{f.entorno}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="outline">
                        <Link to="/facturas/$facturaId" params={{ facturaId: f.id }}>
                          Abrir ficha
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppShell>
  );
}
