import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listarAuditoria,
  listarCategorias,
  listarCuentas,
  listarProveedores,
  obtenerActor,
  guardarActor as guardarActorFn,
} from "@/lib/datos.functions";
import { listarFacturas } from "@/lib/datos.functions";
import { estadoPuerta } from "@/lib/gate.functions";
import type {
  EstadoContableFactura,
  EstadoDocumentalFactura,
  EstadoDuplicadoFactura,
  TipoFactura,
} from "@/lib/listas-factura";

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
