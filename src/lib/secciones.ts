export type Subruta = { path: string; label: string; listo: boolean };
export type Modulo = {
  id: string;
  label: string;
  path: string;
  descripcion: string;
  hijos: Subruta[];
};

/**
 * Navegación por tareas (Etapa 1 UX).
 * Ninguna ruta existente se elimina: todas siguen accesibles desde su módulo.
 */
export const MODULOS: Modulo[] = [
  {
    id: "inicio",
    label: "Inicio",
    path: "/",
    descripcion: "Estado general y puesta en marcha",
    hijos: [],
  },
  {
    id: "facturas",
    label: "Facturas",
    path: "/facturas",
    descripcion: "Compras, vencimientos y pagos",
    hijos: [
      { path: "/facturas", label: "Todas las facturas", listo: true },
      { path: "/facturas/nueva", label: "Nueva factura", listo: true },
      { path: "/ficha", label: "Ficha de factura", listo: false },
      { path: "/vencimientos", label: "Vencimientos", listo: false },
      { path: "/compromisos", label: "Compromisos fijos", listo: false },
    ],
  },
  {
    id: "tesoreria",
    label: "Tesorería",
    path: "/movimientos",
    descripcion: "Cuentas, movimientos y conciliación",
    hijos: [
      { path: "/movimientos", label: "Movimientos", listo: false },
      { path: "/cuentas", label: "Cuentas", listo: true },
      { path: "/transferencias", label: "Transferencias", listo: false },
      { path: "/snapshots", label: "Saldo bancario", listo: false },
      { path: "/conciliaciones", label: "Conciliación", listo: false },
    ],
  },
  {
    id: "analisis",
    label: "Análisis",
    path: "/dashboard",
    descripcion: "Resultados, comparativas e informes",
    hijos: [
      { path: "/dashboard", label: "Resumen", listo: false },
      { path: "/comparativa", label: "Comparativa", listo: false },
      { path: "/informes", label: "Informes", listo: false },
    ],
  },
  {
    id: "configuracion",
    label: "Configuración",
    path: "/categorias",
    descripcion: "Maestros, trazabilidad y mantenimiento",
    hijos: [
      { path: "/cuentas", label: "Cuentas bancarias", listo: true },
      { path: "/categorias", label: "Categorías", listo: true },
      { path: "/proveedores", label: "Proveedores", listo: true },
      { path: "/compromisos", label: "Compromisos fijos", listo: false },
      { path: "/auditoria", label: "Auditoría", listo: true },
      { path: "/diagnostico", label: "Diagnóstico", listo: false },
      { path: "/backup", label: "Backup / Exportación", listo: false },
      { path: "/validacion", label: "Validación Fase 2", listo: false },
    ],
  },
];

export function moduloDeRuta(ruta: string, contexto?: string) {
  if (ruta === "/") return "inicio";
  const moduloContextual = MODULOS.find(
    (m) => m.id === contexto && m.hijos.some((h) => ruta === h.path || ruta.startsWith(`${h.path}/`)),
  );
  if (moduloContextual) return moduloContextual.id;
  const encontrado = MODULOS.find((m) =>
    m.hijos.some((h) => ruta === h.path || ruta.startsWith(`${h.path}/`)),
  );
  return encontrado?.id ?? "inicio";
}

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
