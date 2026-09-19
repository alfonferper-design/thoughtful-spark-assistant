import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listarAuditoria,
  listarCategorias,
  listarCuentas,
  listarProveedores,
  obtenerActor,
  guardarActor as guardarActorFn,
} from "@/lib/datos.functions";

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
// desbloqueada con la clave de la aplicación.

export function useCuentas() {
  return useQuery({ queryKey: ["cuentas"], queryFn: () => listarCuentas() });
}

export function useCategorias() {
  return useQuery({ queryKey: ["categorias"], queryFn: () => listarCategorias() });
}

export function useProveedores() {
  return useQuery({ queryKey: ["proveedores"], queryFn: () => listarProveedores() });
}

export function useAuditoria() {
  return useQuery({ queryKey: ["auditoria"], queryFn: () => listarAuditoria() });
}

export function useActor() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["actor"], queryFn: () => obtenerActor() });

  async function guardarActor(nombre: string) {
    await guardarActorFn({ data: { nombre } });
    await queryClient.invalidateQueries({ queryKey: ["actor"] });
  }

  return { actor: query.data ?? "Alfonso", guardarActor };
}
