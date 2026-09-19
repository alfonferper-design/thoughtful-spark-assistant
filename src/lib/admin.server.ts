/**
 * Acceso privilegiado compartido por todas las funciones de servidor nuevas.
 * Mismo patrón que `datos.functions.ts`: primero se exige la sesión desbloqueada
 * con la clave de la aplicación y solo después se usa el cliente privilegiado.
 * Este módulo nunca llega al navegador (sufijo `.server`).
 */
export async function adminAutorizado() {
  const { requireDesbloqueado } = await import("./gate.server");
  await requireDesbloqueado();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export type Admin = Awaited<ReturnType<typeof adminAutorizado>>;

/** Una entrada de auditoría por escritura, sin excepciones. */
export async function auditar(
  admin: Admin,
  p: {
    entidad: string;
    entidadId: string | null;
    accion: string;
    actor: string;
    antes?: unknown;
    despues?: unknown;
  },
) {
  await admin.from("auditoria").insert({
    entidad: p.entidad,
    entidad_id: p.entidadId,
    accion: p.accion,
    actor: p.actor,
    antes: (p.antes ?? null) as never,
    despues: (p.despues ?? null) as never,
  });
}
