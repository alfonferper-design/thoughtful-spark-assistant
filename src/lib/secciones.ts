export const GRUPOS = [
  {
    grupo: "Configuración",
    items: [
      { path: "/", label: "Configuración inicial", listo: true },
      { path: "/diagnostico", label: "Diagnóstico", listo: false },
    ],
  },
  {
    grupo: "Panel de control",
    items: [
      { path: "/dashboard", label: "Dashboard", listo: false },
      { path: "/comparativa", label: "Comparativa", listo: false },
      { path: "/informes", label: "Informes", listo: false },
    ],
  },
  {
    grupo: "Maestros",
    items: [
      { path: "/cuentas", label: "Cuentas", listo: true },
      { path: "/categorias", label: "Categorías", listo: true },
      { path: "/proveedores", label: "Proveedores", listo: true },
    ],
  },
  {
    grupo: "Tesorería",
    items: [
      { path: "/movimientos", label: "Movimientos", listo: false },
      { path: "/transferencias", label: "Transferencias", listo: false },
      { path: "/snapshots", label: "Saldo bancario", listo: false },
      { path: "/conciliaciones", label: "Conciliación", listo: false },
    ],
  },
  {
    grupo: "Facturación",
    items: [
      { path: "/facturas", label: "Facturas", listo: false },
      { path: "/ficha", label: "Ficha de factura", listo: false },
    ],
  },
  {
    grupo: "Compromisos",
    items: [
      { path: "/compromisos", label: "Compromisos fijos", listo: false },
      { path: "/vencimientos", label: "Vencimientos", listo: false },
    ],
  },
  {
    grupo: "Trazabilidad",
    items: [{ path: "/auditoria", label: "Auditoría", listo: true }],
  },
  {
    grupo: "Sistema",
    items: [
      { path: "/backup", label: "Backup / Exportación", listo: false },
      { path: "/validacion", label: "Validación Fase 2", listo: false },
    ],
  },
] as const;

export function normalizarNombre(nombre: string) {
  return nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function formatoEuros(n: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);
}
