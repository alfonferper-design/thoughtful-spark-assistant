import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useActor, useCategorias, useProveedores } from "@/lib/datos";
import { crearFacturaNormal } from "@/lib/datos.functions";
import { NATURALEZAS_SUGERIDAS } from "@/lib/listas-factura";

export const Route = createFileRoute("/_gateado/facturas/nueva")({
  head: () => ({
    meta: [
      { title: "Nueva factura · Farmatrack" },
      {
        name: "description",
        content: "Alta de una factura normal recibida de un proveedor de la farmacia.",
      },
      { property: "og:title", content: "Nueva factura · Farmatrack" },
      {
        property: "og:description",
        content: "Registro de una factura normal con proveedor, fechas, importe y categoría.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PantallaNuevaFactura,
});

function PantallaNuevaFactura() {
  const { data: proveedores } = useProveedores();
  const { data: categorias } = useCategorias();
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState({
    proveedor_id: "",
    numero_factura: "",
    fecha: new Date().toISOString().slice(0, 10),
    fecha_recepcion: "",
    fecha_vencimiento: "",
    total: "",
    moneda: "EUR",
    naturaleza: "ninguna",
    categoria_id: "ninguna",
    forma_pago: "",
    condiciones_pago: "",
    observaciones: "",
    entorno: "produccion" as "produccion" | "prueba",
  });

  function actualizar<K extends keyof typeof form>(clave: K, valor: (typeof form)[K]) {
    setForm((f) => ({ ...f, [clave]: valor }));
  }

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    if (!form.proveedor_id) {
      toast.error("Elige el proveedor de la factura");
      return;
    }
    if (!form.fecha) {
      toast.error("La fecha de la factura es obligatoria");
      return;
    }
    const total = Number(form.total.replace(",", "."));
    if (!Number.isFinite(total)) {
      toast.error("El importe total tiene que ser un número");
      return;
    }
    setGuardando(true);
    try {
      await crearFacturaNormal({
        data: {
          proveedor_id: form.proveedor_id,
          fecha: form.fecha,
          fecha_recepcion: form.fecha_recepcion || null,
          fecha_vencimiento: form.fecha_vencimiento || null,
          numero_factura: form.numero_factura.trim() || null,
          total,
          naturaleza: form.naturaleza === "ninguna" ? null : form.naturaleza,
          categoria_id: form.categoria_id === "ninguna" ? null : form.categoria_id,
          moneda: form.moneda.trim() || "EUR",
          forma_pago: form.forma_pago.trim() || null,
          condiciones_pago: form.condiciones_pago.trim() || null,
          observaciones: form.observaciones.trim() || null,
          entorno: form.entorno,
          actor,
        },
      });
    } catch (error) {
      setGuardando(false);
      toast.error("No se pudo crear la factura: " + (error as Error).message);
      return;
    }
    setGuardando(false);
    await queryClient.invalidateQueries({ queryKey: ["facturas"] });
    await queryClient.invalidateQueries({ queryKey: ["auditoria"] });
    toast.success("Factura registrada");
    await navigate({ to: "/facturas" });
  }

  return (
    <AppShell
      titulo="Nueva factura"
      descripcion="Factura normal recibida de un proveedor. Las rectificativas y abonos llegarán más adelante."
    >
      <form onSubmit={crear} className="grid max-w-4xl gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Documento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Proveedor</Label>
              <Select
                value={form.proveedor_id}
                onValueChange={(v) => actualizar("proveedor_id", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Elige un proveedor" />
                </SelectTrigger>
                <SelectContent>
                  {(proveedores ?? []).map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nombre_visible}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="numero">Número de factura</Label>
              <Input
                id="numero"
                value={form.numero_factura}
                onChange={(e) => actualizar("numero_factura", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="total">Total</Label>
                <Input
                  id="total"
                  inputMode="decimal"
                  value={form.total}
                  onChange={(e) => actualizar("total", e.target.value)}
                  placeholder="0,00"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="moneda">Moneda</Label>
                <Input
                  id="moneda"
                  value={form.moneda}
                  onChange={(e) => actualizar("moneda", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Entorno</Label>
              <Select
                value={form.entorno}
                onValueChange={(v) => actualizar("entorno", v as "produccion" | "prueba")}
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Fechas y clasificación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="fecha">Fecha de la factura</Label>
              <Input
                id="fecha"
                type="date"
                value={form.fecha}
                onChange={(e) => actualizar("fecha", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                La fecha de emisión se guarda igual a esta fecha.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="recepcion">Recepción</Label>
                <Input
                  id="recepcion"
                  type="date"
                  value={form.fecha_recepcion}
                  onChange={(e) => actualizar("fecha_recepcion", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="vencimiento">Vencimiento (cabecera)</Label>
                <Input
                  id="vencimiento"
                  type="date"
                  value={form.fecha_vencimiento}
                  onChange={(e) => actualizar("fecha_vencimiento", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Naturaleza</Label>
              <Select
                value={form.naturaleza}
                onValueChange={(v) => actualizar("naturaleza", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ninguna">Sin indicar</SelectItem>
                  {NATURALEZAS_SUGERIDAS.map((n) => (
                    <SelectItem key={n} value={n}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Categoría</Label>
              <Select
                value={form.categoria_id}
                onValueChange={(v) => actualizar("categoria_id", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ninguna">Sin categoría</SelectItem>
                  {(categorias ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="forma">Forma de pago</Label>
                <Input
                  id="forma"
                  value={form.forma_pago}
                  onChange={(e) => actualizar("forma_pago", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="condiciones">Condiciones de pago</Label>
                <Input
                  id="condiciones"
                  value={form.condiciones_pago}
                  onChange={(e) => actualizar("condiciones_pago", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="observaciones">Observaciones</Label>
              <Textarea
                id="observaciones"
                value={form.observaciones}
                onChange={(e) => actualizar("observaciones", e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 lg:col-span-2">
          <Button type="submit" disabled={guardando}>
            {guardando ? "Guardando…" : "Registrar factura"}
          </Button>
          <Button type="button" variant="outline" onClick={() => void navigate({ to: "/facturas" })}>
            Cancelar
          </Button>
        </div>
      </form>
    </AppShell>
  );
}
