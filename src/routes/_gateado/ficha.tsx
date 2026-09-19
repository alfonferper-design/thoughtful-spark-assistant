import { createFileRoute } from "@tanstack/react-router";
import { PantallaPendiente } from "@/components/PantallaPendiente";

export const Route = createFileRoute("/ficha")({
  head: () => ({
    meta: [
      { title: "Ficha de factura · Farmatrack" },
      { name: "description", content: "Espacio de trabajo de una sola factura." },
      { property: "og:title", content: "Ficha de factura · Farmatrack" },
      { property: "og:description", content: "Espacio de trabajo de una sola factura." },
    ],
  }),
  component: Pantalla,
});

function Pantalla() {
  return (
    <PantallaPendiente
      titulo="Ficha de factura"
      descripcion="Espacio de trabajo de una sola factura."
      contenido={["Documento original adjunto", "Líneas de la factura con sus impuestos y descuentos", "Rectificativas, abonos, vencimientos y pagos"]}
    />
  );
}
