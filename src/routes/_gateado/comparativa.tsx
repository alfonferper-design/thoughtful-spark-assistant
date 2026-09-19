import { createFileRoute } from "@tanstack/react-router";
import { PantallaPendiente } from "@/components/PantallaPendiente";

export const Route = createFileRoute("/comparativa")({
  head: () => ({
    meta: [
      { title: "Comparativa · Farmatrack" },
      { name: "description", content: "Comparación de dos periodos." },
      { property: "og:title", content: "Comparativa · Farmatrack" },
      { property: "og:description", content: "Comparación de dos periodos." },
    ],
  }),
  component: Pantalla,
});

function Pantalla() {
  return (
    <PantallaPendiente
      titulo="Comparativa"
      descripcion="Comparación de dos periodos."
      contenido={["Selección de dos rangos de fechas", "Variación por categoría, proveedor o cuenta", "Diferencias en importe y en porcentaje"]}
    />
  );
}
