import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Toda lectura y escritura de datos pasa por aquí: primero se exige la sesión
// desbloqueada con la clave de la aplicación y después se usa el cliente
// privilegiado (las tablas ya no tienen acceso directo anónimo).
async function adminAutorizado() {
  const { requireDesbloqueado } = await import("./gate.server");
  await requireDesbloqueado();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

type Admin = Awaited<ReturnType<typeof adminAutorizado>>;

async function auditar(
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

const entornoSchema = z.enum(["produccion", "prueba"]);
const actorSchema = z.string().trim().min(1).max(100);

// ---------- Lecturas ----------

export const listarCuentas = createServerFn({ method: "GET" }).handler(async () => {
  const admin = await adminAutorizado();
  const { data, error } = await admin.from("cuentas").select("*").order("nombre");
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const listarCategorias = createServerFn({ method: "GET" }).handler(async () => {
  const admin = await adminAutorizado();
  const { data, error } = await admin.from("categorias").select("*").order("nombre");
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const listarProveedores = createServerFn({ method: "GET" }).handler(async () => {
  const admin = await adminAutorizado();
  const { data, error } = await admin.from("proveedores").select("*").order("nombre_visible");
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const listarAuditoria = createServerFn({ method: "GET" }).handler(async () => {
  const admin = await adminAutorizado();
  const { data, error } = await admin
    .from("auditoria")
    .select("*")
    .order("fecha", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
});

// ---------- Actor (configuración) ----------

export const obtenerActor = createServerFn({ method: "GET" }).handler(async () => {
  const admin = await adminAutorizado();
  const { data, error } = await admin
    .from("configuracion")
    .select("valor")
    .eq("clave", "actor")
    .maybeSingle();
  if (error) throw new Error(error.message);
  const valor = (data?.valor ?? {}) as { nombre?: string };
  return valor.nombre ?? "Alfonso";
});

export const guardarActor = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ nombre: actorSchema }).parse(data))
  .handler(async ({ data }) => {
    const admin = await adminAutorizado();
    const { error } = await admin
      .from("configuracion")
      .upsert({ clave: "actor", valor: { nombre: data.nombre }, actualizado_en: new Date().toISOString() });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

// ---------- Altas ----------

export const crearCuenta = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        nombre: z.string().trim().min(1),
        tipo: z.enum(["Cuenta corriente", "Línea de crédito", "Cuenta de inversión"]),
        saldo_apertura: z.number(),
        fecha_saldo_apertura: z.string().min(1),
        entorno: entornoSchema,
        actor: actorSchema,
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const admin = await adminAutorizado();
    const { actor, ...datos } = data;
    const { data: fila, error } = await admin
      .from("cuentas")
      .insert({ ...datos, activa: true })
      .select()
      .single();
    if (error) throw new Error(error.message);
    await auditar(admin, {
      entidad: "Cuenta",
      entidadId: fila.id,
      accion: "crear",
      actor,
      despues: datos,
    });
    return fila;
  });

export const crearCategoria = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        nombre: z.string().trim().min(1),
        tipo: z.enum(["Ingreso", "Gasto"]),
        categoria_padre_id: z.string().uuid().nullable(),
        entorno: entornoSchema,
        actor: actorSchema,
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const admin = await adminAutorizado();
    const { actor, ...datos } = data;
    const { data: fila, error } = await admin
      .from("categorias")
      .insert(datos)
      .select()
      .single();
    if (error) throw new Error(error.message);
    await auditar(admin, {
      entidad: "Categoria",
      entidadId: fila.id,
      accion: "crear",
      actor,
      despues: datos,
    });
    return fila;
  });

export const crearProveedor = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        nombre_visible: z.string().trim().min(1),
        nombre_normalizado: z.string().trim().min(1),
        tipo: z.enum(["Cooperativa", "Mayorista", "Laboratorio", "Servicio"]),
        cif: z.string().nullable(),
        telefono: z.string().nullable(),
        email: z.string().nullable(),
        direccion: z.string().nullable(),
        condiciones_pago: z.string().nullable(),
        categoria_defecto_id: z.string().uuid().nullable(),
        entorno: entornoSchema,
        actor: actorSchema,
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const admin = await adminAutorizado();
    const { actor, ...datos } = data;
    const { data: fila, error } = await admin
      .from("proveedores")
      .insert({ ...datos, activo: true })
      .select()
      .single();
    if (error) throw new Error(error.message);
    await auditar(admin, {
      entidad: "Proveedor",
      entidadId: fila.id,
      accion: "crear",
      actor,
      despues: datos,
    });
    return fila;
  });
