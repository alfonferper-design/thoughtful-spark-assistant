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
