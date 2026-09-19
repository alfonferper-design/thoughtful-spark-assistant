/**
 * Rectificativas y Abonos (Parte 3.6, RB-009/RB-010/RB-011).
 *
 * - El total se guarda tal cual lo introduce el usuario: no se fuerza el signo.
 * - La relación apunta al PADRE INMEDIATO, no siempre a la original.
 * - `factura_relacionada_id` es inmutable una vez creada (RB-011): no existe
 *   ninguna función que lo cambie.
 * - Anti-ciclo con profundidad máxima 200 antes de escribir.
 * - No se toca ningún vencimiento existente (RB-012).
 * - Doble auditoría: la nueva factura y la factura corregida.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { adminAutorizado, auditar } from "./admin.server";

const actorSchema = z.string().trim().min(1).max(100);

const datosSchema = z.object({
  factura_relacionada_id: z.string().uuid(),
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
  actor: actorSchema,
});

async function altaRelacionada(
  tipo: "Rectificativa" | "Abono",
  data: z.infer<typeof datosSchema>,
) {
  const admin = await adminAutorizado();
  const { validarNuevaRelacionFactura } = await import("./conciliacion");
  const { actor, ...datos } = data;

  const { data: facturas, error: errorFacturas } = await admin
    .from("facturas")
    .select("id, total, tipo_factura, factura_relacionada_id, estado_documental, entorno");
  if (errorFacturas) throw new Error(errorFacturas.message);

  const ctx = {
    facturas: (facturas ?? []).map((f) => ({ ...f, total: Number(f.total) })),
    vencimientos: [],
    movimientos: [],
    detalles: [],
  };

  const validacion = validarNuevaRelacionFactura(tipo, datos.factura_relacionada_id, ctx);
  if (!validacion.ok) throw new Error(validacion.error);

  const padre = ctx.facturas.find((f) => f.id === datos.factura_relacionada_id)!;

  const fila = {
    ...datos,
    fecha_emision: datos.fecha,
    estado: "Recibida",
    base_imponible: null,
    iva: null,
    documento_original: null,
    estado_documental: "Recibida" as const,
    estado_duplicado: "No detectado" as const,
    estado_contable: "Pendiente" as const,
    tipo_factura: tipo,
    desglose_fiscal: [] as never,
    usuario_crea: actor,
    usuario_valida: null,
    fecha_contabilizacion: null,
    // La nueva factura hereda el entorno de la factura que corrige.
    entorno: padre.entorno,
  };

  const { data: creada, error } = await admin.from("facturas").insert(fila).select().single();
  if (error) throw new Error(error.message);

  await auditar(admin, {
    entidad: "Factura",
    entidadId: creada.id,
    accion: tipo === "Rectificativa" ? "crear_rectificativa" : "crear_abono",
    actor,
    despues: fila,
  });
  await auditar(admin, {
    entidad: "Factura",
    entidadId: padre.id,
    accion: tipo === "Rectificativa" ? "rectificativa_asociada" : "abono_asociado",
    actor,
    despues: { factura_relacionada: creada.id, tipo_factura: tipo, total: datos.total },
  });

  return creada;
}

export const crearRectificativaFactura = createServerFn({ method: "POST" })
  .inputValidator((data) => datosSchema.parse(data))
  .handler(async ({ data }) => altaRelacionada("Rectificativa", data));

export const crearAbonoFactura = createServerFn({ method: "POST" })
  .inputValidator((data) => datosSchema.parse(data))
  .handler(async ({ data }) => altaRelacionada("Abono", data));

/** Panel de relacionados de la Ficha: original + toda su descendencia. */
export const familiaFactura = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ facturaId: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const admin = await adminAutorizado();
    const { familiaDocumentalFactura, posicionNetaFactura } = await import("./conciliacion");
    const { data: facturas, error } = await admin
      .from("facturas")
      .select(
        "id, total, tipo_factura, factura_relacionada_id, estado_documental, entorno, numero_factura, fecha, proveedor_id",
      );
    if (error) throw new Error(error.message);
    const filas = (facturas ?? []).map((f) => ({ ...f, total: Number(f.total) }));
    const ctx = { facturas: filas, vencimientos: [], movimientos: [], detalles: [] };
    const familia = familiaDocumentalFactura(data.facturaId, ctx);
    const detalle = (id: string) => filas.find((f) => f.id === id) ?? null;
    return {
      cicloDetectado: familia.cicloDetectado,
      original: familia.original ? detalle(familia.original.id) : null,
      ajustes: familia.ajustes.map((a) => detalle(a.id)).filter((a) => a !== null),
      posicionNeta: posicionNetaFactura(data.facturaId, ctx),
    };
  });
