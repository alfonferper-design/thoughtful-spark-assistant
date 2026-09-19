import { createFileRoute } from "@tanstack/react-router";
import { PantallaPendiente } from "@/components/PantallaPendiente";

export const Route = createFileRoute("/conciliaciones")({
  head: () => ({
    meta: [
      { title: "Conciliación · Farmatrack" },
      { name: "description", content: "Emparejado de pagos con movimientos." },
      { property: "og:title", content: "Conciliación · Farmatrack" },
      { property: "og:description", content: "Emparejado de pagos con movimientos." },
    ],
  }),
  component: Pantalla,
});

function Pantalla() {
  return (
    <PantallaPendiente
      titulo="Conciliación"
      descripcion="Emparejado de pagos con movimientos."
      contenido={["Sugerencias automáticas de emparejado", "Validación antes de registrar la conciliación", "Listado con el detalle de cada conciliación"]}
    />
  );
}
