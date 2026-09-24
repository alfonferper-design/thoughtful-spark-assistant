import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCuentas, useCategorias, useProveedores } from "@/lib/datos";
import { Check, CheckCircle2, ChevronRight, Circle } from "lucide-react";

export const Route = createFileRoute("/_gateado/")({
  head: () => ({
    meta: [
      { title: "Inicio · Farmatrack" },
      {
        name: "description",
        content:
          "Punto de partida de la plataforma financiera de la farmacia: cuentas, categorías y proveedores dados de alta.",
      },
      { property: "og:title", content: "Inicio · Farmatrack" },
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
      total: cuentas.data?.length ?? 0,
      path: "/cuentas" as const,
    },
    {
      titulo: "Categorías y subcategorías",
      total: categorias.data?.length ?? 0,
      path: "/categorias" as const,
    },
    {
      titulo: "Proveedores",
      total: proveedores.data?.length ?? 0,
      path: "/proveedores" as const,
    },
  ];

  const completados = pasos.filter((p) => p.total > 0).length;

  return (
    <AppShell
      titulo="Inicio"
      descripcion="Da de alta los datos maestros antes de registrar movimientos y facturas."
    >
      <div className="space-y-6">
        {completados < pasos.length && (
          <Card>
            <CardHeader className="space-y-3 pb-4">
              <p className="text-xs font-semibold uppercase text-primary">Puesta en marcha</p>
              <div>
                <CardTitle className="text-lg">Configuración inicial pendiente</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Completa estos datos antes de empezar a trabajar con datos reales. Pulsa cada
                  elemento para completarlo.
                </p>
              </div>
              <div>
                <p className="tabular text-xs font-medium text-muted-foreground">
                  {completados} de {pasos.length} necesarios completados
                </p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-[width]"
                    style={{ width: `${(completados / pasos.length) * 100}%` }}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                  Necesario
                </p>
                <div className="divide-y divide-border overflow-hidden rounded-md border border-border">
                  {pasos.map((paso) => {
                    const configurado = paso.total > 0;
                    return (
                      <Button
                        key={paso.titulo}
                        asChild
                        variant="ghost"
                        className="h-auto min-h-12 w-full justify-start rounded-none px-3 py-2.5 text-left first:rounded-t-md last:rounded-b-md"
                      >
                        <Link to={paso.path}>
                          {configurado ? (
                            <CheckCircle2 className="text-success" />
                          ) : (
                            <Circle className="text-warning" />
                          )}
                          <span className="min-w-0 flex-1 whitespace-normal font-medium">
                            {paso.titulo}
                          </span>
                          <span
                            className={`tabular shrink-0 whitespace-normal text-right text-xs sm:text-sm ${
                              configurado ? "text-success" : "text-warning"
                            }`}
                          >
                            {configurado ? (
                              <span className="inline-flex items-center gap-1">
                                <Check className="h-3.5 w-3.5" /> Configurado · {paso.total}
                              </span>
                            ) : (
                              "Pendiente"
                            )}
                          </span>
                          <ChevronRight className="text-muted-foreground" />
                        </Link>
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                  Opcional
                </p>
                <Button
                  asChild
                  variant="ghost"
                  className="h-auto min-h-12 w-full justify-start rounded-md border border-border px-3 py-2.5 text-left text-muted-foreground"
                >
                  <Link to="/compromisos">
                    <Circle className="stroke-[1.5] [stroke-dasharray:3_3]" />
                    <span className="min-w-0 flex-1 whitespace-normal font-medium">
                      Compromisos fijos
                    </span>
                    <span className="shrink-0 text-xs sm:text-sm">Opcional</span>
                    <ChevronRight />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

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
