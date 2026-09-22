import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { useActor, useCuentas, useTransferencias } from "@/lib/datos";
import { crearTransferencia } from "@/lib/tesoreria.functions";
import { formatoEuros } from "@/lib/secciones";

export const Route = createFileRoute("/_gateado/transferencias")({
  head: () => ({
    meta: [
      { title: "Transferencias · Farmatrack" },
      {
        name: "description",
        content:
          "Traspasos entre cuentas propias de la farmacia: crean los dos movimientos emparejados en una sola operación.",
      },
      { property: "og:title", content: "Transferencias · Farmatrack" },
      {
        property: "og:description",
        content: "Traspasos entre cuentas propias con sus dos movimientos emparejados.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PantallaTransferencias,
});

const ESTADOS = ["Previsto", "Pendiente", "Confirmado"] as const;

function PantallaTransferencias() {
  const { data: cuentas } = useCuentas();
  const { data: transferencias, isLoading } = useTransferencias();
  const { actor } = useActor();
  const queryClient = useQueryClient();

  const [origen, setOrigen] = useState("");
  const [destino, setDestino] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [importe, setImporte] = useState("");
  const [estado, setEstado] = useState<(typeof ESTADOS)[number]>("Confirmado");
  const [entorno, setEntorno] = useState<"produccion" | "prueba">("produccion");
  const [guardando, setGuardando] = useState(false);

  const nombreCuenta = (id: string) => (cuentas ?? []).find((c) => c.id === id)?.nombre ?? "—";

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    if (!origen || !destino) {
      toast.error("Elige la cuenta de origen y la de destino");
      return;
    }
    if (origen === destino) {
      toast.error("La cuenta de origen y la de destino no pueden ser la misma");
      return;
    }
    const valor = Number(importe.replace(",", "."));
    if (!Number.isFinite(valor) || valor === 0) {
      toast.error("El importe debe ser un número distinto de cero");
      return;
    }
    setGuardando(true);
    try {
      await crearTransferencia({
        data: {
          cuenta_origen_id: origen,
          cuenta_destino_id: destino,
          fecha,
          importe: valor,
          estado,
          entorno,
          actor,
        },
      });
      await queryClient.invalidateQueries({ queryKey: ["transferencias"] });
      await queryClient.invalidateQueries({ queryKey: ["movimientos"] });
      await queryClient.invalidateQueries({ queryKey: ["saldos-internos"] });
      await queryClient.invalidateQueries({ queryKey: ["auditoria"] });
      toast.success("Traspaso registrado con sus dos movimientos");
      setImporte("");
    } catch (error) {
      toast.error("No se pudo registrar el traspaso: " + (error as Error).message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <AppShell
      titulo="Transferencias"
      descripcion="Un traspaso crea siempre dos movimientos emparejados: la salida de la cuenta de origen y la entrada en la de destino."
    >
      <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
        <Card className="h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Nuevo traspaso</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={crear} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Cuenta de origen</Label>
                <Select value={origen} onValueChange={setOrigen}>
                  <SelectTrigger>
                    <SelectValue placeholder="Elige una cuenta" />
                  </SelectTrigger>
                  <SelectContent>
                    {(cuentas ?? []).map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Cuenta de destino</Label>
                <Select value={destino} onValueChange={setDestino}>
                  <SelectTrigger>
                    <SelectValue placeholder="Elige una cuenta" />
                  </SelectTrigger>
                  <SelectContent>
                    {(cuentas ?? []).map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fecha">Fecha</Label>
                <Input
                  id="fecha"
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="importe">Importe</Label>
                <Input
                  id="importe"
                  value={importe}
                  onChange={(e) => setImporte(e.target.value)}
                  placeholder="1500,00"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Estado</Label>
                <Select
                  value={estado}
                  onValueChange={(v) => setEstado(v as (typeof ESTADOS)[number])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTADOS.map((e) => (
                      <SelectItem key={e} value={e}>
                        {e}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Entorno</Label>
                <Select
                  value={entorno}
                  onValueChange={(v) => setEntorno(v as "produccion" | "prueba")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="produccion">produccion</SelectItem>
                    <SelectItem value="prueba">prueba</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={guardando}>
                {guardando ? "Registrando…" : "Registrar traspaso"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Origen</TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead className="text-right">Importe</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Entorno</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      Cargando…
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && (transferencias ?? []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      Todavía no hay traspasos registrados.
                    </TableCell>
                  </TableRow>
                )}
                {(transferencias ?? []).map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono text-xs">{t.fecha ?? "—"}</TableCell>
                    <TableCell>{nombreCuenta(t.cuenta_origen_id)}</TableCell>
                    <TableCell>{nombreCuenta(t.cuenta_destino_id)}</TableCell>
                    <TableCell className="text-right font-mono">
                      {t.importe === null ? "—" : formatoEuros(t.importe)}
                    </TableCell>
                    <TableCell>
                      {t.estado ? <Badge variant="outline">{t.estado}</Badge> : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{t.entorno}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
