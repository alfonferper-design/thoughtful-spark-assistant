import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCuentas, useCategorias, useProveedores } from "@/lib/datos";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Configuración inicial · Farmatrack" },
      {
        name: "description",
        content:
          "Punto de partida de la plataforma financiera de la farmacia: cuentas, categorías y proveedores dados de alta.",
      },
      { property: "og:title", content: "Configuración inicial · Farmatrack" },
      {
        property: "og:description",
        content:
          "Checklist de puesta en marcha de la plataforma financiera de la farmacia.",
      },
    ],
  }),
  component: ConfiguracionInicial,
});

function ConfiguracionInicial() {
  const cuentas = useCuentas();
  const categorias = useCategorias();
  const proveedores = useProveedores();

  const pasos = [
    {
      titulo: "Cuentas bancarias",
      detalle: "Cada cuenta con su saldo de apertura y su fecha.",
      total: cuentas.data?.length ?? 0,
      path: "/cuentas" as const,
    },
    {
      titulo: "Categorías y subcategorías",
      detalle: "Dos niveles como máximo, de ingreso o de gasto.",
      total: categorias.data?.length ?? 0,
      path: "/categorias" as const,
    },
    {
      titulo: "Proveedores",
      detalle: "Cooperativas, mayoristas, laboratorios y servicios.",
      total: proveedores.data?.length ?? 0,
      path: "/proveedores" as const,
    },
  ];

  const completados = pasos.filter((p) => p.total > 0).length;

  return (
    <AppShell
      titulo="Configuración inicial"
      descripcion="Da de alta los datos maestros antes de registrar movimientos y facturas."
    >
      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Progreso de puesta en marcha
              <span className="tabular ml-2 text-muted-foreground">
                {completados}/{pasos.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            {pasos.map((paso) => (
              <div
                key={paso.titulo}
                className="rounded-lg border border-border bg-card p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium">{paso.titulo}</p>
                  <Badge variant={paso.total > 0 ? "default" : "secondary"}>
                    {paso.total > 0 ? "Listo" : "Pendiente"}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{paso.detalle}</p>
                <p className="tabular mt-3 text-2xl">{paso.total}</p>
                <Button asChild variant="outline" size="sm" className="mt-3">
                  <Link to={paso.path}>Ir a {paso.titulo.toLowerCase()}</Link>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Qué viene después</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Movimientos, transferencias, facturas con sus líneas y pagos, compromisos fijos,
            conciliación bancaria e informes. Las pantallas marcadas como pendientes en el menú
            ya están reservadas y se irán construyendo por bloques.
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
