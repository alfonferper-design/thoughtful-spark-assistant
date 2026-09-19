import { createFileRoute } from "@tanstack/react-router";
import { PantallaPendiente } from "@/components/PantallaPendiente";

export const Route = createFileRoute("/_gateado/snapshots")({
  head: () => ({
    meta: [
      { title: "Saldo bancario · Farmatrack" },
      { name: "description", content: "Saldos reales comunicados por el banco." },
      { property: "og:title", content: "Saldo bancario · Farmatrack" },
      { property: "og:description", content: "Saldos reales comunicados por el banco." },
    ],
  }),
  component: Pantalla,
});

function Pantalla() {
  return (
    <PantallaPendiente
      titulo="Saldo bancario"
      descripcion="Saldos reales comunicados por el banco."
      contenido={["Alta del saldo real de una cuenta en una fecha", "Diferencia entre el saldo del banco y el saldo interno", "Histórico por cuenta"]}
    />
  );
}
