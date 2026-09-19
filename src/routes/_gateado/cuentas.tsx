import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useActor, useCuentas, registrarAuditoria, type Cuenta } from "@/lib/datos";
import { formatoEuros } from "@/lib/secciones";

export const Route = createFileRoute("/_gateado/cuentas")({
  head: () => ({
    meta: [
      { title: "Cuentas bancarias · Farmatrack" },
      {
        name: "description",
        content:
          "Alta y listado de cuentas bancarias y líneas de crédito de la farmacia con su saldo de apertura.",
      },
      { property: "og:title", content: "Cuentas bancarias · Farmatrack" },
      {
        property: "og:description",
        content: "Cuentas y líneas de crédito de la farmacia con su saldo de apertura.",
      },
    ],
  }),
  component: PantallaCuentas,
});

const TIPOS: Cuenta["tipo"][] = ["Cuenta corriente", "Línea de crédito", "Cuenta de inversión"];

function PantallaCuentas() {
  const { data: cuentas, isLoading } = useCuentas();
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const [guardando, setGuardando] = useState(false);
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState<Cuenta["tipo"]>("Cuenta corriente");
  const [saldo, setSaldo] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [entorno, setEntorno] = useState<Cuenta["entorno"]>("produccion");

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) {
      toast.error("El nombre de la cuenta es obligatorio");
      return;
    }
    const importe = Number(saldo.replace(",", "."));
    if (Number.isNaN(importe)) {
      toast.error("El saldo de apertura debe ser un número");
      return;
    }
    setGuardando(true);
    const datos = {
      nombre: nombre.trim(),
      tipo,
      saldo_apertura: importe,
      fecha_saldo_apertura: fecha,
      entorno,
      activa: true,
    };
    const { data, error } = await supabase.from("cuentas").insert(datos).select().single();
    setGuardando(false);
    if (error) {
      toast.error("No se pudo crear la cuenta: " + error.message);
      return;
    }
    await registrarAuditoria({
      entidad: "Cuenta",
      entidadId: data.id,
      accion: "crear",
      actor,
      despues: datos,
    });
    await queryClient.invalidateQueries({ queryKey: ["cuentas"] });
    await queryClient.invalidateQueries({ queryKey: ["auditoria"] });
    toast.success("Cuenta creada");
    setNombre("");
    setSaldo("");
  }

  return (
    <AppShell
      titulo="Cuentas bancarias"
      descripcion="El saldo actual nunca se guarda: se calcula siempre desde el saldo de apertura."
    >
      <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
        <Card className="h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Nueva cuenta</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={crear} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="nombre">Nombre</Label>
                <Input
                  id="nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Banco principal"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Tipo</Label>
                <Select value={tipo} onValueChange={(v) => setTipo(v as Cuenta["tipo"])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="saldo">Saldo de apertura (€)</Label>
                <Input
                  id="saldo"
                  value={saldo}
                  onChange={(e) => setSaldo(e.target.value)}
                  placeholder="0,00"
                  inputMode="decimal"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fecha">Fecha del saldo de apertura</Label>
                <Input
                  id="fecha"
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Entorno</Label>
                <Select
                  value={entorno}
                  onValueChange={(v) => setEntorno(v as Cuenta["entorno"])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="produccion">Producción</SelectItem>
                    <SelectItem value="prueba">Prueba</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={guardando} className="w-full">
                {guardando ? "Guardando…" : "Crear cuenta"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Cuentas dadas de alta
              <span className="tabular ml-2 text-muted-foreground">
                {cuentas?.length ?? 0}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Cargando…</p>
            ) : !cuentas?.length ? (
              <p className="text-sm text-muted-foreground">
                Todavía no hay cuentas. Crea la primera con el formulario.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Saldo de apertura</TableHead>
                    <TableHead>Desde</TableHead>
                    <TableHead>Entorno</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cuentas.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.nombre}</TableCell>
                      <TableCell>{c.tipo}</TableCell>
                      <TableCell className="tabular text-right">
                        {formatoEuros(Number(c.saldo_apertura))}
                      </TableCell>
                      <TableCell className="tabular">{c.fecha_saldo_apertura}</TableCell>
                      <TableCell>
                        <Badge variant={c.entorno === "produccion" ? "secondary" : "outline"}>
                          {c.entorno === "produccion" ? "Producción" : "Prueba"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
