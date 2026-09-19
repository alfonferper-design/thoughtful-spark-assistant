/**
 * Funciones de servidor de Tesorería: saldo bancario (snapshots, F-03),
 * transferencias (F-12, RB-003), sugerencias de conciliación (F-13, solo
 * sugiere), previsión (F-11) e importación de movimientos desde hoja de cálculo
 * (ampliación explícita del usuario, con vista previa obligatoria).
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { adminAutorizado, auditar, type Admin } from "./admin.server";
import { DEFAULT_CONFIG_CONCILIACION, type ContextoTesoreria } from "./tesoreria";

const entornoSchema = z.enum(["produccion", "prueba"]);
const actorSchema = z.string().trim().min(1).max(100);
const CLAVE_CONFIG_CONCILIACION = "conciliacion";

export async function contextoTesoreria(admin: Admin): Promise<ContextoTesoreria> {
  const [cuentas, movimientos, snapshots, vencimientos, detalles] = await Promise.all([
    admin.from("cuentas").select("*").order("nombre"),
    admin.from("movimientos").select("*"),
    admin.from("snapshots").select("*"),
    admin.from("vencimientos").select("*"),
    admin.from("conciliacion_detalle").select("vencimiento_id, movimiento_id, importe_aplicado"),
  ]);
  for (const r of [cuentas, movimientos, snapshots, vencimientos, detalles]) {
    if (r.error) throw new Error(r.error.message);
  }
  return {
    cuentas: (cuentas.data ?? []).map((c) => ({ ...c, saldo_apertura: Number(c.saldo_apertura) })),
    movimientos: (movimientos.data ?? []).map((m) => ({ ...m, importe: Number(m.importe) })),
    snapshots: (snapshots.data ?? []).map((s) => ({
      ...s,
      saldo_comunicado_banco: Number(s.saldo_comunicado_banco),
    })),
    vencimientos: (vencimientos.data ?? []).map((v) => ({ ...v, importe: Number(v.importe) })),
    detalles: (detalles.data ?? []).map((d) => ({
      ...d,
      importe_aplicado: Number(d.importe_aplicado),
    })),
  };
}

// ---------- Saldo bancario (snapshots) ----------

export const listarSnapshots = createServerFn({ method: "GET" }).handler(async () => {
  const admin = await adminAutorizado();
  const { data, error } = await admin
    .from("snapshots")
    .select("*")
    .order("fecha", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((s) => ({ ...s, saldo_comunicado_banco: Number(s.saldo_comunicado_banco) }));
});

export const crearSnapshot = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        cuenta_id: z.string().uuid(),
        fecha: z.string().min(1),
        saldo_comunicado_banco: z.number(),
        actor: actorSchema,
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const admin = await adminAutorizado();
    const { actor, ...datos } = data;
    if (!Number.isFinite(datos.saldo_comunicado_banco)) {
      throw new Error("El saldo comunicado por el banco debe ser un número.");
    }
    const { data: cuenta, error: errorCuenta } = await admin
      .from("cuentas")
      .select("id, entorno")
      .eq("id", datos.cuenta_id)
      .maybeSingle();
    if (errorCuenta) throw new Error(errorCuenta.message);
    if (!cuenta) throw new Error("Cuenta no encontrada.");

    const fila = { ...datos, origen: "Manual" as const, entorno: cuenta.entorno };
    const { data: creado, error } = await admin.from("snapshots").insert(fila).select().single();
    if (error) throw new Error(error.message);
    await auditar(admin, {
      entidad: "SnapshotSaldoBancario",
      entidadId: creado.id,
      accion: "crear",
      actor,
      despues: fila,
    });
    return creado;
  });

/** F-03 · diferencias por cuenta con evidencia temporal real (racha). */
export const diferenciasCuentas = createServerFn({ method: "GET" }).handler(async () => {
  const admin = await adminAutorizado();
  const { diferenciasPorCuenta } = await import("./tesoreria");
  return diferenciasPorCuenta(await contextoTesoreria(admin));
});

// ---------- Transferencias (F-12, RB-003) ----------

export const listarTransferencias = createServerFn({ method: "GET" }).handler(async () => {
  const admin = await adminAutorizado();
  const { data, error } = await admin
    .from("transferencias")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  const ids = [
    ...new Set((data ?? []).flatMap((t) => [t.movimiento_origen_id, t.movimiento_destino_id])),
  ];
  if (ids.length === 0) return [];
  const { data: movs, error: errorMovs } = await admin
    .from("movimientos")
    .select("id, fecha, importe, estado, direccion")
    .in("id", ids);
  if (errorMovs) throw new Error(errorMovs.message);
  const porId = new Map((movs ?? []).map((m) => [m.id, m]));
  return (data ?? []).map((t) => {
    const salida = porId.get(t.movimiento_origen_id);
    return {
      ...t,
      fecha: salida?.fecha ?? null,
      importe: salida ? Number(salida.importe) : null,
      estado: salida?.estado ?? null,
    };
  });
});

/**
 * RB-003 / Regla 6: los movimientos de tipo 'Transferencia interna' SOLO se
 * crean aquí, nunca desde el alta general de movimientos. La operación es
 * atómica en la base de datos y deja tres entradas de auditoría (corrige el
 * hallazgo H-04 del artefacto original, que no auditaba las transferencias).
 */
export const crearTransferencia = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        cuenta_origen_id: z.string().uuid(),
        cuenta_destino_id: z.string().uuid(),
        fecha: z.string().min(1),
        importe: z.number(),
        estado: z.enum(["Previsto", "Pendiente", "Confirmado"]),
        entorno: entornoSchema,
        actor: actorSchema,
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const admin = await adminAutorizado();
    if (data.cuenta_origen_id === data.cuenta_destino_id) {
      throw new Error("La cuenta de origen y la de destino no pueden ser la misma.");
    }
    const { data: resultado, error } = await admin.rpc("crear_transferencia", {
      p_cuenta_origen: data.cuenta_origen_id,
      p_cuenta_destino: data.cuenta_destino_id,
      p_fecha: data.fecha,
      p_importe: Math.abs(data.importe),
      p_estado: data.estado,
      p_entorno: data.entorno,
      p_actor: data.actor,
    } as never);
    if (error) throw new Error(error.message);
    return resultado as unknown as {
      transferencia_id: string;
      movimiento_origen_id: string;
      movimiento_destino_id: string;
      importe: number;
    };
  });

// ---------- Configuración de conciliación y F-13 ----------

const configSchema = z.object({
  diasAlta: z.number().int().min(0).max(365),
  diasMedia: z.number().int().min(0).max(365),
  confianzaAlta: z.number().min(0).max(100),
  confianzaMedia: z.number().min(0).max(100),
  confianzaBaja: z.number().min(0).max(100),
});

export const obtenerConfigConciliacion = createServerFn({ method: "GET" }).handler(async () => {
  const admin = await adminAutorizado();
  const { data, error } = await admin
    .from("configuracion")
    .select("valor")
    .eq("clave", CLAVE_CONFIG_CONCILIACION)
    .maybeSingle();
  if (error) throw new Error(error.message);
  const parseado = configSchema.safeParse(data?.valor);
  return parseado.success ? parseado.data : DEFAULT_CONFIG_CONCILIACION;
});

export const guardarConfigConciliacion = createServerFn({ method: "POST" })
  .inputValidator((data) => configSchema.extend({ actor: actorSchema }).parse(data))
  .handler(async ({ data }) => {
    const admin = await adminAutorizado();
    const { actor, ...valor } = data;
    if (valor.diasAlta > valor.diasMedia) {
      throw new Error("El margen de días de confianza alta no puede ser mayor que el de media.");
    }
    const { error } = await admin
      .from("configuracion")
      .upsert(
        {
          clave: CLAVE_CONFIG_CONCILIACION,
          valor: valor as never,
          actualizado_en: new Date().toISOString(),
        },
        { onConflict: "clave" },
      );
    if (error) throw new Error(error.message);
    await auditar(admin, {
      entidad: "Configuracion",
      entidadId: CLAVE_CONFIG_CONCILIACION,
      accion: "guardar_config_conciliacion",
      actor,
      despues: valor,
    });
    return valor;
  });

/** F-13 · solo sugiere: nunca registra ni aplica ninguna conciliación. */
export const sugerenciasConciliacion = createServerFn({ method: "GET" }).handler(async () => {
  const admin = await adminAutorizado();
  const { sugerirConciliaciones } = await import("./tesoreria");
  const [ctx, config] = await Promise.all([
    contextoTesoreria(admin),
    admin
      .from("configuracion")
      .select("valor")
      .eq("clave", CLAVE_CONFIG_CONCILIACION)
      .maybeSingle(),
  ]);
  const parseado = configSchema.safeParse(config.data?.valor);
  const usada = parseado.success ? parseado.data : DEFAULT_CONFIG_CONCILIACION;
  return { config: usada, sugerencias: sugerirConciliaciones(ctx, usada).slice(0, 200) };
});

/** F-11 · previsión de tesorería a N días. */
export const prevision = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ dias: z.number().int().min(1).max(365) }).parse(data))
  .handler(async ({ data }) => {
    const admin = await adminAutorizado();
    const { previsionTesoreria } = await import("./tesoreria");
    return previsionTesoreria(data.dias, await contextoTesoreria(admin));
  });

// ---------- Importación de movimientos (ampliación del usuario) ----------

export const vistaPreviaImportacion = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({ texto: z.string().min(1), cuentaPorDefectoId: z.string().uuid().nullable() })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const admin = await adminAutorizado();
    const { prepararVistaPrevia } = await import("./importacion");
    const { data: cuentas, error } = await admin.from("cuentas").select("id, nombre");
    if (error) throw new Error(error.message);
    return prepararVistaPrevia(data.texto, cuentas ?? [], data.cuentaPorDefectoId);
  });

/**
 * Confirmación de la importación. Cada fila pasa por `altaMovimiento()`, la
 * MISMA función central validada que el alta manual, con origen 'Importado'.
 * Las filas que fallan se devuelven con su error: no se interrumpe el resto.
 */
export const importarMovimientos = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        filas: z
          .array(
            z.object({
              linea: z.number().int(),
              cuenta_id: z.string().uuid(),
              fecha: z.string().min(1),
              importe: z.number(),
              tipo: z.enum(["Ingreso", "Gasto", "Financiación"]),
              metodo_cobro_pago: z
                .enum(["TPV", "Bizum", "Efectivo", "Transferencia"])
                .nullable(),
            }),
          )
          .min(1)
          .max(1000),
        estado: z.enum(["Previsto", "Pendiente", "Confirmado"]),
        relacionado_con_farmacia: z.boolean(),
        entorno: entornoSchema,
        actor: actorSchema,
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const admin = await adminAutorizado();
    const { altaMovimiento } = await import("./movimientos.server");
    const creados: string[] = [];
    const fallidas: { linea: number; error: string }[] = [];

    for (const fila of data.filas) {
      try {
        const creado = await altaMovimiento(
          admin,
          {
            cuenta_id: fila.cuenta_id,
            fecha: fila.fecha,
            importe: fila.importe,
            tipo: fila.tipo,
            subtipo_financiacion: null,
            categoria_id: null,
            subcategoria_id: null,
            proveedor_id: null,
            metodo_cobro_pago: fila.metodo_cobro_pago,
            estado: data.estado,
            relacionado_con_farmacia: data.relacionado_con_farmacia,
            entorno: data.entorno,
          },
          "Importado",
          data.actor,
        );
        creados.push(creado.id);
      } catch (error) {
        fallidas.push({ linea: fila.linea, error: (error as Error).message });
      }
    }

    await auditar(admin, {
      entidad: "Movimiento",
      entidadId: null,
      accion: "importar_hoja",
      actor: data.actor,
      despues: {
        filas_recibidas: data.filas.length,
        creados: creados.length,
        fallidas: fallidas.length,
        entorno: data.entorno,
      },
    });

    return { creados: creados.length, fallidas };
  });
