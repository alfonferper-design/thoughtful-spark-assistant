import { createFileRoute } from "@tanstack/react-router";
import { PantallaPendiente } from "@/components/PantallaPendiente";

export const Route = createFileRoute("/vencimientos")({
  head: () => ({
    meta: [
      { title: "Vencimientos · Farmatrack" },
      { name: "description", content: "Pagos y cobros previstos." },
      { property: "og:title", content: "Vencimientos · Farmatrack" },
      { property: "og:description", content: "Pagos y cobros previstos." },
    ],
  }),
  component: Pantalla,
});

function Pantalla() {
  return (
    <PantallaPendiente
      titulo="Vencimientos"
      descripcion="Pagos y cobros previstos."
      contenido={["Alta manual validada de vencimiento", "Estado calculado: pendiente, parcial o pagado", "Listado global con su origen"]}
    />
  );
}
