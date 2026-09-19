/**
 * Motores de tesorería y análisis (Parte 4 del documento) — núcleo puro, sin
 * acceso a datos. Todas las funciones reciben un contexto en memoria.
 *
 * F-02 saldoConsolidado · F-03 diferenciasPorCuenta · F-07 movimientosFiltrados
 * F-08 cashFlowOperativo · F-09 gastoFinanciero · F-11 previsionTesoreria
 * F-13 sugerirConciliaciones · F-36 variacion/compararPeriodos
 * F-37 informeVencimientos · F-38 agruparImporte
 *
 * El único margen monetario admitido es TOLERANCIA_REDONDEO_EUR (RB-016).
 */
import { TOLERANCIA_REDONDEO_EUR, redondearEuros } from "./dinero";
import {
  ESTADOS_QUE_SUMAN_AL_SALDO,
  saldoInterno,
  signoMovimiento,
  type EstadoMovimiento,
} from "./movimientos";

export type CuentaTesoreria = {
  id: string;
  nombre: string;
  saldo_apertura: number;
  fecha_saldo_apertura: string;
  entorno: string;
};

export type MovimientoTesoreria = {
  id: string;
  cuenta_id: string;
  fecha: string;
  importe: number;
  tipo: string;
  subtipo_financiacion: string | null;
  direccion: string | null;
  categoria_id: string | null;
  subcategoria_id: string | null;
  proveedor_id: string | null;
  metodo_cobro_pago: string | null;
  estado: string;
  relacionado_con_farmacia: boolean;
  entorno: string;
};

export type SnapshotTesoreria = {
  id: string;
  cuenta_id: string;
  fecha: string;
  saldo_comunicado_banco: number;
  origen: string;
  entorno: string;
};

export type VencimientoTesoreria = {
  id: string;
  factura_id: string | null;
  compromiso_fijo_id: string | null;
  fecha: string;
  importe: number;
  estado: string;
  tipo: string;
  tipo_vencimiento: string;
  entorno: string;
};

export type DetalleTesoreria = {
  vencimiento_id: string;
  movimiento_id: string;
  importe_aplicado: number;
};

export type ContextoTesoreria = {
  cuentas: CuentaTesoreria[];
  movimientos: MovimientoTesoreria[];
  snapshots: SnapshotTesoreria[];
  vencimientos: VencimientoTesoreria[];
  detalles: DetalleTesoreria[];
};

// ---------- utilidades de calendario ----------

export function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

export function sumarDias(fechaISO: string, dias: number) {
  const d = new Date(`${fechaISO}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

export function diasEntre(desdeISO: string, hastaISO: string) {
  const a = Date.parse(`${desdeISO}T00:00:00Z`);
  const b = Date.parse(`${hastaISO}T00:00:00Z`);
  return Math.round((b - a) / 86_400_000);
}

export function primerDiaDelMes(fechaISO = hoyISO()) {
  return `${fechaISO.slice(0, 7)}-01`;
}

// ---------- F-01/F-02 ----------

/** F-02 · saldoConsolidado: Σ saldoInterno de todas las cuentas (null cuenta como 0). */
export function saldoConsolidado(fechaISO: string, ctx: ContextoTesoreria) {
  return ctx.cuentas.reduce(
    (suma, c) =>
      suma +
      saldoInterno(
        { saldo_apertura: Number(c.saldo_apertura), fecha_saldo_apertura: c.fecha_saldo_apertura },
        ctx.movimientos
          .filter((m) => m.cuenta_id === c.id)
          .map((m) => ({ ...m, importe: Number(m.importe), estado: m.estado as EstadoMovimiento })),
        fechaISO,
      ),
    0,
  );
}

export function saldoInternoCuenta(cuentaId: string, fechaISO: string, ctx: ContextoTesoreria) {
  const c = ctx.cuentas.find((x) => x.id === cuentaId);
  if (!c) return null;
  return saldoInterno(
    { saldo_apertura: Number(c.saldo_apertura), fecha_saldo_apertura: c.fecha_saldo_apertura },
    ctx.movimientos
      .filter((m) => m.cuenta_id === c.id)
      .map((m) => ({ ...m, importe: Number(m.importe), estado: m.estado as EstadoMovimiento })),
    fechaISO,
  );
}

// ---------- F-03 ----------

export const ESTADOS_DIFERENCIA = [
  "Sin snapshot",
  "Cuadrada",
  "Informativa",
  "Requiere revisión",
] as const;
export type EstadoDiferencia = (typeof ESTADOS_DIFERENCIA)[number];

export type DiferenciaCuenta = {
  cuenta: CuentaTesoreria;
  ultimo: SnapshotTesoreria | null;
  diferencia: number | null;
  estado: EstadoDiferencia;
  /** Días de racha de descuadre confirmada (evidencia real), no antigüedad. */
  diasConfirmados: number | null;
  /** Días transcurridos desde el último snapshot hasta hoy (solo informativo). */
  diasSinConfirmar: number | null;
  inicioEvidencia: string | null;
};

/**
 * F-03 · diferenciasPorCuenta. La gravedad se clasifica por EVIDENCIA TEMPORAL
 * REAL (racha de snapshots consecutivos descuadrados), nunca por el número de
 * snapshots ni por el tiempo transcurrido desde el último hasta hoy.
 */
export function diferenciasPorCuenta(
  ctx: ContextoTesoreria,
  fechaReferencia = hoyISO(),
): DiferenciaCuenta[] {
  return ctx.cuentas.map((cuenta) => {
    const propios = ctx.snapshots
      .filter((s) => s.cuenta_id === cuenta.id)
      .slice()
      .sort((a, b) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0));

    if (propios.length === 0) {
      return {
        cuenta,
        ultimo: null,
        diferencia: null,
        estado: "Sin snapshot" as const,
        diasConfirmados: null,
        diasSinConfirmar: null,
        inicioEvidencia: null,
      };
    }

    const conDiferencia = propios.map((s) => ({
      snapshot: s,
      diferencia: redondearEuros(
        Number(s.saldo_comunicado_banco) - (saldoInternoCuenta(cuenta.id, s.fecha, ctx) ?? 0),
      ),
    }));

    const ultimo = conDiferencia[conDiferencia.length - 1]!;
    const diasSinConfirmar = diasEntre(ultimo.snapshot.fecha, fechaReferencia);

    if (ultimo.diferencia === 0) {
      return {
        cuenta,
        ultimo: ultimo.snapshot,
        diferencia: 0,
        estado: "Cuadrada" as const,
        diasConfirmados: 0,
        diasSinConfirmar,
        inicioEvidencia: ultimo.snapshot.fecha,
      };
    }

    // Se retrocede mientras el snapshot anterior también esté descuadrado.
    let i = conDiferencia.length - 1;
    while (i > 0 && conDiferencia[i - 1]!.diferencia !== 0) i -= 1;
    const inicio = conDiferencia[i]!.snapshot;
    const diasConfirmados = diasEntre(inicio.fecha, ultimo.snapshot.fecha);

    return {
      cuenta,
      ultimo: ultimo.snapshot,
      diferencia: ultimo.diferencia,
      estado: (diasConfirmados > 7 ? "Requiere revisión" : "Informativa") as EstadoDiferencia,
      diasConfirmados,
      diasSinConfirmar,
      inicioEvidencia: inicio.fecha,
    };
  });
}

// ---------- F-07 ----------

export type FiltrosMovimientos = {
  tipos?: string[];
  desde?: string;
  hasta?: string;
  cuentaId?: string;
  categoriaId?: string;
  proveedorId?: string;
  metodo?: string;
  relacionado?: boolean | "todos";
  entorno?: string;
};

/**
 * F-07 · movimientosFiltrados: única fuente de filtrado reutilizada por cash
 * flow, informes y comparativa. Solo movimientos Confirmado o Conciliado.
 */
export function movimientosFiltrados(filtros: FiltrosMovimientos, ctx: ContextoTesoreria) {
  return ctx.movimientos.filter((m) => {
    if (!ESTADOS_QUE_SUMAN_AL_SALDO.includes(m.estado as EstadoMovimiento)) return false;
    if (filtros.tipos && !filtros.tipos.includes(m.tipo)) return false;
    if (filtros.desde && m.fecha < filtros.desde) return false;
    if (filtros.hasta && m.fecha > filtros.hasta) return false;
    if (filtros.cuentaId && m.cuenta_id !== filtros.cuentaId) return false;
    if (filtros.categoriaId && m.categoria_id !== filtros.categoriaId) return false;
    if (filtros.proveedorId && m.proveedor_id !== filtros.proveedorId) return false;
    if (filtros.metodo && m.metodo_cobro_pago !== filtros.metodo) return false;
    if (filtros.entorno && m.entorno !== filtros.entorno) return false;
    if (filtros.relacionado !== undefined && filtros.relacionado !== "todos") {
      if (m.relacionado_con_farmacia !== filtros.relacionado) return false;
    }
    return true;
  });
}

// ---------- F-08 ----------

export type DimensionAgrupacion = "categoria" | "subcategoria" | "proveedor" | "metodo" | "cuenta";

export type CashFlow = {
  desde: string;
  hasta: string;
  ingresos: number;
  gastos: number;
  neto: number;
  desglose: { clave: string | null; ingresos: number; gastos: number; neto: number }[] | null;
};

function claveDimension(m: MovimientoTesoreria, dimension: DimensionAgrupacion) {
  if (dimension === "categoria") return m.categoria_id;
  if (dimension === "subcategoria") return m.subcategoria_id;
  if (dimension === "proveedor") return m.proveedor_id;
  if (dimension === "metodo") return m.metodo_cobro_pago;
  return m.cuenta_id;
}

/**
 * F-08 · cashFlowOperativo. Excluye transferencias internas, principal de
 * financiación y movimientos ajenos a la farmacia (relacionado = true).
 */
export function cashFlowOperativo(
  desde: string,
  hasta: string,
  agruparPor: DimensionAgrupacion | null,
  ctx: ContextoTesoreria,
  entorno?: string,
): CashFlow {
  const movs = movimientosFiltrados(
    { desde, hasta, tipos: ["Ingreso", "Gasto"], relacionado: true, entorno },
    ctx,
  );
  const ingresos = movs
    .filter((m) => m.tipo === "Ingreso")
    .reduce((s, m) => s + Math.abs(Number(m.importe)), 0);
  const gastos = movs
    .filter((m) => m.tipo === "Gasto")
    .reduce((s, m) => s + Math.abs(Number(m.importe)), 0);

  let desglose: CashFlow["desglose"] = null;
  if (agruparPor) {
    const mapa = new Map<string | null, { ingresos: number; gastos: number }>();
    for (const m of movs) {
      const clave = claveDimension(m, agruparPor);
      const acumulado = mapa.get(clave) ?? { ingresos: 0, gastos: 0 };
      if (m.tipo === "Ingreso") acumulado.ingresos += Math.abs(Number(m.importe));
      else acumulado.gastos += Math.abs(Number(m.importe));
      mapa.set(clave, acumulado);
    }
    desglose = [...mapa.entries()].map(([clave, v]) => ({
      clave,
      ingresos: redondearEuros(v.ingresos),
      gastos: redondearEuros(v.gastos),
      neto: redondearEuros(v.ingresos - v.gastos),
    }));
  }

  return {
    desde,
    hasta,
    ingresos: redondearEuros(ingresos),
    gastos: redondearEuros(gastos),
    neto: redondearEuros(ingresos - gastos),
    desglose,
  };
}

// ---------- F-09 ----------

/**
 * F-09 · gastoFinanciero: separa intereses y comisiones. El principal de deuda
 * NO aparece aquí — es devolución de capital, no gasto financiero real.
 */
export function gastoFinanciero(
  desde: string,
  hasta: string,
  ctx: ContextoTesoreria,
  entorno?: string,
) {
  const movs = movimientosFiltrados(
    { desde, hasta, tipos: ["Financiación"], relacionado: "todos", entorno },
    ctx,
  ).filter(
    (m) =>
      m.subtipo_financiacion === "Intereses" || m.subtipo_financiacion === "Comisiones",
  );
  const intereses = movs
    .filter((m) => m.subtipo_financiacion === "Intereses")
    .reduce((s, m) => s + Math.abs(Number(m.importe)), 0);
  const comisiones = movs
    .filter((m) => m.subtipo_financiacion === "Comisiones")
    .reduce((s, m) => s + Math.abs(Number(m.importe)), 0);
  return {
    desde,
    hasta,
    intereses: redondearEuros(intereses),
    comisiones: redondearEuros(comisiones),
    total: redondearEuros(intereses + comisiones),
  };
}

// ---------- vencimientos abiertos y F-10 sobre el contexto de tesorería ----------

export function conciliadoDeVencimiento(vencimientoId: string, ctx: ContextoTesoreria) {
  return redondearEuros(
    ctx.detalles
      .filter((d) => d.vencimiento_id === vencimientoId)
      .reduce((s, d) => s + Number(d.importe_aplicado), 0),
  );
}

export function aplicadoDeMovimiento(movimientoId: string, ctx: ContextoTesoreria) {
  return redondearEuros(
    ctx.detalles
      .filter((d) => d.movimiento_id === movimientoId)
      .reduce((s, d) => s + Number(d.importe_aplicado), 0),
  );
}

export function vencimientosAbiertos(ctx: ContextoTesoreria) {
  return ctx.vencimientos.filter((v) => v.estado === "Previsto" || v.estado === "Pendiente");
}

export function pendienteDeVencimiento(v: VencimientoTesoreria, ctx: ContextoTesoreria) {
  return redondearEuros(Math.max(0, Number(v.importe) - conciliadoDeVencimiento(v.id, ctx)));
}

// ---------- F-11 ----------

/**
 * F-11 · previsionTesoreria. El límite inferior incluye HOY de forma
 * deliberada: un vencimiento con fecha de hoy sigue sin cobrarse/pagarse.
 */
export function previsionTesoreria(dias: number, ctx: ContextoTesoreria, hoy = hoyISO()) {
  const hasta = sumarDias(hoy, dias);
  const saldoActual = redondearEuros(saldoConsolidado(hoy, ctx));
  const abiertos = vencimientosAbiertos(ctx).filter((v) => v.fecha >= hoy && v.fecha <= hasta);
  const pagosPrevistos = redondearEuros(
    abiertos
      .filter((v) => v.tipo_vencimiento === "Pago")
      .reduce((s, v) => s + pendienteDeVencimiento(v, ctx), 0),
  );
  const cobrosPrevistos = redondearEuros(
    abiertos
      .filter((v) => v.tipo_vencimiento === "Cobro")
      .reduce((s, v) => s + pendienteDeVencimiento(v, ctx), 0),
  );
  return {
    dias,
    hasta,
    saldoActual,
    cobrosPrevistos,
    pagosPrevistos,
    previsto: redondearEuros(saldoActual + cobrosPrevistos - pagosPrevistos),
    numVencimientos: abiertos.length,
  };
}

// ---------- F-13 ----------

export type ConfigConciliacion = {
  diasAlta: number;
  diasMedia: number;
  confianzaAlta: number;
  confianzaMedia: number;
  confianzaBaja: number;
};

/** Valor por defecto literal del documento (2.15). Editable por el usuario. */
export const DEFAULT_CONFIG_CONCILIACION: ConfigConciliacion = {
  diasAlta: 5,
  diasMedia: 15,
  confianzaAlta: 95,
  confianzaMedia: 60,
  confianzaBaja: 40,
};

export type SugerenciaConciliacion = {
  vencimiento_id: string;
  movimiento_id: string;
  fechaVencimiento: string;
  fechaMovimiento: string;
  diasDiferencia: number;
  pendienteVencimiento: number;
  disponibleMovimiento: number;
  importeSugerido: number;
  coincideImporte: boolean;
  tipoSugerido: "Exacta" | "Parcial";
  confianza: number;
  explicacion: string;
};

/**
 * F-13 · sugerirConciliaciones. SOLO sugiere y explica: nunca aplica nada.
 * Los umbrales vienen de `config/conciliacion` y son editables por el usuario —
 * no son una regla financiera fija del sistema. El cuerpo exacto de la
 * puntuación no está transcrito en el documento: aquí se emparejan vencimientos
 * abiertos con movimientos Confirmado del mismo entorno y dirección económica
 * compatible, y la confianza se decide por cercanía de fecha e igualdad de
 * importe dentro de TOLERANCIA_REDONDEO_EUR.
 */
export function sugerirConciliaciones(
  ctx: ContextoTesoreria,
  config: ConfigConciliacion = DEFAULT_CONFIG_CONCILIACION,
): SugerenciaConciliacion[] {
  const sugerencias: SugerenciaConciliacion[] = [];

  const candidatos = ctx.movimientos
    .filter((m) => m.estado === "Confirmado")
    .map((m) => ({
      movimiento: m,
      disponible: redondearEuros(Math.abs(Number(m.importe)) - aplicadoDeMovimiento(m.id, ctx)),
      signo: signoMovimiento({
        tipo: m.tipo,
        subtipo_financiacion: m.subtipo_financiacion,
        direccion: m.direccion,
      }),
    }))
    .filter((c) => c.disponible > TOLERANCIA_REDONDEO_EUR);

  for (const v of vencimientosAbiertos(ctx)) {
    const pendiente = pendienteDeVencimiento(v, ctx);
    if (pendiente <= TOLERANCIA_REDONDEO_EUR) continue;

    for (const c of candidatos) {
      if (c.movimiento.entorno !== v.entorno) continue;
      // Un pago se salda con una salida de dinero; un cobro, con una entrada.
      const signoEsperado = v.tipo_vencimiento === "Pago" ? -1 : 1;
      if (c.signo !== signoEsperado) continue;

      const diasDiferencia = Math.abs(diasEntre(v.fecha, c.movimiento.fecha));
      const coincideImporte = Math.abs(c.disponible - pendiente) <= TOLERANCIA_REDONDEO_EUR;
      let confianza: number;
      if (diasDiferencia <= config.diasAlta) confianza = config.confianzaAlta;
      else if (diasDiferencia <= config.diasMedia) confianza = config.confianzaMedia;
      else confianza = config.confianzaBaja;
      if (!coincideImporte) confianza = Math.min(confianza, config.confianzaBaja);

      const importeSugerido = redondearEuros(Math.min(pendiente, c.disponible));
      sugerencias.push({
        vencimiento_id: v.id,
        movimiento_id: c.movimiento.id,
        fechaVencimiento: v.fecha,
        fechaMovimiento: c.movimiento.fecha,
        diasDiferencia,
        pendienteVencimiento: pendiente,
        disponibleMovimiento: c.disponible,
        importeSugerido,
        coincideImporte,
        tipoSugerido: coincideImporte ? "Exacta" : "Parcial",
        confianza,
        explicacion: coincideImporte
          ? `Mismo importe y ${diasDiferencia} día(s) de diferencia entre fechas.`
          : `Importes distintos: quedarían ${(pendiente - importeSugerido).toFixed(2)} € del vencimiento sin cubrir. ${diasDiferencia} día(s) de diferencia entre fechas.`,
      });
    }
  }

  return sugerencias.sort(
    (a, b) => b.confianza - a.confianza || a.diasDiferencia - b.diasDiferencia,
  );
}

// ---------- F-36 ----------

/** F-36 · variacion: nunca devuelve Infinity ni NaN. */
export function variacion(a: number, b: number) {
  const abs = redondearEuros(b - a);
  const pct = a !== 0 ? (abs / Math.abs(a)) * 100 : b !== 0 ? 100 : 0;
  return { abs, pct: Math.round(pct * 10) / 10 };
}

export type Rango = { desde: string; hasta: string };

/**
 * F-36 · compararPeriodos. No hay ninguna fórmula nueva: reutiliza literalmente
 * cashFlowOperativo() y gastoFinanciero() una vez por rango.
 */
export function compararPeriodos(
  rangoA: Rango,
  rangoB: Rango,
  agruparPor: DimensionAgrupacion | null,
  ctx: ContextoTesoreria,
  entorno?: string,
) {
  const cfA = cashFlowOperativo(rangoA.desde, rangoA.hasta, agruparPor, ctx, entorno);
  const cfB = cashFlowOperativo(rangoB.desde, rangoB.hasta, agruparPor, ctx, entorno);
  const gfA = gastoFinanciero(rangoA.desde, rangoA.hasta, ctx, entorno);
  const gfB = gastoFinanciero(rangoB.desde, rangoB.hasta, ctx, entorno);
  return {
    rangoA,
    rangoB,
    cashFlowA: cfA,
    cashFlowB: cfB,
    gastoFinancieroA: gfA,
    gastoFinancieroB: gfB,
    lineas: [
      { concepto: "Ingresos", a: cfA.ingresos, b: cfB.ingresos, ...variacion(cfA.ingresos, cfB.ingresos) },
      { concepto: "Gastos", a: cfA.gastos, b: cfB.gastos, ...variacion(cfA.gastos, cfB.gastos) },
      {
        concepto: "Gasto financiero",
        a: gfA.total,
        b: gfB.total,
        ...variacion(gfA.total, gfB.total),
      },
      { concepto: "Cash flow neto", a: cfA.neto, b: cfB.neto, ...variacion(cfA.neto, cfB.neto) },
    ],
  };
}

// ---------- F-37 ----------

/**
 * F-37 · informeVencimientos: agrega los vencimientos ya existentes. No
 * introduce ninguna fórmula financiera nueva: agrupa y suma.
 */
export function informeVencimientos(ctx: ContextoTesoreria, hoy = hoyISO()) {
  const filas = ctx.vencimientos.map((v) => {
    const conciliado = conciliadoDeVencimiento(v.id, ctx);
    const pendiente = redondearEuros(Number(v.importe) - conciliado);
    return {
      id: v.id,
      fecha: v.fecha,
      tipo: v.tipo,
      tipo_vencimiento: v.tipo_vencimiento,
      estado: v.estado,
      origen: v.factura_id ? ("Factura" as const) : ("Compromiso fijo" as const),
      factura_id: v.factura_id,
      compromiso_fijo_id: v.compromiso_fijo_id,
      importe: redondearEuros(Number(v.importe)),
      conciliado,
      pendiente,
      vencido: v.estado !== "Pagado" && v.fecha < hoy && pendiente > TOLERANCIA_REDONDEO_EUR,
      entorno: v.entorno,
    };
  });

  function agrupar<K extends string>(clave: (f: (typeof filas)[number]) => K) {
    const mapa = new Map<K, { num: number; importe: number; pendiente: number }>();
    for (const f of filas) {
      const k = clave(f);
      const acc = mapa.get(k) ?? { num: 0, importe: 0, pendiente: 0 };
      acc.num += 1;
      acc.importe = redondearEuros(acc.importe + f.importe);
      acc.pendiente = redondearEuros(acc.pendiente + f.pendiente);
      mapa.set(k, acc);
    }
    return [...mapa.entries()].map(([clave, v]) => ({ clave, ...v }));
  }

  return {
    filas,
    porEstado: agrupar((f) => f.estado),
    porTipo: agrupar((f) => f.tipo),
    porClase: agrupar((f) => f.tipo_vencimiento),
    porMes: agrupar((f) => f.fecha.slice(0, 7)).sort((a, b) => (a.clave < b.clave ? -1 : 1)),
    totales: {
      num: filas.length,
      importe: redondearEuros(filas.reduce((s, f) => s + f.importe, 0)),
      pendiente: redondearEuros(filas.reduce((s, f) => s + f.pendiente, 0)),
      vencidos: filas.filter((f) => f.vencido).length,
      importeVencido: redondearEuros(
        filas.filter((f) => f.vencido).reduce((s, f) => s + f.pendiente, 0),
      ),
    },
  };
}

// ---------- F-38 ----------

/** F-38 · agruparImporte: agrupa y suma movimientos ya filtrados por F-07. */
export function agruparImporte(
  movs: MovimientoTesoreria[],
  dimension: DimensionAgrupacion,
): { clave: string | null; num: number; ingresos: number; gastos: number; neto: number }[] {
  const mapa = new Map<string | null, { num: number; ingresos: number; gastos: number }>();
  for (const m of movs) {
    const clave = claveDimension(m, dimension);
    const acc = mapa.get(clave) ?? { num: 0, ingresos: 0, gastos: 0 };
    acc.num += 1;
    const signo = signoMovimiento({
      tipo: m.tipo,
      subtipo_financiacion: m.subtipo_financiacion,
      direccion: m.direccion,
    });
    if (signo >= 0) acc.ingresos += Math.abs(Number(m.importe));
    else acc.gastos += Math.abs(Number(m.importe));
    mapa.set(clave, acc);
  }
  return [...mapa.entries()]
    .map(([clave, v]) => ({
      clave,
      num: v.num,
      ingresos: redondearEuros(v.ingresos),
      gastos: redondearEuros(v.gastos),
      neto: redondearEuros(v.ingresos - v.gastos),
    }))
    .sort((a, b) => Math.abs(b.neto) - Math.abs(a.neto));
}
