import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { estadoPuerta } from "@/lib/gate.functions";

// Layout sin ruta propia: todas las pantallas de la aplicación cuelgan de él.
// En el navegador exige la sesión desbloqueada; en SSR se omite la comprobación
// (los datos nunca viajan sin sesión porque cada función de servidor la exige).
export const Route = createFileRoute("/_gateado")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { desbloqueado } = await estadoPuerta();
    if (!desbloqueado) throw redirect({ to: "/unlock" });
  },
  component: () => <Outlet />,
});
