import { createFileRoute } from "@tanstack/react-router";
import { PantallaPendiente } from "@/components/PantallaPendiente";

export const Route = createFileRoute("/_gateado/backup")({
  head: () => ({
    meta: [
      { title: "Backup / Exportación · Farmatrack" },
      { name: "description", content: "Copia completa de los datos." },
      { property: "og:title", content: "Backup / Exportación · Farmatrack" },
      { property: "og:description", content: "Copia completa de los datos." },
    ],
  }),
  component: Pantalla,
});

function Pantalla() {
  return (
    <PantallaPendiente
      titulo="Backup / Exportación"
      descripcion="Copia completa de los datos."
      contenido={["Generación de un paquete de exportación", "Descarga de todos los datos en un único archivo", "Verificación de integridad de la copia"]}
    />
  );
}
