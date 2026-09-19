import { Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { GRUPOS } from "@/lib/secciones";
import { useActor } from "@/lib/datos";
import { Input } from "@/components/ui/input";

export function AppShell({
  titulo,
  descripcion,
  children,
}: {
  titulo: string;
  descripcion?: string;
  children: ReactNode;
}) {
  const { actor, guardarActor } = useActor();
  const [nombre, setNombre] = useState(actor);

  useEffect(() => {
    setNombre(actor);
  }, [actor]);

  return (
    <div className="min-h-screen bg-background lg:flex">
      <aside className="bg-sidebar text-sidebar-foreground lg:min-h-screen lg:w-72 lg:shrink-0">
        <div className="border-b border-sidebar-border px-5 py-5">
          <p className="text-[0.7rem] uppercase tracking-[0.2em] text-sidebar-primary">
            Farmatrack
          </p>
          <p className="mt-1 text-sm font-semibold leading-snug">
            Plataforma Financiera Farmacia
          </p>
        </div>
        <nav className="max-h-[50vh] overflow-y-auto px-3 py-4 lg:max-h-none">
          {GRUPOS.map((grupo) => (
            <div key={grupo.grupo} className="mb-4">
              <p className="px-2 pb-1 text-[0.65rem] uppercase tracking-[0.18em] text-sidebar-foreground/50">
                {grupo.grupo}
              </p>
              <ul className="space-y-0.5">
                {grupo.items.map((item) => (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      activeOptions={{ exact: item.path === "/" }}
                      className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      activeProps={{
                        className:
                          "bg-sidebar-accent text-sidebar-accent-foreground font-medium border-l-2 border-sidebar-primary",
                      }}
                    >
                      <span>{item.label}</span>
                      {!item.listo && (
                        <span className="text-[0.6rem] uppercase tracking-wide text-sidebar-foreground/40">
                          pend.
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border bg-card px-6 py-5">
          <div>
            <h1 className="text-xl font-semibold">{titulo}</h1>
            {descripcion && (
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{descripcion}</p>
            )}
          </div>
          <label className="text-xs text-muted-foreground">
            Responsable de los cambios
            <Input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              onBlur={() => {
                if (nombre.trim() && nombre.trim() !== actor) void guardarActor(nombre.trim());
              }}
              className="mt-1 h-8 w-48 text-sm"
            />
          </label>
        </header>
        <main className="flex-1 px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
