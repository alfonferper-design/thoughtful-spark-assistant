import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseAnon } from "../supabase";

export default defineTool({
  name: "listar_proveedores",
  title: "Listar proveedores",
  description:
    "Devuelve los proveedores registrados con su tipo, contacto y condiciones de pago.",
  inputSchema: {
    busqueda: z
      .string()
      .trim()
      .nullable()
      .describe("Texto para filtrar por nombre. Usa null para ver todos."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ busqueda }) => {
    const supabase = supabaseAnon();
    let consulta = supabase
      .from("proveedores")
      .select(
        "id, nombre_visible, nombre_normalizado, tipo, cif, email, telefono, condiciones_pago, activo, entorno",
      )
      .order("nombre_visible");
    if (busqueda) consulta = consulta.ilike("nombre_visible", `%${busqueda}%`);
    const { data, error } = await consulta;
    if (error) throw new ToolError(error.message);
    const proveedores = (data ?? []).map((p) => ({
      id: p.id,
      nombre_visible: p.nombre_visible,
      nombre_normalizado: p.nombre_normalizado,
      tipo: p.tipo as string,
      cif: p.cif,
      email: p.email,
      telefono: p.telefono,
      condiciones_pago: p.condiciones_pago,
      activo: p.activo,
      entorno: p.entorno as string,
    }));
    return {
      content: [{ type: "text", text: JSON.stringify(proveedores, null, 2) }],
      structuredContent: { proveedores },
    };
  },
});
