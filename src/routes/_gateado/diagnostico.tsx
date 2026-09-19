import { createFileRoute } from "@tanstack/react-router";
import { PantallaPendiente } from "@/components/PantallaPendiente";

export const Route = createFileRoute("/_gateado/diagnostico")({
  head: () => ({
    meta: [
      { title: "Diagnóstico · Farmatrack" },
      { name: "description", content: "Salud del sistema, informe de almacenamiento y limpieza de registros huérfanos." },
      { property: "og:title", content: "Diagnóstico · Farmatrack" },
      { property: "og:description", content: "Salud del sistema, informe de almacenamiento y limpieza de registros huérfanos." },
    ],
  }),
  component: Pantalla,
});

function Pantalla() {
  return (
    <PantallaPendiente
      titulo="Diagnóstico"
      descripcion="Salud del sistema, informe de almacenamiento y limpieza de registros huérfanos."
      contenido={["Informe de salud documental de las facturas", "Recuento de registros por cada tipo de dato", "Detección y borrado de registros huérfanos o de prueba"]}
    />
  );
}
