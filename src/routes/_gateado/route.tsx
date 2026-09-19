import { createFileRoute, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { estadoPuerta } from "@/lib/gate.functions";

// Layout sin ruta propia: todas las pantallas de la aplicación cuelgan de él.
// Exige la sesión desbloqueada con la clave de la aplicación. La comprobación
// se hace en cliente (beforeLoad en navegaciones y efecto en la carga inicial);
// los datos nunca viajan sin sesión porque cada función de servidor la exige.
export const Route = createFileRoute("/_gateado")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { desbloqueado } = await estadoPuerta();
    if (!desbloqueado) throw redirect({ to: "/unlock" });
  },
  component: LayoutGateado,
});

function LayoutGateado() {
  const navigate = useNavigate();

  useEffect(() => {
    void estadoPuerta().then(({ desbloqueado }) => {
      if (!desbloqueado) void navigate({ to: "/unlock" });
    });
  }, [navigate]);

  return <Outlet />;
}
