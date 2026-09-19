import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseAnon } from "../supabase";

export default defineTool({
  name: "listar_cuentas",
  title: "Listar cuentas",
  description:
    "Devuelve las cuentas de tesorería registradas (nombre, tipo, saldo de apertura, fecha y entorno).",
  inputSchema: {
    entorno: z
      .enum(["produccion", "prueba"])
      .nullable()
      .describe("Filtra por entorno. Usa null para ver todos."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ entorno }) => {
    const supabase = supabaseAnon();
    let consulta = supabase
      .from("cuentas")
      .select("id, nombre, tipo, saldo_apertura, fecha_saldo_apertura, activa, entorno")
      .order("nombre");
    if (entorno) consulta = consulta.eq("entorno", entorno);
    const { data, error } = await consulta;
    if (error) throw new ToolError(error.message);
    const cuentas = (data ?? []).map((c) => ({
      id: c.id,
      nombre: c.nombre,
      tipo: c.tipo as string,
      saldo_apertura: Number(c.saldo_apertura),
      fecha_saldo_apertura: c.fecha_saldo_apertura,
      activa: c.activa,
      entorno: c.entorno as string,
    }));
    return {
      content: [{ type: "text", text: JSON.stringify(cuentas, null, 2) }],
      structuredContent: { cuentas },
    };
  },
});
