/**
 * Funciones de servidor de Análisis (Partes 8 y 9.2): panel de indicadores
 * (F-35 y F-01/F-02/F-03/F-08/F-09/F-11), comparativa (F-36) e informes
 * (F-07/F-37/F-38). Ninguna cifra se persiste: todo se recalcula al leer.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { adminAutorizado, type Admin } from "./admin.server";
import { contextoTesoreria } from "./tesoreria.functions";

const dimensionSchema = z.enum(["categoria", "subcategoria", "proveedor", "metodo", "cuenta"]);
const rangoSchema = z.object({ desde: z.string().min(1), hasta: z.string().min(1) });

async function contextoPagosAnalisis(admin: Admin) {
  const [facturas, vencimientos, movimientos, detalles] = await Promise.all([
    admin
      .from("facturas")
      .select("id, total, tipo_factura, factura_relacionada_id, estado_documental, entorno"),
    admin
      .from("vencimientos")
      .select(
        "id, factura_id, compromiso_fijo_id, fecha, importe, estado, tipo, tipo_vencimiento, entorno",
      ),
    admin.from("movimientos").select("id, importe, entorno"),
    admin.from("conciliacion_detalle").select("vencimiento_id, movimiento_id, importe_aplicado"),
  ]);
  for (const r of [facturas, vencimientos, movimientos, detalles]) {
    if (r.error) throw new Error(r.error.message);
  }
  return {
    facturas: (facturas.data ?? []).map((f) => ({ ...f, total: Number(f.total) })),
    vencimientos: (vencimientos.data ?? []).map((v) => ({ ...v, importe: Number(v.importe) })),
    movimientos: (movimientos.data ?? []).map((m) => ({ ...m, importe: Number(m.importe) })),
    detalles: (detalles.data ?? []).map((d) => ({
      ...d,
      importe_aplicado: Number(d.importe_aplicado),
    })),
  };
}

/** Panel de indicadores completo (Parte 8). Sin filtros de periodo por diseño. */
export const datosDashboard = createServerFn({ method: "GET" }).handler(async () => {
  const admin = await adminAutorizado();
  const {
    hoyISO,
    primerDiaDelMes,
    saldoConsolidado,
    saldoInternoCuenta,
    diferenciasPorCuenta,
    cashFlowOperativo,
    gastoFinanciero,
    previsionTesoreria,
    vencimientosAbiertos,
    pendienteDeVencimiento,
    sumarDias,
  } = await import("./tesoreria");
  const { resumenPagosGlobal, MENSAJE_INCOHERENCIAS } = await import("./conciliacion");

  const [ctx, ctxPagos] = await Promise.all([
    contextoTesoreria(admin),
    contextoPagosAnalisis(admin),
  ]);

  const hoy = hoyISO();
  const desdeMes = primerDiaDelMes(hoy);

  const cuentas = ctx.cuentas.map((c) => ({
    id: c.id,
    nombre: c.nombre,
    entorno: c.entorno,
    saldoApertura: Number(c.saldo_apertura),
    saldoInterno: saldoInternoCuenta(c.id, hoy, ctx),
  }));

  const proximos = vencimientosAbiertos(ctx)
    .filter((v) => v.fecha >= hoy && v.fecha <= sumarDias(hoy, 30))
    .map((v) => ({
      id: v.id,
      fecha: v.fecha,
      tipo: v.tipo,
      clase: v.tipo_vencimiento,
      estado: v.estado,
      factura_id: v.factura_id,
      importe: Number(v.importe),
      pendiente: pendienteDeVencimiento(v, ctx),
      entorno: v.entorno,
    }))
    .sort((a, b) => (a.fecha < b.fecha ? -1 : 1));

  return {
    hoy,
    desdeMes,
    saldoTotal: saldoConsolidado(hoy, ctx),
    cuentas,
    cashFlowMes: cashFlowOperativo(desdeMes, hoy, "categoria", ctx),
    gastoFinancieroMes: gastoFinanciero(desdeMes, hoy, ctx),
    diferencias: diferenciasPorCuenta(ctx, hoy),
    resumenPagos: resumenPagosGlobal(ctxPagos, hoy),
    mensajeIncoherencias: MENSAJE_INCOHERENCIAS,
    proximosVencimientos: proximos,
    previsiones: [30, 60, 90].map((d) => previsionTesoreria(d, ctx, hoy)),
  };
});

/** F-36 · comparativa de dos periodos configurables. */
export const comparativaPeriodos = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        rangoA: rangoSchema,
        rangoB: rangoSchema,
        agruparPor: dimensionSchema.nullable(),
        entorno: z.enum(["produccion", "prueba"]).nullable(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const admin = await adminAutorizado();
    const { compararPeriodos } = await import("./tesoreria");
    const ctx = await contextoTesoreria(admin);
    return compararPeriodos(
      data.rangoA,
      data.rangoB,
      data.agruparPor,
      ctx,
      data.entorno ?? undefined,
    );
  });

/** F-07 + F-38 + F-37 · informes agregados con filtros. */
export const informeMovimientos = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        desde: z.string().nullable(),
        hasta: z.string().nullable(),
        cuentaId: z.string().uuid().nullable(),
        categoriaId: z.string().uuid().nullable(),
        proveedorId: z.string().uuid().nullable(),
        entorno: z.enum(["produccion", "prueba"]).nullable(),
        agruparPor: dimensionSchema,
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const admin = await adminAutorizado();
    const { movimientosFiltrados, agruparImporte, informeVencimientos } = await import(
      "./tesoreria"
    );
    const ctx = await contextoTesoreria(admin);
    const movs = movimientosFiltrados(
      {
        desde: data.desde ?? undefined,
        hasta: data.hasta ?? undefined,
        cuentaId: data.cuentaId ?? undefined,
        categoriaId: data.categoriaId ?? undefined,
        proveedorId: data.proveedorId ?? undefined,
        entorno: data.entorno ?? undefined,
        relacionado: "todos",
      },
      ctx,
    );
    return {
      numMovimientos: movs.length,
      grupos: agruparImporte(movs, data.agruparPor),
      vencimientos: informeVencimientos(ctx),
    };
  });
