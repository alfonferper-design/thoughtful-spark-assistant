import { createFileRoute } from "@tanstack/react-router";
import { PantallaPendiente } from "@/components/PantallaPendiente";

export const Route = createFileRoute("/movimientos")({
  head: () => ({
    meta: [
      { title: "Movimientos · Farmatrack" },
      { name: "description", content: "Altas y listado de movimientos bancarios." },
      { property: "og:title", content: "Movimientos · Farmatrack" },
      { property: "og:description", content: "Altas y listado de movimientos bancarios." },
    ],
  }),
  component: Pantalla,
});

function Pantalla() {
  return (
    <PantallaPendiente
      titulo="Movimientos"
      descripcion="Altas y listado de movimientos bancarios."
      contenido={["Alta de movimiento con cuenta, categoría y proveedor", "Sugerencia de categoría según el proveedor", "Listado filtrable de movimientos"]}
    />
  );
}
