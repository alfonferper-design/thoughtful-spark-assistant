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
import { useActor, useCuentas, useDiferenciasCuentas, useSnapshots } from "@/lib/datos";
import { crearSnapshot } from "@/lib/tesoreria.functions";
import { formatoEuros } from "@/lib/secciones";

export const Route = createFileRoute("/_gateado/snapshots")({
  head: () => ({
    meta: [
      { title: "Saldo bancario · Farmatrack" },
      {
        name: "description",
        content:
          "Saldos reales comunicados por el banco y diferencia con el saldo interno calculado de cada cuenta.",
      },
      { property: "og:title", content: "Saldo bancario · Farmatrack" },
      {
        property: "og:description",
        content: "Saldos comunicados por el banco y diferencias por cuenta.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PantallaSnapshots,
});

function colorEstado(estado: string) {
  if (estado === "Requiere revisión") return "destructive" as const;
  if (estado === "Cuadrada") return "secondary" as const;
  return "outline" as const;
}

function PantallaSnapshots() {
  const { data: cuentas } = useCuentas();
  const { data: snapshots, isLoading } = useSnapshots();
  const { data: diferencias } = useDiferenciasCuentas();
  const { actor } = useActor();
  const queryClient = useQueryClient();

  const [cuentaId, setCuentaId] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [saldo, setSaldo] = useState("");
  const [guardando, setGuardando] = useState(false);

  const nombreCuenta = (id: string) => (cuentas ?? []).find((c) => c.id === id)?.nombre ?? "—";

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    if (!cuentaId) {
      toast.error("Elige la cuenta");
      return;
    }
    const valor = Number(saldo.replace(",", "."));
    if (!Number.isFinite(valor)) {
      toast.error("El saldo comunicado debe ser un número");
      return;
    }
    setGuardando(true);
    try {
      await crearSnapshot({
        data: { cuenta_id: cuentaId, fecha, saldo_comunicado_banco: valor, actor },
      });
      await queryClient.invalidateQueries({ queryKey: ["snapshots"] });
      await queryClient.invalidateQueries({ queryKey: ["diferencias-cuentas"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      await queryClient.invalidateQueries({ queryKey: ["auditoria"] });
      toast.success("Saldo bancario registrado");
      setSaldo("");
    } catch (error) {
      toast.error("No se pudo registrar el saldo: " + (error as Error).message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <AppShell
      titulo="Saldo bancario"
      descripcion="La gravedad de un descuadre se mide por la racha de saldos consecutivos descuadrados, no por el tiempo que llevas sin anotar."
    >
      <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
        <Card className="h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Nuevo saldo comunicado</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={crear} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Cuenta</Label>
                <Select value={cuentaId} onValueChange={setCuentaId}>
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
                <Label htmlFor="saldo">Saldo comunicado por el banco</Label>
                <Input
                  id="saldo"
                  value={saldo}
                  onChange={(e) => setSaldo(e.target.value)}
                  placeholder="12500,00"
                />
              </div>
              <Button type="submit" className="w-full" disabled={guardando}>
                {guardando ? "Guardando…" : "Registrar saldo"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Diferencias por cuenta</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cuenta</TableHead>
                    <TableHead>Último saldo</TableHead>
                    <TableHead className="text-right">Diferencia</TableHead>
                    <TableHead>Situación</TableHead>
                    <TableHead className="text-right">Días descuadrada</TableHead>
                    <TableHead className="text-right">Días sin anotar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(diferencias ?? []).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                        Sin cuentas.
                      </TableCell>
                    </TableRow>
                  )}
                  {(diferencias ?? []).map((d) => (
                    <TableRow key={d.cuenta.id}>
                      <TableCell>{d.cuenta.nombre}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {d.ultimo ? d.ultimo.fecha : "—"}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {d.diferencia === null ? "—" : formatoEuros(d.diferencia)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={colorEstado(d.estado)}>{d.estado}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        {d.diasConfirmados ?? "—"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-muted-foreground">
                        {d.diasSinConfirmar ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Histórico</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Cuenta</TableHead>
                    <TableHead className="text-right">Saldo comunicado</TableHead>
                    <TableHead>Origen</TableHead>
                    <TableHead>Entorno</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                        Cargando…
                      </TableCell>
                    </TableRow>
                  )}
                  {!isLoading && (snapshots ?? []).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                        Todavía no has anotado ningún saldo del banco.
                      </TableCell>
                    </TableRow>
                  )}
                  {(snapshots ?? []).map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-xs">{s.fecha}</TableCell>
                      <TableCell>{nombreCuenta(s.cuenta_id)}</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatoEuros(s.saldo_comunicado_banco)}
                      </TableCell>
                      <TableCell className="text-xs">{s.origen}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{s.entorno}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
