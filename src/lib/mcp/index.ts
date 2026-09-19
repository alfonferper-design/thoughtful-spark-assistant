import { defineMcp } from "@lovable.dev/mcp-js";
import listarCuentas from "./tools/listar-cuentas";
import listarCategorias from "./tools/listar-categorias";
import listarProveedores from "./tools/listar-proveedores";
import consultarAuditoria from "./tools/consultar-auditoria";

export default defineMcp({
  name: "companion-ai",
  title: "Companion AI",
  version: "0.1.0",
  instructions:
    "Herramientas de consulta de la aplicación financiera de farmacia: cuentas de tesorería, categorías de ingreso y gasto, proveedores y el histórico de auditoría. Solo lectura.",
  tools: [listarCuentas, listarCategorias, listarProveedores, consultarAuditoria],
});
