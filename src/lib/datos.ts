import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listarAuditoria,
  listarCategorias,
  listarCuentas,
  listarProveedores,
  obtenerActor,
  guardarActor as guardarActorFn,
} from "@/lib/datos.functions";
import {
  listarDocumentosFactura,
  listarFacturas,
  listarLineasFactura,
  listarMovimientos,
  obtenerFactura,
  saldosInternosCuentas,
  listarVencimientos,
  listarVencimientosFactura,
} from "@/lib/datos.functions";
import { estadoPuerta } from "@/lib/gate.functions";
import type {
  EstadoContableFactura,
  EstadoDocumentalFactura,
  EstadoDuplicadoFactura,
  TipoFactura,
} from "@/lib/listas-factura";
import type { EstadoDocumento } from "@/lib/documentos";
import type {
  EstadoLineaFactura,
  OrigenImportesLinea,
  TipoDescuentoLinea,
} from "@/lib/lineas-factura";
import type {
  ClasificacionOrigen,
  DireccionMovimiento,
  EstadoMovimiento,
  OrigenMovimiento,
  SubtipoFinanciacion,
  TipoMovimiento,
} from "@/lib/movimientos";
import type {
  ClaseVencimiento,
  EstadoVencimiento,
  TipoVencimiento,
} from "@/lib/vencimientos";

export type Cuenta = {
  id: string;
  nombre: string;
  tipo: "Cuenta corriente" | "Línea de crédito" | "Cuenta de inversión";
  activa: boolean;
  saldo_apertura: number;
  fecha_saldo_apertura: string;
  entorno: "produccion" | "prueba";
  created_at: string;
};

export type Categoria = {
  id: string;
  nombre: string;
  tipo: "Ingreso" | "Gasto";
  categoria_padre_id: string | null;
  entorno: "produccion" | "prueba";
  created_at: string;
};

export type Proveedor = {
  id: string;
  nombre_visible: string;
  nombre_normalizado: string;
  tipo: "Cooperativa" | "Mayorista" | "Laboratorio" | "Servicio";
  cif: string | null;
  direccion: string | null;
  telefono: string | null;
  email: string | null;
  categoria_defecto_id: string | null;
  condiciones_pago: string | null;
  activo: boolean;
  entorno: "produccion" | "prueba";
  created_at: string;
};

export type RegistroAuditoria = {
  id: string;
  entidad: string;
  entidad_id: string | null;
  accion: string;
  actor: string;
  antes: unknown;
  despues: unknown;
  fecha: string;
};

// Todas las consultas llaman a funciones de servidor que exigen la sesión
// desbloqueada con la clave de la aplicación. Por eso no se lanzan hasta que
// la puerta está confirmada como abierta en el navegador.

export function usePuertaAbierta() {
  const { data } = useQuery({
    queryKey: ["puerta"],
    queryFn: () => estadoPuerta(),
    staleTime: 30_000,
    retry: false,
  });
  return data?.desbloqueado === true;
}

export function useCuentas() {
  const abierta = usePuertaAbierta();
  return useQuery({ queryKey: ["cuentas"], queryFn: () => listarCuentas(), enabled: abierta, retry: false });
}

export function useCategorias() {
  const abierta = usePuertaAbierta();
  return useQuery({ queryKey: ["categorias"], queryFn: () => listarCategorias(), enabled: abierta, retry: false });
}

export function useProveedores() {
  const abierta = usePuertaAbierta();
  return useQuery({ queryKey: ["proveedores"], queryFn: () => listarProveedores(), enabled: abierta, retry: false });
}

export function useAuditoria() {
  const abierta = usePuertaAbierta();
  return useQuery({ queryKey: ["auditoria"], queryFn: () => listarAuditoria(), enabled: abierta, retry: false });
}

export function useActor() {
  const queryClient = useQueryClient();
  const abierta = usePuertaAbierta();
  const query = useQuery({ queryKey: ["actor"], queryFn: () => obtenerActor(), enabled: abierta, retry: false });

  async function guardarActor(nombre: string) {
    await guardarActorFn({ data: { nombre } });
    await queryClient.invalidateQueries({ queryKey: ["actor"] });
  }

  return { actor: query.data ?? "Alfonso", guardarActor };
}

export type Factura = {
  id: string;
  estado: string;
  base_imponible: number | null;
  iva: number | null;
  documento_original: string | null;
  resuelto_por: string | null;
  fecha_resolucion: string | null;
  proveedor_id: string;
  fecha: string;
  fecha_emision: string;
  fecha_recepcion: string | null;
  fecha_vencimiento: string | null;
  fecha_contabilizacion: string | null;
  numero_factura: string | null;
  total: number;
  estado_documental: EstadoDocumentalFactura;
  estado_duplicado: EstadoDuplicadoFactura;
  estado_contable: EstadoContableFactura;
  naturaleza: string | null;
  categoria_id: string | null;
  moneda: string;
  forma_pago: string | null;
  condiciones_pago: string | null;
  observaciones: string | null;
  usuario_crea: string;
  usuario_valida: string | null;
  tipo_factura: TipoFactura;
  factura_relacionada_id: string | null;
  desglose_fiscal: unknown;
  entorno: "produccion" | "prueba";
  created_at: string;
};

export function useFacturas() {
  const abierta = usePuertaAbierta();
  return useQuery({
    queryKey: ["facturas"],
    queryFn: () => listarFacturas(),
    enabled: abierta,
    retry: false,
  });
}

export type FacturaLinea = {
  id: string;
  factura_id: string;
  orden: number;
  descripcion: string | null;
  codigo_producto: string | null;
  referencia_proveedor: string | null;
  cantidad: number | null;
  precio_unitario: number | null;
  descuento_tipo: TipoDescuentoLinea | null;
  descuento_valor: number | null;
  tipo_impuesto: string | null;
  nombre_impuesto: string | null;
  tipo_impositivo: number | null;
  base_imponible: number | null;
  cuota_impuesto: number | null;
  total: number | null;
  origen_importes: OrigenImportesLinea;
  observaciones: string | null;
  estado_linea: EstadoLineaFactura;
  created_at: string;
  updated_at: string;
  entorno: "produccion" | "prueba";
};

export function useFactura(id: string) {
  const abierta = usePuertaAbierta();
  return useQuery({
    queryKey: ["factura", id],
    queryFn: () => obtenerFactura({ data: { id } }),
    enabled: abierta && !!id,
    retry: false,
  });
}

export function useLineasFactura(facturaId: string, incluirEliminadas = false) {
  const abierta = usePuertaAbierta();
  return useQuery({
    queryKey: ["factura-lineas", facturaId, incluirEliminadas],
    queryFn: () => listarLineasFactura({ data: { facturaId, incluirEliminadas } }),
    enabled: abierta && !!facturaId,
    retry: false,
  });
}

export type DocumentoFactura = {
  id: string;
  factura_id: string;
  nombre_original: string;
  tipo_mime: string;
  tamano_bytes: number;
  hash_sha256: string;
  fecha_incorporacion: string;
  actor: string;
  referencia_almacenamiento: string;
  estado_documento: EstadoDocumento;
  entorno: "produccion" | "prueba";
  created_at: string;
  updated_at: string;
};

export function useDocumentosFactura(facturaId: string) {
  const abierta = usePuertaAbierta();
  return useQuery({
    queryKey: ["factura-documentos", facturaId],
    queryFn: () => listarDocumentosFactura({ data: { facturaId } }),
    enabled: abierta && !!facturaId,
    retry: false,
  });
}

export type Movimiento = {
  id: string;
  cuenta_id: string;
  fecha: string;
  importe: number;
  tipo: TipoMovimiento;
  subtipo_financiacion: SubtipoFinanciacion | null;
  direccion: DireccionMovimiento | null;
  categoria_id: string | null;
  subcategoria_id: string | null;
  proveedor_id: string | null;
  metodo_cobro_pago: string | null;
  estado: EstadoMovimiento;
  origen: OrigenMovimiento;
  relacionado_con_farmacia: boolean;
  clasificacion_origen: ClasificacionOrigen | null;
  entorno: "produccion" | "prueba";
  created_at: string;
};

export function useMovimientos() {
  const abierta = usePuertaAbierta();
  return useQuery({
    queryKey: ["movimientos"],
    queryFn: () => listarMovimientos(),
    enabled: abierta,
    retry: false,
  });
}

export function useSaldosInternos() {
  const abierta = usePuertaAbierta();
  return useQuery({
    queryKey: ["saldos-internos"],
    queryFn: () => saldosInternosCuentas(),
    enabled: abierta,
    retry: false,
  });
}

export type Vencimiento = {
  id: string;
  factura_id: string | null;
  compromiso_fijo_id: string | null;
  fecha: string;
  importe: number;
  estado: EstadoVencimiento;
  tipo: TipoVencimiento;
  tipo_vencimiento: ClaseVencimiento;
  entorno: "produccion" | "prueba";
  created_at: string;
};

export function useVencimientos() {
  const abierta = usePuertaAbierta();
  return useQuery({
    queryKey: ["vencimientos"],
    queryFn: () => listarVencimientos(),
    enabled: abierta,
    retry: false,
  });
}

export function useVencimientosFactura(facturaId: string) {
  const abierta = usePuertaAbierta();
  return useQuery({
    queryKey: ["vencimientos-factura", facturaId],
    queryFn: () => listarVencimientosFactura({ data: { facturaId } }),
    enabled: abierta && !!facturaId,
    retry: false,
  });
}
