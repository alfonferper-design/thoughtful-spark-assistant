/**
 * Funciones de servidor de Diagnóstico (Parte 9.1): salud documental (F-39),
 * informe de almacenamiento por entidad y limpieza segura. La limpieza exige
 * confirmación explícita y solo alcanza datos de entorno 'prueba' o registros
 * huérfanos: nunca datos sanos de producción (RB-018).
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { adminAutorizado, auditar, type Admin } from "./admin.server";
import { NOTA_METODOS, type FilaAlmacenamiento, type CandidatoLimpieza } from "./diagnostico";

const actorSchema = z.string().trim().min(1).max(100);

type FilaEntorno = { id: string; entorno: string };

async function filas(admin: Admin, tabla: string, columnas = "id, entorno") {
  const { data, error } = await admin.from(tabla as never).select(columnas as never);
  if (error) throw new Error(`${tabla}: ${error.message}`);
  return (data ?? []) as unknown as FilaEntorno[];
}

function contar(entidad: string, registros: FilaEntorno[], huerfanos = 0, nota?: string) {
  const fila: FilaAlmacenamiento = {
    entidad,
    total: registros.length,
    produccion: registros.filter((r) => r.entorno === "produccion").length,
    prueba: registros.filter((r) => r.entorno === "prueba").length,
    huerfanos,
  };
  if (nota) fila.nota = nota;
  return fila;
}

/** Salud documental (F-39) + informe de almacenamiento + candidatos a limpieza. */
export const informeDiagnostico = createServerFn({ method: "GET" }).handler(async () => {
  const admin = await adminAutorizado();
  const { saludDocumental } = await import("./diagnostico");

  const [
    cuentas,
    movimientos,
    proveedores,
    facturasRaw,
    vencimientosRaw,
    snapshots,
    conciliaciones,
    transferencias,
    categoriasRaw,
    documentosRaw,
    lineasRaw,
  ] = await Promise.all([
    filas(admin, "cuentas"),
    filas(admin, "movimientos", "id, entorno, cuenta_id"),
    filas(admin, "proveedores"),
    filas(admin, "facturas", "id, entorno, numero_factura, proveedor_id"),
    filas(admin, "vencimientos", "id, entorno, factura_id, compromiso_fijo_id"),
    filas(admin, "snapshots", "id, entorno, cuenta_id"),
    filas(admin, "conciliaciones"),
    filas(admin, "transferencias"),
    filas(admin, "categorias", "id, entorno, nombre, categoria_padre_id"),
    filas(
      admin,
      "documentos",
      "id, entorno, factura_id, hash_sha256, estado_documento, nombre_original",
    ),
    filas(admin, "factura_lineas", "id, entorno, factura_id"),
  ]);

  const { data: auditoriaCount, error: errorAuditoria } = await admin
    .from("auditoria")
    .select("id", { count: "exact", head: true });
  if (errorAuditoria) throw new Error(errorAuditoria.message);
  void auditoriaCount;
  const { count: numAuditoria } = await admin
    .from("auditoria")
    .select("*", { count: "exact", head: true });

  const facturas = facturasRaw as unknown as (FilaEntorno & { numero_factura: string | null })[];
  const documentos = documentosRaw as unknown as (FilaEntorno & {
    factura_id: string;
    hash_sha256: string;
    estado_documento: string;
    nombre_original: string;
  })[];
  const vencimientos = vencimientosRaw as unknown as (FilaEntorno & {
    factura_id: string | null;
    compromiso_fijo_id: string | null;
  })[];
  const lineas = lineasRaw as unknown as (FilaEntorno & { factura_id: string })[];
  const categorias = categoriasRaw as unknown as (FilaEntorno & {
    nombre: string;
    categoria_padre_id: string | null;
  })[];

  const idsFactura = new Set(facturas.map((f) => f.id));
  const documentosHuerfanos = documentos.filter((d) => !idsFactura.has(d.factura_id));
  const lineasHuerfanas = lineas.filter((l) => !idsFactura.has(l.factura_id));
  const vencimientosHuerfanos = vencimientos.filter(
    (v) => v.factura_id !== null && !idsFactura.has(v.factura_id),
  );

  const almacenamiento: FilaAlmacenamiento[] = [
    contar("CuentaBancaria", cuentas),
    contar("Movimiento", movimientos),
    contar("Proveedor", proveedores),
    contar("Factura", facturas),
    contar("Vencimiento", vencimientos, vencimientosHuerfanos.length),
    {
      entidad: "CompromisoFijo",
      total: 0,
      produccion: 0,
      prueba: 0,
      huerfanos: 0,
      nota: "Entidad todavía no construida en la aplicación.",
    },
    contar("SnapshotSaldoBancario", snapshots),
    contar("Conciliacion", conciliaciones),
    contar("Transferencia", transferencias),
    contar(
      "Categoria",
      categorias.filter((c) => c.categoria_padre_id === null),
    ),
    contar(
      "Subcategoria",
      categorias.filter((c) => c.categoria_padre_id !== null),
    ),
    contar("Documento", documentos, documentosHuerfanos.length),
    {
      entidad: "Auditoria",
      total: numAuditoria ?? 0,
      produccion: numAuditoria ?? 0,
      prueba: 0,
      huerfanos: 0,
      nota: "La auditoría no se borra nunca.",
    },
    {
      entidad: "FacturaLinea",
      total: lineas.length,
      produccion: lineas.filter((l) => l.entorno === "produccion").length,
      prueba: lineas.filter((l) => l.entorno === "prueba").length,
      huerfanos: lineasHuerfanas.length,
    },
  ];

  const candidatos: CandidatoLimpieza[] = [
    ...documentosHuerfanos.map((d) => ({
      coleccion: "documentos",
      id: d.id,
      etiqueta: d.nombre_original,
      motivo: "Documento cuya factura ya no existe.",
    })),
    ...lineasHuerfanas.map((l) => ({
      coleccion: "factura_lineas",
      id: l.id,
      etiqueta: `Línea ${l.id.slice(0, 8)}`,
      motivo: "Línea cuya factura ya no existe.",
    })),
    ...vencimientosHuerfanos.map((v) => ({
      coleccion: "vencimientos",
      id: v.id,
      etiqueta: `Vencimiento ${v.id.slice(0, 8)}`,
      motivo: "Vencimiento cuya factura ya no existe.",
    })),
    ...movimientos
      .filter((m) => m.entorno === "prueba")
      .map((m) => ({
        coleccion: "movimientos",
        id: m.id,
        etiqueta: `Movimiento ${m.id.slice(0, 8)}`,
        motivo: "Dato de entorno de prueba.",
      })),
    ...facturas
      .filter((f) => f.entorno === "prueba")
      .map((f) => ({
        coleccion: "facturas",
        id: f.id,
        etiqueta: f.numero_factura ?? `Factura ${f.id.slice(0, 8)}`,
        motivo: "Dato de entorno de prueba.",
      })),
    ...snapshots
      .filter((s) => s.entorno === "prueba")
      .map((s) => ({
        coleccion: "snapshots",
        id: s.id,
        etiqueta: `Saldo bancario ${s.id.slice(0, 8)}`,
        motivo: "Dato de entorno de prueba.",
      })),
  ];

  return {
    salud: saludDocumental(
      facturas.map((f) => ({ id: f.id, numero_factura: f.numero_factura, entorno: f.entorno })),
      documentos.map((d) => ({
        id: d.id,
        factura_id: d.factura_id,
        hash_sha256: d.hash_sha256,
        estado_documento: d.estado_documento,
        entorno: d.entorno,
      })),
      true,
    ),
    almacenamiento,
    candidatos,
    notaMetodos: NOTA_METODOS,
  };
});

const COLECCIONES_LIMPIABLES = [
  "documentos",
  "factura_lineas",
  "vencimientos",
  "movimientos",
  "facturas",
  "snapshots",
] as const;

/**
 * Limpieza segura. Exige `confirmado: true` y vuelve a comprobar en el servidor
 * que cada registro es de prueba o huérfano antes de borrarlo. Nunca borra
 * auditoría ni datos sanos de producción.
 */
export const limpiarCandidatos = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        confirmado: z.literal(true),
        ids: z
          .array(z.object({ coleccion: z.enum(COLECCIONES_LIMPIABLES), id: z.string().uuid() }))
          .min(1)
          .max(500),
        actor: actorSchema,
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const admin = await adminAutorizado();
    const { data: seguros } = await (async () => {
      const informe = await Promise.all(
        data.ids.map(async (item) => {
          const { data: fila, error } = await admin
            .from(item.coleccion as never)
            .select("id, entorno, factura_id")
            .eq("id", item.id)
            .maybeSingle();
          if (error) return null;
          return fila ? { item, fila: fila as unknown as FilaEntorno & { factura_id?: string } } : null;
        }),
      );
      return { data: informe.filter((x): x is NonNullable<typeof x> => x !== null) };
    })();

    const idsFactura = new Set(
      ((await admin.from("facturas").select("id")).data ?? []).map((f) => f.id),
    );

    const borrados: string[] = [];
    const rechazados: { id: string; motivo: string }[] = [];

    for (const { item, fila } of seguros) {
      const esPrueba = fila.entorno === "prueba";
      const esHuerfano =
        "factura_id" in fila && !!fila.factura_id && !idsFactura.has(fila.factura_id);
      if (!esPrueba && !esHuerfano) {
        rechazados.push({ id: item.id, motivo: "Dato de producción sano: no se borra." });
        continue;
      }
      const { error } = await admin.from(item.coleccion as never).delete().eq("id", item.id);
      if (error) rechazados.push({ id: item.id, motivo: error.message });
      else borrados.push(item.id);
    }

    await auditar(admin, {
      entidad: "Diagnostico",
      entidadId: null,
      accion: "limpiar_candidatos",
      actor: data.actor,
      despues: { solicitados: data.ids.length, borrados: borrados.length, rechazados },
    });

    return { borrados: borrados.length, rechazados };
  });
