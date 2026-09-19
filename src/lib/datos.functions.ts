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

// ---------- Factura ----------

const estadoDocumentalSchema = z.enum([
  "Recibida",
  "En revisión",
  "Validada",
  "Incidencia",
  "Anulada",
]);
const estadoContableSchema = z.enum(["Pendiente", "Contabilizada", "Revisada"]);

export const listarFacturas = createServerFn({ method: "GET" }).handler(async () => {
  const admin = await adminAutorizado();
  const { data, error } = await admin
    .from("facturas")
    .select("*")
    .order("fecha", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
});

/**
 * Alta de factura Normal (Parte 3.1). Valores por defecto literales del
 * documento: estado_documental 'Recibida', estado_duplicado 'No detectado'
 * (sin ninguna detección automática: Parte 3.2 está NO DEFINIDA),
 * estado_contable 'Pendiente', moneda 'EUR', tipo_factura 'Normal',
 * factura_relacionada_id null, desglose_fiscal [].
 */
export const crearFacturaNormal = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        proveedor_id: z.string().uuid(),
        fecha: z.string().min(1),
        fecha_recepcion: z.string().min(1).nullable(),
        fecha_vencimiento: z.string().min(1).nullable(),
        numero_factura: z.string().nullable(),
        total: z.number(),
        naturaleza: z.string().nullable(),
        categoria_id: z.string().uuid().nullable(),
        moneda: z.string().min(1),
        forma_pago: z.string().nullable(),
        condiciones_pago: z.string().nullable(),
        observaciones: z.string().nullable(),
        entorno: entornoSchema,
        actor: actorSchema,
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const admin = await adminAutorizado();
    const { actor, ...datos } = data;
    const fila = {
      ...datos,
      // fecha_emision duplica fecha en el alta, igual que el artefacto original
      fecha_emision: datos.fecha,
      // Campos legacy conservados tal cual
      estado: "Recibida",
      base_imponible: null,
      iva: null,
      documento_original: null,
      estado_documental: "Recibida" as const,
      estado_duplicado: "No detectado" as const,
      estado_contable: "Pendiente" as const,
      tipo_factura: "Normal" as const,
      factura_relacionada_id: null,
      desglose_fiscal: [] as never,
      usuario_crea: actor,
      usuario_valida: null,
      fecha_contabilizacion: null,
    };
    const { data: creada, error } = await admin.from("facturas").insert(fila).select().single();
    if (error) throw new Error(error.message);
    await auditar(admin, {
      entidad: "Factura",
      entidadId: creada.id,
      accion: "crear",
      actor,
      despues: fila,
    });
    return creada;
  });

async function leerFactura(admin: Admin, id: string) {
  const { data, error } = await admin.from("facturas").select("*").eq("id", id).single();
  if (error) throw new Error(error.message);
  return data;
}

export const cambiarEstadoDocumentalFactura = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({ id: z.string().uuid(), estado: estadoDocumentalSchema, actor: actorSchema })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const admin = await adminAutorizado();
    const antes = await leerFactura(admin, data.id);
    const cambios: Record<string, unknown> = { estado_documental: data.estado };
    if (data.estado === "Validada") cambios["usuario_valida"] = data.actor;
    const { error } = await admin.from("facturas").update(cambios as never).eq("id", data.id);
    if (error) throw new Error(error.message);
    await auditar(admin, {
      entidad: "Factura",
      entidadId: data.id,
      accion: "cambiar_estado_documental",
      actor: data.actor,
      antes: { estado_documental: antes.estado_documental, usuario_valida: antes.usuario_valida },
      despues: cambios,
    });
    return { ok: true as const };
  });

export const cambiarEstadoContableFactura = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({ id: z.string().uuid(), estado: estadoContableSchema, actor: actorSchema })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const admin = await adminAutorizado();
    const antes = await leerFactura(admin, data.id);
    const cambios: Record<string, unknown> = { estado_contable: data.estado };
    if (data.estado === "Contabilizada") {
      cambios["fecha_contabilizacion"] =
        antes.fecha_contabilizacion || new Date().toISOString();
    }
    const { error } = await admin.from("facturas").update(cambios as never).eq("id", data.id);
    if (error) throw new Error(error.message);
    await auditar(admin, {
      entidad: "Factura",
      entidadId: data.id,
      accion: "cambiar_estado_contable",
      actor: data.actor,
      antes: {
        estado_contable: antes.estado_contable,
        fecha_contabilizacion: antes.fecha_contabilizacion,
      },
      despues: cambios,
    });
    return { ok: true as const };
  });

/**
 * Cambio manual de estado_duplicado (Parte 3.3). El original no tiene función
 * centralizada — era código repetido en dos botones. Aquí sí es una función con
 * nombre propio, autorizada expresamente, y replica los mismos efectos y
 * acciones de auditoría: 'resolver_duplicado_confirmado' y 'resolver_no_duplicado'.
 * No existe detección automática (Parte 3.2, NO DEFINIDO).
 */
export const resolverDuplicadoFactura = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        id: z.string().uuid(),
        resolucion: z.enum(["Duplicado confirmado", "Falso positivo", "Posible duplicado"]),
        actor: actorSchema,
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const admin = await adminAutorizado();
    const antes = await leerFactura(admin, data.id);
    const legacy =
      data.resolucion === "Duplicado confirmado"
        ? "Duplicado confirmado"
        : data.resolucion === "Posible duplicado"
          ? "Posible duplicado"
          : "Recibida";
    const cambios = {
      estado: legacy,
      estado_duplicado: data.resolucion,
      resuelto_por: data.actor,
      fecha_resolucion: new Date().toISOString(),
    };
    const { error } = await admin.from("facturas").update(cambios as never).eq("id", data.id);
    if (error) throw new Error(error.message);
    const accion =
      data.resolucion === "Duplicado confirmado"
        ? "resolver_duplicado_confirmado"
        : data.resolucion === "Posible duplicado"
          ? "marcar_posible_duplicado"
          : "resolver_no_duplicado";
    await auditar(admin, {
      entidad: "Factura",
      entidadId: data.id,
      accion,
      actor: data.actor,
      antes: {
        estado: antes.estado,
        estado_duplicado: antes.estado_duplicado,
        resuelto_por: antes.resuelto_por,
        fecha_resolucion: antes.fecha_resolucion,
      },
      despues: cambios,
    });
    return { ok: true as const };
  });
