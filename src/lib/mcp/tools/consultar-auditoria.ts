import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseAnon } from "../supabase";

export default defineTool({
  name: "consultar_auditoria",
  title: "Consultar auditoría",
  description: "Devuelve los últimos movimientos registrados en el histórico de auditoría.",
  inputSchema: {
    limite: z
      .number()
      .int()
      .min(1)
      .max(100)
      .describe("Número máximo de registros a devolver (1-100)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limite }) => {
    const supabase = supabaseAnon();
    const { data, error } = await supabase
      .from("auditoria")
      .select("id, fecha, actor, accion, entidad, entidad_id")
      .order("fecha", { ascending: false })
      .limit(limite);
    if (error) throw new ToolError(error.message);
    const registros = (data ?? []).map((r) => ({
      id: r.id,
      fecha: r.fecha,
      actor: r.actor,
      accion: r.accion,
      entidad: r.entidad,
      entidad_id: r.entidad_id,
    }));
    return {
      content: [{ type: "text", text: JSON.stringify(registros, null, 2) }],
      structuredContent: { registros },
    };
  },
});
