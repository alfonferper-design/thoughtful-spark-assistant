import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAuditoria } from "@/lib/datos";

export const Route = createFileRoute("/auditoria")({
  head: () => ({
    meta: [
      { title: "Auditoría · Farmatrack" },
      {
        name: "description",
        content:
          "Registro de solo lectura de todos los cambios realizados en la plataforma financiera de la farmacia.",
      },
      { property: "og:title", content: "Auditoría · Farmatrack" },
      {
        property: "og:description",
        content: "Quién cambió qué y cuándo dentro de la plataforma financiera de la farmacia.",
      },
    ],
  }),
  component: PantallaAuditoria,
});

function PantallaAuditoria() {
  const { data: registros, isLoading } = useAuditoria();

  return (
    <AppShell
      titulo="Auditoría"
      descripcion="Solo lectura: cada alta queda registrada con su responsable y su fecha."
    >
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Movimientos registrados
            <span className="tabular ml-2 text-muted-foreground">{registros?.length ?? 0}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : !registros?.length ? (
            <p className="text-sm text-muted-foreground">
              Todavía no hay cambios registrados.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Entidad</TableHead>
                  <TableHead>Acción</TableHead>
                  <TableHead>Responsable</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registros.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="tabular text-sm">
                      {new Date(r.fecha).toLocaleString("es-ES")}
                    </TableCell>
                    <TableCell>{r.entidad}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{r.accion}</Badge>
                    </TableCell>
                    <TableCell>{r.actor}</TableCell>
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
