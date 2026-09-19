import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
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
import { useActor, useFacturas, useProveedores, useVencimientos } from "@/lib/datos";
import { crearVencimientoValidado } from "@/lib/datos.functions";
import {
  CLASES_VENCIMIENTO,
  ESTADOS_VENCIMIENTO_ALTA,
  ESTADO_DEFECTO_ALTA_MANUAL,
  MENSAJE_COMPROMISO_NO_DISPONIBLE,
  TIPOS_VENCIMIENTO,
  facturasElegiblesParaVencimiento,
  origenVencimiento,
  type ClaseVencimiento,
  type EstadoVencimientoAlta,
  type TipoVencimiento,
} from "@/lib/vencimientos";
import { formatoEuros } from "@/lib/secciones";

export const Route = createFileRoute("/_gateado/vencimientos")({
  head: () => ({
    meta: [
      { title: "Vencimientos · Farmatrack" },
      {
        name: "description",
        content:
          "Alta validada y listado global de los vencimientos de pago y cobro de la farmacia.",
      },
      { property: "og:title", content: "Vencimientos · Farmatrack" },
      {
        property: "og:description",
        content: "Vencimientos de pago y cobro, con su origen en factura o compromiso fijo.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PantallaVencimientos,
});

type Origen = "factura" | "compromiso";

function PantallaVencimientos() {
  const { data: vencimientos, isLoading } = useVencimientos();
  const { data: facturas } = useFacturas();
  const { data: proveedores } = useProveedores();
  const { actor } = useActor();
  const queryClient = useQueryClient();

  const [guardando, setGuardando] = useState(false);
  const [origen, setOrigen] = useState<Origen>("factura");
  const [facturaId, setFacturaId] = useState("");
  const [compromisoId, setCompromisoId] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [importe, setImporte] = useState("");
  const [estado, setEstado] = useState<EstadoVencimientoAlta>(ESTADO_DEFECTO_ALTA_MANUAL);
  const [tipo, setTipo] = useState<TipoVencimiento>("Proveedor");
  const [clase, setClase] = useState<ClaseVencimiento>("Pago");

  // F-15: el selector solo ofrece facturas sin duplicado pendiente de resolver.
  const facturasElegibles = useMemo(
    () => facturasElegiblesParaVencimiento(facturas ?? []),
    [facturas],
  );

  const nombreProveedor = (id: string) =>
    (proveedores ?? []).find((p) => p.id === id)?.nombre_visible ?? "—";

  const etiquetaFactura = (id: string) => {
    const f = (facturas ?? []).find((x) => x.id === id);
    if (!f) return id.slice(0, 8);
    return `${f.numero_factura ?? "Sin número"} · ${nombreProveedor(f.proveedor_id)}`;
  };

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    try {
      await crearVencimientoValidado({
        data: {
          factura_id: origen === "factura" ? (facturaId || null) : null,
          compromiso_fijo_id: origen === "compromiso" ? (compromisoId || null) : null,
          fecha,
          importe: Number(importe),
          estado,
          tipo,
          tipo_vencimiento: clase,
          actor,
        },
      });
      await queryClient.invalidateQueries({ queryKey: ["vencimientos"] });
      await queryClient.invalidateQueries({ queryKey: ["auditoria"] });
      toast.success("Vencimiento creado.");
      setImporte("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se ha podido crear el vencimiento.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <AppShell titulo="Vencimientos" descripcion="Pagos y cobros previstos.">
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Alta manual de vencimiento</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={crear} className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Nace de</Label>
              <Select value={origen} onValueChange={(v) => setOrigen(v as Origen)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="factura">Factura</SelectItem>
                  <SelectItem value="compromiso">Compromiso fijo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {origen === "factura" ? (
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Factura</Label>
                <Select value={facturaId} onValueChange={setFacturaId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Elige una factura" />
                  </SelectTrigger>
                  <SelectContent>
                    {facturasElegibles.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {etiquetaFactura(f.id)} · {formatoEuros(Number(f.total))}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Regla 9: las facturas en posible duplicado o duplicado confirmado no aparecen aquí
                  hasta resolverse.
                </p>
              </div>
            ) : (
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="venc-compromiso">Compromiso fijo</Label>
                <Input
                  id="venc-compromiso"
                  value={compromisoId}
                  onChange={(e) => setCompromisoId(e.target.value)}
                  placeholder="Todavía no disponible"
                  disabled
                />
                <p className="text-xs text-muted-foreground">
                  {MENSAJE_COMPROMISO_NO_DISPONIBLE}
                </p>
              </div>
            )}

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
              <Select value={estado} onValueChange={(v) => setEstado(v as EstadoVencimientoAlta)}>
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
            <div className="flex items-end gap-3 sm:col-span-3">
              <Button type="submit" disabled={guardando}>
                {guardando ? "Guardando…" : "Crear vencimiento"}
              </Button>
              <span className="text-xs text-muted-foreground">
                «Pagado» no es seleccionable: solo lo asignará el motor de conciliación.
              </span>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Listado global de vencimientos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading && <p className="p-6 text-sm text-muted-foreground">Cargando…</p>}
          {!isLoading && (vencimientos ?? []).length === 0 && (
            <p className="p-6 text-sm text-muted-foreground">
              Todavía no hay vencimientos registrados.
            </p>
          )}
          {(vencimientos ?? []).length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Importe</TableHead>
                  <TableHead>Origen</TableHead>
                  <TableHead>Procedencia</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Pago/Cobro</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Entorno</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(vencimientos ?? []).map((v) => (
                  <TableRow key={v.id}>
                    <TableCell>{v.fecha}</TableCell>
                    <TableCell className="text-right">
                      {formatoEuros(Number(v.importe))}
                    </TableCell>
                    <TableCell>{origenVencimiento(v)}</TableCell>
                    <TableCell>
                      {v.factura_id ? (
                        <Button asChild variant="link" className="h-auto p-0">
                          <Link to="/facturas/$facturaId" params={{ facturaId: v.factura_id }}>
                            {etiquetaFactura(v.factura_id)}
                          </Link>
                        </Button>
                      ) : (
                        (v.compromiso_fijo_id ?? "—")
                      )}
                    </TableCell>
                    <TableCell>{v.tipo}</TableCell>
                    <TableCell>{v.tipo_vencimiento}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{v.estado}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{v.entorno}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
