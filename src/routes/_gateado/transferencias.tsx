import { createFileRoute } from "@tanstack/react-router";
import { PantallaPendiente } from "@/components/PantallaPendiente";

export const Route = createFileRoute("/transferencias")({
  head: () => ({
    meta: [
      { title: "Transferencias · Farmatrack" },
      { name: "description", content: "Traspasos entre cuentas propias." },
      { property: "og:title", content: "Transferencias · Farmatrack" },
      { property: "og:description", content: "Traspasos entre cuentas propias." },
    ],
  }),
  component: Pantalla,
});

function Pantalla() {
  return (
    <PantallaPendiente
      titulo="Transferencias"
      descripcion="Traspasos entre cuentas propias."
      contenido={["Alta de traspaso entre dos cuentas", "Creación automática de los dos movimientos emparejados", "Listado de traspasos"]}
    />
  );
}
