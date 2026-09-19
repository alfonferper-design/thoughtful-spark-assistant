import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";

export function PantallaPendiente({
  titulo,
  descripcion,
  contenido,
}: {
  titulo: string;
  descripcion: string;
  contenido: string[];
}) {
  return (
    <AppShell titulo={titulo} descripcion={descripcion}>
      <Card className="max-w-2xl border-dashed">
        <CardContent className="space-y-3 pt-6">
          <p className="text-sm text-muted-foreground">
            Esta pantalla está reservada y todavía no está construida. Cuando la abordemos
            incluirá:
          </p>
          <ul className="space-y-1.5 text-sm">
            {contenido.map((linea) => (
              <li key={linea} className="flex gap-2">
                <span className="text-primary">·</span>
                <span>{linea}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </AppShell>
  );
}
