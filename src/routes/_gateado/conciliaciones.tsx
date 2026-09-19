import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useConciliaciones, useMovimientos, useVencimientos } from "@/lib/datos";
import { formatoEuros } from "@/lib/secciones";

export const Route = createFileRoute("/_gateado/conciliaciones")({
  head: () => ({
    meta: [
      { title: "Conciliación · Farmatrack" },
      {
        name: "description",
        content:
          "Conciliaciones registradas entre vencimientos y movimientos, con su tipo, confirmación y sobre-conciliaciones autorizadas.",
      },
      { property: "og:title", content: "Conciliación · Farmatrack" },
      {
        property: "og:description",
        content: "Registro de los pagos emparejados con movimientos bancarios de la farmacia.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PantallaConciliaciones,
});

function PantallaConciliaciones() {
  const { data: conciliaciones, isLoading } = useConciliaciones();
  const { data: vencimientos } = useVencimientos();
  const { data: movimientos } = useMovimientos();

  const venc = (id: string) => (vencimientos ?? []).find((v) => v.id === id);
  const mov = (id: string) => (movimientos ?? []).find((m) => m.id === id);

  return (
    <AppShell
      titulo="Conciliación"
      descripcion="Conciliaciones registradas, solo lectura: se dan de alta desde el panel de pagos de cada factura."
    >
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead>Movimiento</TableHead>
                <TableHead className="text-right">Aplicado</TableHead>
                <TableHead>Confirmado por</TableHead>
                <TableHead>Confianza</TableHead>
                <TableHead>Exceso</TableHead>
                <TableHead>Entorno</TableHead>
                <TableHead className="text-right">Factura</TableHead>
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
              {!isLoading && (conciliaciones ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="py-8 text-center text-muted-foreground">
                    Todavía no hay conciliaciones registradas.
                  </TableCell>
                </TableRow>
              )}
              {(conciliaciones ?? []).flatMap((c) =>
                c.detalle.map((d) => {
                  const v = venc(d.vencimiento_id);
                  const m = mov(d.movimiento_id);
                  return (
                    <TableRow key={d.id}>
                      <TableCell className="font-mono text-xs">
                        {(c.fecha_confirmacion ?? c.created_at).slice(0, 10)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{c.tipo}</Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        {v ? `${v.fecha} · ${formatoEuros(Number(v.importe))} · ${v.estado}` : "—"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {m ? `${m.fecha} · ${formatoEuros(Number(m.importe))} · ${m.tipo}` : "—"}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatoEuros(Number(d.importe_aplicado))}
                      </TableCell>
                      <TableCell className="text-xs">{c.confirmado_por ?? "—"}</TableCell>
                      <TableCell className="text-xs">
                        {c.nivel_confianza === null ? "—" : `${c.nivel_confianza}`}
                      </TableCell>
                      <TableCell className="text-xs">
                        {c.exceso_autorizado ? (
                          <span>
                            <Badge variant="destructive" className="mr-2 text-[0.65rem]">
                              Autorizado
                            </Badge>
                            {c.motivo_exceso}
                            {c.autorizado_por ? ` (${c.autorizado_por})` : ""}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{c.entorno}</TableCell>
                      <TableCell className="text-right">
                        {v?.factura_id ? (
                          <Button asChild size="sm" variant="outline">
                            <Link to="/facturas/$facturaId" params={{ facturaId: v.factura_id }}>
                              Abrir ficha
                            </Link>
                          </Button>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                    </TableRow>
                  );
                }),
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <p className="mt-4 text-xs text-muted-foreground">
        Una conciliación registrada no se edita ni se deshace: el documento no define ninguna
        función para ello.
      </p>
    </AppShell>
  );
}
