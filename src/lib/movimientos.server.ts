/**
 * Alta de movimiento: función central única (Parte 3.3 / RB-001). Tanto el alta
 * manual como la importación desde hoja de cálculo pasan por aquí; lo único que
 * cambia es `origen` ('Manual' | 'Importado'). Nunca se escribe un movimiento
 * por otra vía.
 */
import { auditar, type Admin } from "./admin.server";
import { MENSAJE_REGLA_1 } from "./movimientos";

export type EntradaMovimiento = {
  cuenta_id: string;
  fecha: string;
  importe: number;
  tipo: "Ingreso" | "Gasto" | "Financiación";
  subtipo_financiacion:
    | "Principal recibido"
    | "Principal devuelto"
    | "Intereses"
    | "Comisiones"
    | null;
  categoria_id: string | null;
  subcategoria_id: string | null;
  proveedor_id: string | null;
  metodo_cobro_pago: "TPV" | "Bizum" | "Efectivo" | "Transferencia" | null;
  estado: "Previsto" | "Pendiente" | "Confirmado";
  relacionado_con_farmacia: boolean;
  entorno: "produccion" | "prueba";
};

export async function altaMovimiento(
  admin: Admin,
  entrada: EntradaMovimiento,
  origen: "Manual" | "Importado",
  actor: string,
) {
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

  // clasificacion_origen (F-14)
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
    origen,
    relacionado_con_farmacia: entrada.relacionado_con_farmacia,
    clasificacion_origen: clasificacion,
    entorno: entrada.entorno,
  };

  const { data: creado, error } = await admin.from("movimientos").insert(fila).select().single();
  if (error) throw new Error(error.message);

  await auditar(admin, {
    entidad: "Movimiento",
    entidadId: creado.id,
    accion: origen === "Importado" ? "importar" : "crear",
    actor,
    despues: fila,
  });

  return creado;
}
