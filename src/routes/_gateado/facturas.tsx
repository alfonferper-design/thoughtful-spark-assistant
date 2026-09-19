import { createFileRoute } from "@tanstack/react-router";
import { PantallaPendiente } from "@/components/PantallaPendiente";

export const Route = createFileRoute("/facturas")({
  head: () => ({
    meta: [
      { title: "Facturas · Farmatrack" },
      { name: "description", content: "Índice de facturas recibidas." },
      { property: "og:title", content: "Facturas · Farmatrack" },
      { property: "og:description", content: "Índice de facturas recibidas." },
    ],
  }),
  component: Pantalla,
});

function Pantalla() {
  return (
    <PantallaPendiente
      titulo="Facturas"
      descripcion="Índice de facturas recibidas."
      contenido={["Alta de factura con proveedor, fechas e importes", "Aviso de posible factura duplicada", "Estado documental, contable y de pago"]}
    />
  );
}
