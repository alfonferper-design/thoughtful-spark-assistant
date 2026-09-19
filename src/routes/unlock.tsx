import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { desbloquearApp } from "@/lib/gate.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock } from "lucide-react";

export const Route = createFileRoute("/unlock")({
  head: () => ({
    meta: [
      { title: "Acceso · Farmatrack" },
      { name: "description", content: "Introduce la clave para acceder a Farmatrack." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Desbloquear,
});

function Desbloquear() {
  const router = useRouter();
  const desbloquear = useServerFn(desbloquearApp);
  const [error, setError] = useState(false);
  const [ocupado, setOcupado] = useState(false);

  async function alEnviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setOcupado(true);
    setError(false);
    const clave = new FormData(e.currentTarget).get("clave") as string;
    try {
      const { ok } = await desbloquear({ data: { clave } });
      if (ok) {
        await router.invalidate();
        await router.navigate({ to: "/" });
        return;
      }
      setError(true);
    } catch {
      setError(true);
    }
    setOcupado(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center pb-3 text-center">
          <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Lock className="h-5 w-5" />
          </span>
          <CardTitle className="text-base">Farmatrack</CardTitle>
          <p className="text-sm text-muted-foreground">
            Esta aplicación está protegida. Introduce la clave para continuar.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={alEnviar} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="clave">Clave de acceso</Label>
              <Input
                id="clave"
                name="clave"
                type="password"
                autoComplete="current-password"
                autoFocus
              />
            </div>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                Clave incorrecta. Inténtalo de nuevo.
              </p>
            )}
            <Button type="submit" disabled={ocupado} className="w-full">
              {ocupado ? "Comprobando…" : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
