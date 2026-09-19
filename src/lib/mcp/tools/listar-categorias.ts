import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseAnon } from "../supabase";

export default defineTool({
  name: "listar_categorias",
  title: "Listar categorías",
  description:
    "Devuelve las categorías y subcategorías (máximo dos niveles) con su tipo Ingreso o Gasto.",
  inputSchema: {
    tipo: z
      .enum(["Ingreso", "Gasto"])
      .nullable()
      .describe("Filtra por tipo. Usa null para ver todos."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ tipo }) => {
    const supabase = supabaseAnon();
    let consulta = supabase
      .from("categorias")
      .select("id, nombre, tipo, categoria_padre_id, entorno")
      .order("nombre");
    if (tipo) consulta = consulta.eq("tipo", tipo);
    const { data, error } = await consulta;
    if (error) throw new ToolError(error.message);
    const categorias = (data ?? []).map((c) => ({
      id: c.id,
      nombre: c.nombre,
      tipo: c.tipo as string,
      categoria_padre_id: c.categoria_padre_id,
      entorno: c.entorno as string,
    }));
    return {
      content: [{ type: "text", text: JSON.stringify(categorias, null, 2) }],
      structuredContent: { categorias },
    };
  },
});
