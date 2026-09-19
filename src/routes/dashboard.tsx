import { createFileRoute } from "@tanstack/react-router";
import { PantallaPendiente } from "@/components/PantallaPendiente";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard · Farmatrack" },
      { name: "description", content: "Panel de indicadores financieros, solo lectura." },
      { property: "og:title", content: "Dashboard · Farmatrack" },
      { property: "og:description", content: "Panel de indicadores financieros, solo lectura." },
    ],
  }),
  component: Pantalla,
});

function Pantalla() {
  return (
    <PantallaPendiente
      titulo="Dashboard"
      descripcion="Panel de indicadores financieros, solo lectura."
      contenido={["Saldo interno y consolidado por cuenta", "Previsión de tesorería y pagos pendientes", "Gasto financiero y cash flow operativo"]}
    />
  );
}
