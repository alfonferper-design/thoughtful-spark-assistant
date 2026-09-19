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

// ---------- FacturaLinea (Partes 2.7 y 3.7) ----------

const descuentoTipoSchema = z.enum(["Porcentual", "Absoluto"]).nullable();

const camposLineaSchema = z.object({
  descripcion: z.string().nullable().optional(),
  codigo_producto: z.string().nullable().optional(),
  referencia_proveedor: z.string().nullable().optional(),
  cantidad: z.number().nullable().optional(),
  precio_unitario: z.number().nullable().optional(),
  descuento_tipo: descuentoTipoSchema.optional(),
  descuento_valor: z.number().nullable().optional(),
  tipo_impuesto: z.string().nullable().optional(),
  nombre_impuesto: z.string().nullable().optional(),
  tipo_impositivo: z.number().nullable().optional(),
  base_imponible: z.number().nullable().optional(),
  cuota_impuesto: z.number().nullable().optional(),
  total: z.number().nullable().optional(),
  observaciones: z.string().nullable().optional(),
});

export const obtenerFactura = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const admin = await adminAutorizado();
    return await leerFactura(admin, data.id);
  });

/** lineasDeFactura(facturaId, ctx, incluirEliminadas=false) — Parte 3.7. */
export const listarLineasFactura = createServerFn({ method: "GET" })
  .inputValidator((data) =>
    z
      .object({ facturaId: z.string().uuid(), incluirEliminadas: z.boolean().optional() })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const admin = await adminAutorizado();
    let consulta = admin
      .from("factura_lineas")
      .select("*")
      .eq("factura_id", data.facturaId)
      .order("orden");
    if (!data.incluirEliminadas) consulta = consulta.eq("estado_linea", "Activa");
    const { data: filas, error } = await consulta;
    if (error) throw new Error(error.message);
    return filas ?? [];
  });

async function leerLinea(admin: Admin, id: string) {
  const { data, error } = await admin.from("factura_lineas").select("*").eq("id", id).single();
  if (error) throw new Error(error.message);
  return data;
}

function numeroOnull(v: unknown): number | null {
  return v === null || v === undefined ? null : Number(v);
}

/** crearLineaFactura — orden autoasignado, origen_importes según Parte 3.7. */
export const crearLineaFactura = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    camposLineaSchema
      .extend({ facturaId: z.string().uuid(), actor: actorSchema })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { calcularLineaFactura } = await import("./lineas-factura");
    const admin = await adminAutorizado();
    const factura = await leerFactura(admin, data.facturaId);
    const { facturaId, actor, ...datos } = data;

    const { data: ultimas, error: errorOrden } = await admin
      .from("factura_lineas")
      .select("orden")
      .eq("factura_id", facturaId)
      .order("orden", { ascending: false })
      .limit(1);
    if (errorOrden) throw new Error(errorOrden.message);
    const orden = (ultimas?.[0]?.orden ?? 0) + 1;

    const traeImportes =
      datos.base_imponible != null || datos.cuota_impuesto != null || datos.total != null;
    const calculada = calcularLineaFactura({
      cantidad: datos.cantidad ?? null,
      precio_unitario: datos.precio_unitario ?? null,
      descuento_tipo: datos.descuento_tipo ?? null,
      descuento_valor: datos.descuento_valor ?? null,
      tipo_impositivo: datos.tipo_impositivo ?? null,
      base_imponible: datos.base_imponible ?? null,
      cuota_impuesto: datos.cuota_impuesto ?? null,
      total: datos.total ?? null,
    });

    const fila = {
      factura_id: facturaId,
      orden,
      descripcion: datos.descripcion ?? null,
      codigo_producto: datos.codigo_producto ?? null,
      referencia_proveedor: datos.referencia_proveedor ?? null,
      cantidad: datos.cantidad ?? null,
      precio_unitario: datos.precio_unitario ?? null,
      descuento_tipo: datos.descuento_tipo ?? null,
      descuento_valor: datos.descuento_valor ?? null,
      tipo_impuesto: datos.tipo_impuesto ?? null,
      nombre_impuesto: datos.nombre_impuesto ?? datos.tipo_impuesto ?? null,
      tipo_impositivo: datos.tipo_impositivo ?? null,
      base_imponible: calculada.base_imponible,
      cuota_impuesto: calculada.cuota_impuesto,
      total: calculada.total,
      origen_importes: (traeImportes ? "documento" : "formula") as "documento" | "formula",
      observaciones: datos.observaciones ?? null,
      estado_linea: "Activa" as const,
      // La línea hereda el entorno de su factura y no se edita.
      entorno: factura.entorno,
    };

    const { data: creada, error } = await admin
      .from("factura_lineas")
      .insert(fila)
      .select()
      .single();
    if (error) throw new Error(error.message);
    await auditar(admin, {
      entidad: "FacturaLinea",
      entidadId: creada.id,
      accion: "crear_linea_factura",
      actor,
      despues: fila,
    });
    return creada;
  });

/**
 * actualizarLineaFactura — tres ramas mutuamente excluyentes (Parte 3.7):
 * importes directos → se respetan ('documento'); campos de fórmula → recálculo
 * íntegro desde cero ('formula'); ninguno de los dos → importes intactos.
 */
export const actualizarLineaFactura = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        id: z.string().uuid(),
        cambios: camposLineaSchema,
        actor: actorSchema,
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { calcularLineaFactura, CAMPOS_FORMULA_LINEA, CAMPOS_IMPORTE_LINEA } = await import(
      "./lineas-factura"
    );
    const admin = await adminAutorizado();
    const antes = await leerLinea(admin, data.id);
    const cambios = data.cambios as Record<string, unknown>;

    const tocaImportes = CAMPOS_IMPORTE_LINEA.some((c) => c in cambios);
    const tocaFormula = CAMPOS_FORMULA_LINEA.some((c) => c in cambios);

    const actualizacion: Record<string, unknown> = {
      ...cambios,
      updated_at: new Date().toISOString(),
    };

    if (tocaImportes) {
      actualizacion["origen_importes"] = "documento";
    } else if (tocaFormula) {
      const base = {
        cantidad: "cantidad" in cambios ? numeroOnull(cambios["cantidad"]) : numeroOnull(antes.cantidad),
        precio_unitario:
          "precio_unitario" in cambios
            ? numeroOnull(cambios["precio_unitario"])
            : numeroOnull(antes.precio_unitario),
        descuento_tipo: ("descuento_tipo" in cambios
          ? cambios["descuento_tipo"]
          : antes.descuento_tipo) as "Porcentual" | "Absoluto" | null,
        descuento_valor:
          "descuento_valor" in cambios
            ? numeroOnull(cambios["descuento_valor"])
            : numeroOnull(antes.descuento_valor),
        tipo_impositivo:
          "tipo_impositivo" in cambios
            ? numeroOnull(cambios["tipo_impositivo"])
            : numeroOnull(antes.tipo_impositivo),
        // Recálculo desde cero: nunca se arrastra un importe caducado.
        base_imponible: null,
        cuota_impuesto: null,
        total: null,
      };
      const calculada = calcularLineaFactura(base);
      actualizacion["base_imponible"] = calculada.base_imponible;
      actualizacion["cuota_impuesto"] = calculada.cuota_impuesto;
      actualizacion["total"] = calculada.total;
      actualizacion["origen_importes"] = "formula";
    }

    if ("tipo_impuesto" in cambios && !("nombre_impuesto" in cambios)) {
      actualizacion["nombre_impuesto"] = cambios["tipo_impuesto"] ?? null;
    }

    const { error } = await admin
      .from("factura_lineas")
      .update(actualizacion as never)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    await auditar(admin, {
      entidad: "FacturaLinea",
      entidadId: data.id,
      accion: "modificar_linea_factura",
      actor: data.actor,
      antes,
      despues: actualizacion,
    });
    return { ok: true as const, rama: tocaImportes ? "documento" : tocaFormula ? "formula" : "sin_importes" };
  });

/** recalcularImportesLineaFactura — fuerza el recálculo íntegro descartando importes manuales. */
export const recalcularImportesLineaFactura = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ id: z.string().uuid(), actor: actorSchema }).parse(data))
  .handler(async ({ data }) => {
    const { calcularLineaFactura } = await import("./lineas-factura");
    const admin = await adminAutorizado();
    const antes = await leerLinea(admin, data.id);
    const calculada = calcularLineaFactura({
      cantidad: numeroOnull(antes.cantidad),
      precio_unitario: numeroOnull(antes.precio_unitario),
      descuento_tipo: antes.descuento_tipo,
      descuento_valor: numeroOnull(antes.descuento_valor),
      tipo_impositivo: numeroOnull(antes.tipo_impositivo),
      base_imponible: null,
      cuota_impuesto: null,
      total: null,
    });
    const cambios = {
      base_imponible: calculada.base_imponible,
      cuota_impuesto: calculada.cuota_impuesto,
      total: calculada.total,
      origen_importes: "formula" as const,
      updated_at: new Date().toISOString(),
    };
    const { error } = await admin
      .from("factura_lineas")
      .update(cambios as never)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    await auditar(admin, {
      entidad: "FacturaLinea",
      entidadId: data.id,
      accion: "modificar_linea_factura",
      actor: data.actor,
      antes: {
        base_imponible: antes.base_imponible,
        cuota_impuesto: antes.cuota_impuesto,
        total: antes.total,
        origen_importes: antes.origen_importes,
      },
      despues: cambios,
    });
    return { ok: true as const };
  });

/** eliminarLogicamenteLineaFactura — baja lógica únicamente (RB-018). */
export const eliminarLogicamenteLineaFactura = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ id: z.string().uuid(), actor: actorSchema }).parse(data))
  .handler(async ({ data }) => {
    const admin = await adminAutorizado();
    const antes = await leerLinea(admin, data.id);
    const cambios = { estado_linea: "Eliminada" as const, updated_at: new Date().toISOString() };
    const { error } = await admin
      .from("factura_lineas")
      .update(cambios as never)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    await auditar(admin, {
      entidad: "FacturaLinea",
      entidadId: data.id,
      accion: "eliminar_logico_linea_factura",
      actor: data.actor,
      antes: { estado_linea: antes.estado_linea },
      despues: cambios,
    });
    return { ok: true as const };
  });

/**
 * reordenarLineasFactura — reasigna orden 1,2,3… según el array de ids.
 * Una única entrada de auditoría, sobre la entidad Factura (Parte 2.7).
 */
export const reordenarLineasFactura = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        facturaId: z.string().uuid(),
        ordenIds: z.array(z.string().uuid()).min(1),
        actor: actorSchema,
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const admin = await adminAutorizado();
    const { data: antes, error: errorLectura } = await admin
      .from("factura_lineas")
      .select("id, orden")
      .eq("factura_id", data.facturaId)
      .eq("estado_linea", "Activa")
      .order("orden");
    if (errorLectura) throw new Error(errorLectura.message);

    let orden = 1;
    for (const id of data.ordenIds) {
      const { error } = await admin
        .from("factura_lineas")
        .update({ orden, updated_at: new Date().toISOString() } as never)
        .eq("id", id)
        .eq("factura_id", data.facturaId);
      if (error) throw new Error(error.message);
      orden += 1;
    }

    await auditar(admin, {
      entidad: "Factura",
      entidadId: data.facturaId,
      accion: "reordenar_lineas_factura",
      actor: data.actor,
      antes: { orden: antes ?? [] },
      despues: { orden: data.ordenIds.map((id, i) => ({ id, orden: i + 1 })) },
    });
    return { ok: true as const };
  });

// ---------- Documento adjunto de una factura (Partes 2.13 y 3.8) ----------

const BUCKET_DOCUMENTOS = "documentos-facturas";

/** documentosDeFactura(facturaId) — activo primero, luego sustituidos. */
export const listarDocumentosFactura = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ facturaId: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const admin = await adminAutorizado();
    const { data: filas, error } = await admin
      .from("documentos")
      .select("*")
      .eq("factura_id", data.facturaId)
      .order("fecha_incorporacion", { ascending: false });
    if (error) throw new Error(error.message);
    return filas ?? [];
  });

/**
 * Enlace temporal (60 segundos) para ver o descargar el archivo. El bucket es
 * privado: no existe ninguna URL pública ni permanente.
 */
export const enlaceDocumento = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const admin = await adminAutorizado();
    const { data: doc, error } = await admin
      .from("documentos")
      .select("referencia_almacenamiento, nombre_original")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);
    const { data: firmado, error: errorFirma } = await admin.storage
      .from(BUCKET_DOCUMENTOS)
      .createSignedUrl(doc.referencia_almacenamiento, 60);
    if (errorFirma || !firmado) {
      throw new Error(errorFirma?.message ?? "No se pudo generar el enlace temporal");
    }
    return { url: firmado.signedUrl, nombre: doc.nombre_original };
  });

/**
 * subirDocumentoFactura — Parte 3.8. Validaciones en el orden exacto del
 * documento (tipo permitido → archivo no vacío → máximo 10 MB) y resultado
 * determinado por el hash SHA-256: 'sin_cambios', 'duplicado_detectado',
 * 'sustituido' o 'asociado'. Nunca se borra nada: el documento anterior pasa a
 * 'Sustituido'. facturas.documento_original se deja siempre en null (Parte 2.6:
 * campo sin uso real, sustituido por la entidad Documento).
 */
export const subirDocumentoFactura = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        facturaId: z.string().uuid(),
        nombre: z.string().trim().min(1),
        tipoMime: z.string().trim().min(1),
        contenidoBase64: z.string(),
        forzarDuplicado: z.boolean().optional(),
        actor: actorSchema,
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const {
      TIPOS_DOC_PERMITIDOS,
      MAX_DOC_BYTES,
      MENSAJE_TIPO_NO_PERMITIDO,
      MENSAJE_ARCHIVO_VACIO,
      MENSAJE_DEMASIADO_GRANDE,
      extensionDeTipo,
    } = await import("./documentos");
    const { createHash } = await import("node:crypto");

    // 1) Tipo de archivo permitido
    if (!TIPOS_DOC_PERMITIDOS[data.tipoMime]) throw new Error(MENSAJE_TIPO_NO_PERMITIDO);

    const bytes = Buffer.from(data.contenidoBase64, "base64");
    // 2) Archivo no vacío
    if (bytes.byteLength === 0) throw new Error(MENSAJE_ARCHIVO_VACIO);
    // 3) Máximo 10 MB
    if (bytes.byteLength > MAX_DOC_BYTES) throw new Error(MENSAJE_DEMASIADO_GRANDE);

    const admin = await adminAutorizado();
    const factura = await leerFactura(admin, data.facturaId);
    const hash = createHash("sha256").update(bytes).digest("hex");
    const forzar = data.forzarDuplicado === true;

    const { data: mismoHash, error: errorHash } = await admin
      .from("documentos")
      .select("*")
      .eq("hash_sha256", hash);
    if (errorHash) throw new Error(errorHash.message);
    const coincidencias = mismoHash ?? [];

    // Mismo archivo, misma factura, ya activo: nada que hacer ni que auditar.
    const yaActivoAqui = coincidencias.find(
      (d) => d.factura_id === data.facturaId && d.estado_documento === "Activo",
    );
    if (yaActivoAqui) {
      return { resultado: "sin_cambios" as const, documentoId: yaActivoAqui.id };
    }

    if (coincidencias.length > 0 && !forzar) {
      await auditar(admin, {
        entidad: "Documento",
        entidadId: null,
        accion: "detectar_documento_duplicado",
        actor: data.actor,
        despues: {
          factura_id: data.facturaId,
          hash_sha256: hash,
          facturas_con_ese_hash: coincidencias.map((d) => d.factura_id),
        },
      });
      return {
        resultado: "duplicado_detectado" as const,
        hash,
        facturasConEseHash: coincidencias.map((d) => d.factura_id),
      };
    }

    // Se reutiliza el archivo físico si el hash ya estaba almacenado.
    const reutilizaArchivo = coincidencias.length > 0;
    let referencia = coincidencias[0]?.referencia_almacenamiento ?? "";
    if (!reutilizaArchivo) {
      referencia = `facturas/${data.facturaId}/${hash}.${extensionDeTipo(data.tipoMime)}`;
      const { error: errorSubida } = await admin.storage
        .from(BUCKET_DOCUMENTOS)
        .upload(referencia, bytes, { contentType: data.tipoMime, upsert: true });
      if (errorSubida) throw new Error(errorSubida.message);
    }

    const { data: activoPrevio, error: errorPrevio } = await admin
      .from("documentos")
      .select("*")
      .eq("factura_id", data.facturaId)
      .eq("estado_documento", "Activo")
      .maybeSingle();
    if (errorPrevio) throw new Error(errorPrevio.message);

    if (activoPrevio) {
      const { error } = await admin
        .from("documentos")
        .update({
          estado_documento: "Sustituido",
          updated_at: new Date().toISOString(),
        } as never)
        .eq("id", activoPrevio.id);
      if (error) throw new Error(error.message);
    }

    const fila = {
      factura_id: data.facturaId,
      nombre_original: data.nombre,
      tipo_mime: data.tipoMime,
      tamano_bytes: bytes.byteLength,
      hash_sha256: hash,
      actor: data.actor,
      referencia_almacenamiento: referencia,
      estado_documento: "Activo" as const,
      // El documento hereda el entorno de su factura.
      entorno: factura.entorno,
    };
    const { data: creado, error: errorInsert } = await admin
      .from("documentos")
      .insert(fila)
      .select()
      .single();
    if (errorInsert) throw new Error(errorInsert.message);

    const resultado = activoPrevio ? ("sustituido" as const) : ("asociado" as const);

    await auditar(admin, {
      entidad: "Documento",
      entidadId: creado.id,
      accion: activoPrevio ? "sustituir_documento" : "subir_documento",
      actor: data.actor,
      antes: activoPrevio
        ? {
            id: activoPrevio.id,
            nombre_original: activoPrevio.nombre_original,
            hash_sha256: activoPrevio.hash_sha256,
            estado_documento: activoPrevio.estado_documento,
          }
        : undefined,
      despues: { ...fila, reutiliza_archivo: reutilizaArchivo },
    });

    if (activoPrevio) {
      await auditar(admin, {
        entidad: "Documento",
        entidadId: activoPrevio.id,
        accion: "documento_sustituido",
        actor: data.actor,
        antes: { estado_documento: "Activo" },
        despues: { estado_documento: "Sustituido", sustituido_por: creado.id },
      });
    } else {
      await auditar(admin, {
        entidad: "Factura",
        entidadId: data.facturaId,
        accion: "documento_asociado",
        actor: data.actor,
        despues: { documento_id: creado.id, hash_sha256: hash },
      });
    }

    if (reutilizaArchivo) {
      await auditar(admin, {
        entidad: "Documento",
        entidadId: creado.id,
        accion: "duplicado_confirmado_reutilizado",
        actor: data.actor,
        despues: { hash_sha256: hash, referencia_almacenamiento: referencia },
      });
    }

    return { resultado, documentoId: creado.id, reutilizaArchivo };
  });

// ---------- Movimiento (Parte 2.5) ----------

export const listarMovimientos = createServerFn({ method: "GET" }).handler(async () => {
  const admin = await adminAutorizado();
  const { data, error } = await admin
    .from("movimientos")
    .select("*")
    .order("fecha", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
});

/**
 * Saldos por cuenta: saldo de apertura guardado + saldo interno calculado (F-01).
 * El saldo interno nunca se guarda; se deriva siempre de los movimientos en
 * estado Confirmado o Conciliado entre fecha_saldo_apertura y la fecha pedida.
 */
export const saldosInternosCuentas = createServerFn({ method: "GET" }).handler(async () => {
  const admin = await adminAutorizado();
  const { saldoInterno } = await import("./movimientos");
  const [cuentas, movimientos] = await Promise.all([
    admin.from("cuentas").select("*").order("nombre"),
    admin
      .from("movimientos")
      .select("cuenta_id, fecha, importe, tipo, subtipo_financiacion, direccion, estado"),
  ]);
  if (cuentas.error) throw new Error(cuentas.error.message);
  if (movimientos.error) throw new Error(movimientos.error.message);
  const hoy = new Date().toISOString().slice(0, 10);
  const filas = movimientos.data ?? [];
  return (cuentas.data ?? []).map((c) => ({
    cuenta_id: c.id,
    fecha_calculo: hoy,
    saldo_interno: saldoInterno(
      { saldo_apertura: Number(c.saldo_apertura), fecha_saldo_apertura: c.fecha_saldo_apertura },
      filas
        .filter((m) => m.cuenta_id === c.id)
        .map((m) => ({
          importe: Number(m.importe),
          tipo: m.tipo,
          subtipo_financiacion: m.subtipo_financiacion,
          direccion: m.direccion,
          estado: m.estado,
          fecha: m.fecha,
        })),
      hoy,
    ),
  }));
});

/**
 * F-14 · sugerirCategoriaProveedor: devuelve la categoría por defecto del
 * proveedor, o null.
 */
export const sugerirCategoriaProveedor = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ proveedorId: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const admin = await adminAutorizado();
    const { data: fila, error } = await admin
      .from("proveedores")
      .select("categoria_defecto_id")
      .eq("id", data.proveedorId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return fila?.categoria_defecto_id ?? null;
  });

/**
 * Función central de alta de movimiento. El documento señala como AMBIGUO que
 * el original validara la Regla 1 solo en el onsubmit del formulario; aquí la
 * validación vive en el servidor, antes de escribir.
 *
 * - RB-001 (Regla 1): Financiación exige subtipo_financiacion.
 * - RB-002: el importe se guarda siempre en positivo (valor absoluto); el signo
 *   nunca se guarda, lo deriva signoMovimiento() (F-00).
 * - RB-003 (Regla 6): nunca se crea aquí un movimiento de 'Transferencia interna'.
 * - origen siempre 'Manual'; 'Conciliado' no es asignable desde aquí.
 * - clasificacion_origen se decide en el servidor comparando la categoría
 *   elegida con la categoria_defecto_id del proveedor (F-14).
 */
export const crearMovimientoValidado = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        cuenta_id: z.string().uuid(),
        fecha: z.string().min(1),
        importe: z.number(),
        tipo: z.enum(["Ingreso", "Gasto", "Financiación"]),
        subtipo_financiacion: z
          .enum(["Principal recibido", "Principal devuelto", "Intereses", "Comisiones"])
          .nullable(),
        categoria_id: z.string().uuid().nullable(),
        subcategoria_id: z.string().uuid().nullable(),
        proveedor_id: z.string().uuid().nullable(),
        metodo_cobro_pago: z.enum(["TPV", "Bizum", "Efectivo", "Transferencia"]).nullable(),
        estado: z.enum(["Previsto", "Pendiente", "Confirmado"]),
        relacionado_con_farmacia: z.boolean(),
        entorno: entornoSchema,
        actor: actorSchema,
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const admin = await adminAutorizado();
    const { MENSAJE_REGLA_1 } = await import("./movimientos");
    const { actor, ...entrada } = data;

    // RB-001 (Regla 1)
    if (entrada.tipo === "Financiación" && !entrada.subtipo_financiacion) {
      throw new Error(MENSAJE_REGLA_1);
    }
    const esFinanciacion = entrada.tipo === "Financiación";
    const subtipo = esFinanciacion ? entrada.subtipo_financiacion : null;
    const metodo = esFinanciacion ? null : entrada.metodo_cobro_pago;

    // RB-002: el importe se guarda siempre positivo; cero y negativo se rechazan.
    const importe = Math.abs(entrada.importe);
    if (!Number.isFinite(importe) || importe <= 0) {
      throw new Error("El importe debe ser mayor que cero (el signo lo determina el tipo).");
    }

    // La subcategoría debe ser hija de la categoría elegida.
    let subcategoriaId = entrada.subcategoria_id;
    if (subcategoriaId) {
      if (!entrada.categoria_id) {
        throw new Error("No se puede indicar una subcategoría sin categoría.");
      }
      const { data: sub, error: errorSub } = await admin
        .from("categorias")
        .select("categoria_padre_id")
        .eq("id", subcategoriaId)
        .maybeSingle();
      if (errorSub) throw new Error(errorSub.message);
      if (!sub || sub.categoria_padre_id !== entrada.categoria_id) {
        throw new Error("La subcategoría elegida no pertenece a la categoría indicada.");
      }
    }
    if (!entrada.categoria_id) subcategoriaId = null;

    // clasificacion_origen (F-14): automática solo si coincide con la categoría
    // por defecto del proveedor; manual si el usuario la cambió; null sin categoría.
    let clasificacion: "automatica" | "manual" | null = null;
    if (entrada.categoria_id) {
      clasificacion = "manual";
      if (entrada.proveedor_id) {
        const { data: prov, error: errorProv } = await admin
          .from("proveedores")
          .select("categoria_defecto_id")
          .eq("id", entrada.proveedor_id)
          .maybeSingle();
        if (errorProv) throw new Error(errorProv.message);
        if (prov?.categoria_defecto_id && prov.categoria_defecto_id === entrada.categoria_id) {
          clasificacion = "automatica";
        }
      }
    }

    const fila = {
      cuenta_id: entrada.cuenta_id,
      fecha: entrada.fecha,
      importe,
      tipo: entrada.tipo,
      subtipo_financiacion: subtipo,
      direccion: null,
      categoria_id: entrada.categoria_id,
      subcategoria_id: subcategoriaId,
      proveedor_id: entrada.proveedor_id,
      metodo_cobro_pago: metodo,
      estado: entrada.estado,
      origen: "Manual" as const,
      relacionado_con_farmacia: entrada.relacionado_con_farmacia,
      clasificacion_origen: clasificacion,
      entorno: entrada.entorno,
    };

    const { data: creado, error } = await admin
      .from("movimientos")
      .insert(fila)
      .select()
      .single();
    if (error) throw new Error(error.message);

    await auditar(admin, {
      entidad: "Movimiento",
      entidadId: creado.id,
      accion: "crear",
      actor,
      despues: fila,
    });

    return creado;
  });
