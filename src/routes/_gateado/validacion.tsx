import { createFileRoute } from "@tanstack/react-router";
import { PantallaPendiente } from "@/components/PantallaPendiente";

export const Route = createFileRoute("/_gateado/validacion")({
  head: () => ({
    meta: [
      { title: "Validación Fase 2 · Farmatrack" },
      { name: "description", content: "Suite de pruebas internas de los cálculos." },
      { property: "og:title", content: "Validación Fase 2 · Farmatrack" },
      { property: "og:description", content: "Suite de pruebas internas de los cálculos." },
    ],
  }),
  component: Pantalla,
});

function Pantalla() {
  return (
    <PantallaPendiente
      titulo="Validación Fase 2"
      descripcion="Suite de pruebas internas de los cálculos."
      contenido={["Ejecución de la batería de casos de prueba", "Resultado caso por caso", "Bloqueo de la navegación mientras se ejecuta"]}
    />
  );
}
