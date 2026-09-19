import { createFileRoute } from "@tanstack/react-router";
import { PantallaPendiente } from "@/components/PantallaPendiente";

export const Route = createFileRoute("/compromisos")({
  head: () => ({
    meta: [
      { title: "Compromisos fijos · Farmatrack" },
      { name: "description", content: "Gastos recurrentes previstos." },
      { property: "og:title", content: "Compromisos fijos · Farmatrack" },
      { property: "og:description", content: "Gastos recurrentes previstos." },
    ],
  }),
  component: Pantalla,
});

function Pantalla() {
  return (
    <PantallaPendiente
      titulo="Compromisos fijos"
      descripcion="Gastos recurrentes previstos."
      contenido={["Alta de compromiso con su periodicidad", "Histórico de importes con fecha de vigencia", "Generación de los vencimientos previstos"]}
    />
  );
}
