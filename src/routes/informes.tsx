import { createFileRoute } from "@tanstack/react-router";
import { PantallaPendiente } from "@/components/PantallaPendiente";

export const Route = createFileRoute("/informes")({
  head: () => ({
    meta: [
      { title: "Informes · Farmatrack" },
      { name: "description", content: "Informes agregados con filtros." },
      { property: "og:title", content: "Informes · Farmatrack" },
      { property: "og:description", content: "Informes agregados con filtros." },
    ],
  }),
  component: Pantalla,
});

function Pantalla() {
  return (
    <PantallaPendiente
      titulo="Informes"
      descripcion="Informes agregados con filtros."
      contenido={["Filtros por fecha, cuenta, categoría y proveedor", "Agrupaciones de importes por dimensión", "Informe de vencimientos"]}
    />
  );
}
