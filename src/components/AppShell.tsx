import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { MODULOS, moduloDeRuta } from "@/lib/secciones";
import { useActor } from "@/lib/datos";
import { bloquearApp } from "@/lib/gate.functions";
import { Input } from "@/components/ui/input";
import { Lock, Menu, X } from "lucide-react";

function Navegacion({ onNavegar }: { onNavegar?: () => void }) {
  const ruta = useRouterState({ select: (s) => s.location.pathname });
  const activo = moduloDeRuta(ruta);
  const [abierto, setAbierto] = useState(activo);

  useEffect(() => {
    setAbierto(activo);
  }, [activo]);

  return (
    <nav className="px-3 py-5">
      <ul className="space-y-1">
        {MODULOS.map((modulo) => {
          const esActivo = activo === modulo.id;
          const expandido = abierto === modulo.id;
          const disponibles = modulo.hijos.filter((h) => h.listo);
          const futuros = modulo.hijos.filter((h) => !h.listo);

          return (
            <li key={modulo.id}>
              <Link
                to={modulo.path}
                onClick={() => {
                  setAbierto(modulo.id);
                  if (!modulo.hijos.length) onNavegar?.();
                }}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                  esActivo
                    ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                }`}
              >
                <span
                  className={`h-4 w-[2px] rounded-full ${
                    esActivo ? "bg-sidebar-primary" : "bg-transparent"
                  }`}
                />
                {modulo.label}
              </Link>

              {expandido && modulo.hijos.length > 0 && (
                <div className="mb-2 ml-[1.15rem] mt-1 border-l border-sidebar-border pl-3">
                  <ul className="space-y-0.5">
                    {disponibles.map((hijo) => (
                      <li key={hijo.path}>
                        <Link
                          to={hijo.path}
                          onClick={onNavegar}
                          className="block rounded-md px-2 py-1.5 text-[0.82rem] text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                          activeProps={{
                            className:
                              "bg-sidebar-accent/70 text-sidebar-accent-foreground font-medium",
                          }}
                        >
                          {hijo.label}
                        </Link>
                      </li>
                    ))}
                  </ul>

                  {futuros.length > 0 && (
                    <div className="mt-2">
                      <p className="px-2 pb-1 text-[0.6rem] uppercase tracking-[0.18em] text-sidebar-foreground/40">
                        En preparación
                      </p>
                      <ul className="space-y-0.5">
                        {futuros.map((hijo) => (
                          <li key={hijo.path}>
                            <Link
                              to={hijo.path}
                              onClick={onNavegar}
                              className="block rounded-md px-2 py-1.5 text-[0.82rem] text-sidebar-foreground/45 transition-colors hover:bg-sidebar-accent/40 hover:text-sidebar-accent-foreground"
                              activeProps={{
                                className:
                                  "bg-sidebar-accent/60 text-sidebar-accent-foreground",
                              }}
                            >
                              {hijo.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function AppShell({
  titulo,
  descripcion,
  acciones,
  children,
}: {
  titulo: string;
  descripcion?: string;
  acciones?: ReactNode;
  children: ReactNode;
}) {
  const { actor, guardarActor } = useActor();
  const [nombre, setNombre] = useState(actor);
  const [menuMovil, setMenuMovil] = useState(false);
  const navigate = useNavigate();

  async function bloquear() {
    await bloquearApp();
    await navigate({ to: "/unlock" });
  }

  useEffect(() => {
    setNombre(actor);
  }, [actor]);

  const cabecera = (
    <div className="border-b border-sidebar-border px-5 py-5">
      <p className="text-[0.7rem] uppercase tracking-[0.2em] text-sidebar-primary">Farmatrack</p>
      <p className="mt-1 text-sm font-semibold leading-snug">Plataforma Financiera Farmacia</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-background lg:flex">
      <aside className="hidden bg-sidebar text-sidebar-foreground lg:block lg:min-h-screen lg:w-64 lg:shrink-0">
        {cabecera}
        <Navegacion />
      </aside>

      {menuMovil && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Cerrar menú"
            className="absolute inset-0 bg-foreground/40"
            onClick={() => setMenuMovil(false)}
          />
          <div className="relative h-full w-72 max-w-[85%] overflow-y-auto bg-sidebar text-sidebar-foreground">
            {cabecera}
            <Navegacion onNavegar={() => setMenuMovil(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border bg-card px-5 py-4 sm:px-6 sm:py-5">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              aria-label="Abrir menú"
              onClick={() => setMenuMovil((v) => !v)}
              className="rounded-md border border-border p-2 text-muted-foreground lg:hidden"
            >
              {menuMovil ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold">{titulo}</h1>
              {descripcion && (
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{descripcion}</p>
              )}
            </div>
          </div>
          <div className="flex items-end gap-2">
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
            <button
              type="button"
              onClick={() => void bloquear()}
              title="Bloquear la aplicación"
              aria-label="Bloquear la aplicación"
              className="rounded-md border border-border p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Lock className="h-4 w-4" />
            </button>
          </div>
        </header>
        <main className="flex-1 px-5 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
