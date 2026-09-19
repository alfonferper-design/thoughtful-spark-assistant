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
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useActor, useCategorias, registrarAuditoria, type Categoria } from "@/lib/datos";

export const Route = createFileRoute("/categorias")({
  head: () => ({
    meta: [
      { title: "Categorías · Farmatrack" },
      {
        name: "description",
        content:
          "Categorías y subcategorías de ingreso y gasto de la farmacia, en una jerarquía de dos niveles.",
      },
      { property: "og:title", content: "Categorías · Farmatrack" },
      {
        property: "og:description",
        content: "Jerarquía de dos niveles para clasificar ingresos y gastos de la farmacia.",
      },
    ],
  }),
  component: PantallaCategorias,
});

function PantallaCategorias() {
  const { data: categorias, isLoading } = useCategorias();
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState<Categoria["tipo"]>("Gasto");
  const [padre, setPadre] = useState<string>("ninguna");
  const [entorno, setEntorno] = useState<Categoria["entorno"]>("produccion");
  const [guardando, setGuardando] = useState(false);

  const nivel1 = (categorias ?? []).filter((c) => c.categoria_padre_id === null);

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    setGuardando(true);
    const datos = {
      nombre: nombre.trim(),
      tipo,
      categoria_padre_id: padre === "ninguna" ? null : padre,
      entorno,
    };
    const { data, error } = await supabase.from("categorias").insert(datos).select().single();
    setGuardando(false);
    if (error) {
      toast.error("No se pudo crear: " + error.message);
      return;
    }
    await registrarAuditoria({
      entidad: "Categoria",
      entidadId: data.id,
      accion: "crear",
      actor,
      despues: datos,
    });
    await queryClient.invalidateQueries({ queryKey: ["categorias"] });
    await queryClient.invalidateQueries({ queryKey: ["auditoria"] });
    toast.success("Categoría creada");
    setNombre("");
  }

  return (
    <AppShell
      titulo="Categorías"
      descripcion="Dos niveles como máximo: una categoría y sus subcategorías."
    >
      <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
        <Card className="h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Nueva categoría</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={crear} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="nombre">Nombre</Label>
                <Input
                  id="nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Compras de mercancía"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Tipo</Label>
                <Select value={tipo} onValueChange={(v) => setTipo(v as Categoria["tipo"])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Gasto">Gasto</SelectItem>
                    <SelectItem value="Ingreso">Ingreso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Depende de</Label>
                <Select value={padre} onValueChange={setPadre}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ninguna">Ninguna (categoría principal)</SelectItem>
                    {nivel1.map((c) => (
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
                  value={entorno}
                  onValueChange={(v) => setEntorno(v as Categoria["entorno"])}
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
                {guardando ? "Guardando…" : "Crear categoría"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Jerarquía
              <span className="tabular ml-2 text-muted-foreground">
                {categorias?.length ?? 0}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Cargando…</p>
            ) : !nivel1.length ? (
              <p className="text-sm text-muted-foreground">
                Todavía no hay categorías. Crea la primera con el formulario.
              </p>
            ) : (
              <ul className="space-y-4">
                {nivel1.map((c) => {
                  const hijas = (categorias ?? []).filter((s) => s.categoria_padre_id === c.id);
                  return (
                    <li key={c.id}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{c.nombre}</span>
                        <Badge variant={c.tipo === "Ingreso" ? "default" : "secondary"}>
                          {c.tipo}
                        </Badge>
                        {c.entorno === "prueba" && <Badge variant="outline">Prueba</Badge>}
                      </div>
                      {hijas.length > 0 && (
                        <ul className="mt-1.5 space-y-1 border-l border-border pl-4">
                          {hijas.map((h) => (
                            <li key={h.id} className="text-sm text-muted-foreground">
                              {h.nombre}
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
