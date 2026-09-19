import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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

async function listar<T>(tabla: string, orden: string, ascendente = true) {
  const { data, error } = await supabase
    .from(tabla)
    .select("*")
    .order(orden, { ascending: ascendente });
  if (error) throw error;
  return (data ?? []) as T[];
}

export function useCuentas() {
  return useQuery({ queryKey: ["cuentas"], queryFn: () => listar<Cuenta>("cuentas", "nombre") });
}

export function useCategorias() {
  return useQuery({
    queryKey: ["categorias"],
    queryFn: () => listar<Categoria>("categorias", "nombre"),
  });
}

export function useProveedores() {
  return useQuery({
    queryKey: ["proveedores"],
    queryFn: () => listar<Proveedor>("proveedores", "nombre_visible"),
  });
}

export function useAuditoria() {
  return useQuery({
    queryKey: ["auditoria"],
    queryFn: () => listar<RegistroAuditoria>("auditoria", "fecha", false),
  });
}

export function useActor() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["actor"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("configuracion")
        .select("valor")
        .eq("clave", "actor")
        .maybeSingle();
      if (error) throw error;
      const valor = (data?.valor ?? {}) as { nombre?: string };
      return valor.nombre ?? "Alfonso";
    },
  });

  async function guardarActor(nombre: string) {
    const { error } = await supabase
      .from("configuracion")
      .upsert({ clave: "actor", valor: { nombre }, actualizado_en: new Date().toISOString() });
    if (error) throw error;
    await queryClient.invalidateQueries({ queryKey: ["actor"] });
  }

  return { actor: query.data ?? "Alfonso", guardarActor };
}

export async function registrarAuditoria(params: {
  entidad: string;
  entidadId: string | null;
  accion: string;
  actor: string;
  antes?: unknown;
  despues?: unknown;
}) {
  await supabase.from("auditoria").insert({
    entidad: params.entidad,
    entidad_id: params.entidadId,
    accion: params.accion,
    actor: params.actor,
    antes: (params.antes ?? null) as never,
    despues: (params.despues ?? null) as never,
  });
}
