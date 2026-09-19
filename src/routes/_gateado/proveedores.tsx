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
import { supabase } from "@/integrations/supabase/client";
import {
  useActor,
  useCategorias,
  useProveedores,
  registrarAuditoria,
  type Proveedor,
} from "@/lib/datos";
import { normalizarNombre } from "@/lib/secciones";

export const Route = createFileRoute("/_gateado/proveedores")({
  head: () => ({
    meta: [
      { title: "Proveedores · Farmatrack" },
      {
        name: "description",
        content:
          "Catálogo de cooperativas, mayoristas, laboratorios y servicios de la farmacia, sin nombres duplicados.",
      },
      { property: "og:title", content: "Proveedores · Farmatrack" },
      {
        property: "og:description",
        content: "Catálogo de proveedores de la farmacia con control de nombres duplicados.",
      },
    ],
  }),
  component: PantallaProveedores,
});

const TIPOS: Proveedor["tipo"][] = ["Cooperativa", "Mayorista", "Laboratorio", "Servicio"];

function PantallaProveedores() {
  const { data: proveedores, isLoading } = useProveedores();
  const { data: categorias } = useCategorias();
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState({
    nombre_visible: "",
    tipo: "Cooperativa" as Proveedor["tipo"],
    cif: "",
    telefono: "",
    email: "",
    direccion: "",
    condiciones_pago: "",
    categoria_defecto_id: "ninguna",
    entorno: "produccion" as Proveedor["entorno"],
  });

  function actualizar<K extends keyof typeof form>(clave: K, valor: (typeof form)[K]) {
    setForm((f) => ({ ...f, [clave]: valor }));
  }

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    const nombre = form.nombre_visible.trim();
    if (!nombre) {
      toast.error("El nombre del proveedor es obligatorio");
      return;
    }
    const norm = normalizarNombre(nombre);
    if ((proveedores ?? []).some((p) => p.nombre_normalizado === norm)) {
      toast.error("Ya existe un proveedor con ese nombre");
      return;
    }
    setGuardando(true);
    const datos = {
      nombre_visible: nombre,
      nombre_normalizado: norm,
      tipo: form.tipo,
      cif: form.cif.trim() || null,
      telefono: form.telefono.trim() || null,
      email: form.email.trim() || null,
      direccion: form.direccion.trim() || null,
      condiciones_pago: form.condiciones_pago.trim() || null,
      categoria_defecto_id:
        form.categoria_defecto_id === "ninguna" ? null : form.categoria_defecto_id,
      entorno: form.entorno,
      activo: true,
    };
    const { data, error } = await supabase.from("proveedores").insert(datos).select().single();
    setGuardando(false);
    if (error) {
      toast.error("No se pudo crear el proveedor: " + error.message);
      return;
    }
    await registrarAuditoria({
      entidad: "Proveedor",
      entidadId: data.id,
      accion: "crear",
      actor,
      despues: datos,
    });
    await queryClient.invalidateQueries({ queryKey: ["proveedores"] });
    await queryClient.invalidateQueries({ queryKey: ["auditoria"] });
    toast.success("Proveedor creado");
    setForm((f) => ({
      ...f,
      nombre_visible: "",
      cif: "",
      telefono: "",
      email: "",
      direccion: "",
      condiciones_pago: "",
    }));
  }

  const nombreCategoria = (id: string | null) =>
    (categorias ?? []).find((c) => c.id === id)?.nombre ?? "—";

  return (
    <AppShell
      titulo="Proveedores"
      descripcion="No se admiten dos proveedores con el mismo nombre, aunque cambien acentos o mayúsculas."
    >
      <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
        <Card className="h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Nuevo proveedor</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={crear} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="nombre">Nombre</Label>
                <Input
                  id="nombre"
                  value={form.nombre_visible}
                  onChange={(e) => actualizar("nombre_visible", e.target.value)}
                  placeholder="Cooperativa Farmacéutica"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Tipo</Label>
                <Select
                  value={form.tipo}
                  onValueChange={(v) => actualizar("tipo", v as Proveedor["tipo"])}
                >
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
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="cif">CIF</Label>
                  <Input
                    id="cif"
                    value={form.cif}
                    onChange={(e) => actualizar("cif", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    value={form.telefono}
                    onChange={(e) => actualizar("telefono", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Correo</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => actualizar("email", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="direccion">Dirección</Label>
                <Input
                  id="direccion"
                  value={form.direccion}
                  onChange={(e) => actualizar("direccion", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="condiciones">Condiciones de pago</Label>
                <Input
                  id="condiciones"
                  value={form.condiciones_pago}
                  onChange={(e) => actualizar("condiciones_pago", e.target.value)}
                  placeholder="30 días fecha factura"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Categoría por defecto</Label>
                <Select
                  value={form.categoria_defecto_id}
                  onValueChange={(v) => actualizar("categoria_defecto_id", v)}
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
              <div className="space-y-1.5">
                <Label>Entorno</Label>
                <Select
                  value={form.entorno}
                  onValueChange={(v) => actualizar("entorno", v as Proveedor["entorno"])}
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
                {guardando ? "Guardando…" : "Crear proveedor"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Proveedores
              <span className="tabular ml-2 text-muted-foreground">
                {proveedores?.length ?? 0}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Cargando…</p>
            ) : !proveedores?.length ? (
              <p className="text-sm text-muted-foreground">
                Todavía no hay proveedores. Crea el primero con el formulario.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>CIF</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Categoría por defecto</TableHead>
                    <TableHead>Condiciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {proveedores.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.nombre_visible}</TableCell>
                      <TableCell>{p.tipo}</TableCell>
                      <TableCell className="tabular">{p.cif ?? "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {p.telefono ?? p.email ?? "—"}
                      </TableCell>
                      <TableCell>{nombreCategoria(p.categoria_defecto_id)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {p.condiciones_pago ?? "—"}
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
