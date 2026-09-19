export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      auditoria: {
        Row: {
          accion: string
          actor: string
          antes: Json | null
          despues: Json | null
          entidad: string
          entidad_id: string | null
          fecha: string
          id: string
        }
        Insert: {
          accion: string
          actor?: string
          antes?: Json | null
          despues?: Json | null
          entidad: string
          entidad_id?: string | null
          fecha?: string
          id?: string
        }
        Update: {
          accion?: string
          actor?: string
          antes?: Json | null
          despues?: Json | null
          entidad?: string
          entidad_id?: string | null
          fecha?: string
          id?: string
        }
        Relationships: []
      }
      categorias: {
        Row: {
          categoria_padre_id: string | null
          created_at: string
          entorno: Database["public"]["Enums"]["entorno_tipo"]
          id: string
          nombre: string
          tipo: Database["public"]["Enums"]["categoria_tipo"]
        }
        Insert: {
          categoria_padre_id?: string | null
          created_at?: string
          entorno?: Database["public"]["Enums"]["entorno_tipo"]
          id?: string
          nombre: string
          tipo: Database["public"]["Enums"]["categoria_tipo"]
        }
        Update: {
          categoria_padre_id?: string | null
          created_at?: string
          entorno?: Database["public"]["Enums"]["entorno_tipo"]
          id?: string
          nombre?: string
          tipo?: Database["public"]["Enums"]["categoria_tipo"]
        }
        Relationships: [
          {
            foreignKeyName: "categorias_categoria_padre_id_fkey"
            columns: ["categoria_padre_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracion: {
        Row: {
          actualizado_en: string
          clave: string
          valor: Json
        }
        Insert: {
          actualizado_en?: string
          clave: string
          valor: Json
        }
        Update: {
          actualizado_en?: string
          clave?: string
          valor?: Json
        }
        Relationships: []
      }
      cuentas: {
        Row: {
          activa: boolean
          created_at: string
          entorno: Database["public"]["Enums"]["entorno_tipo"]
          fecha_saldo_apertura: string
          id: string
          nombre: string
          saldo_apertura: number
          tipo: Database["public"]["Enums"]["cuenta_tipo"]
        }
        Insert: {
          activa?: boolean
          created_at?: string
          entorno?: Database["public"]["Enums"]["entorno_tipo"]
          fecha_saldo_apertura: string
          id?: string
          nombre: string
          saldo_apertura: number
          tipo: Database["public"]["Enums"]["cuenta_tipo"]
        }
        Update: {
          activa?: boolean
          created_at?: string
          entorno?: Database["public"]["Enums"]["entorno_tipo"]
          fecha_saldo_apertura?: string
          id?: string
          nombre?: string
          saldo_apertura?: number
          tipo?: Database["public"]["Enums"]["cuenta_tipo"]
        }
        Relationships: []
      }
      proveedores: {
        Row: {
          activo: boolean
          categoria_defecto_id: string | null
          cif: string | null
          condiciones_pago: string | null
          created_at: string
          direccion: string | null
          email: string | null
          entorno: Database["public"]["Enums"]["entorno_tipo"]
          id: string
          nombre_normalizado: string
          nombre_visible: string
          telefono: string | null
          tipo: Database["public"]["Enums"]["proveedor_tipo"]
        }
        Insert: {
          activo?: boolean
          categoria_defecto_id?: string | null
          cif?: string | null
          condiciones_pago?: string | null
          created_at?: string
          direccion?: string | null
          email?: string | null
          entorno?: Database["public"]["Enums"]["entorno_tipo"]
          id?: string
          nombre_normalizado: string
          nombre_visible: string
          telefono?: string | null
          tipo: Database["public"]["Enums"]["proveedor_tipo"]
        }
        Update: {
          activo?: boolean
          categoria_defecto_id?: string | null
          cif?: string | null
          condiciones_pago?: string | null
          created_at?: string
          direccion?: string | null
          email?: string | null
          entorno?: Database["public"]["Enums"]["entorno_tipo"]
          id?: string
          nombre_normalizado?: string
          nombre_visible?: string
          telefono?: string | null
          tipo?: Database["public"]["Enums"]["proveedor_tipo"]
        }
        Relationships: [
          {
            foreignKeyName: "proveedores_categoria_defecto_id_fkey"
            columns: ["categoria_defecto_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      categoria_tipo: "Ingreso" | "Gasto"
      cuenta_tipo:
        | "Cuenta corriente"
        | "Línea de crédito"
        | "Cuenta de inversión"
      entorno_tipo: "produccion" | "prueba"
      proveedor_tipo: "Cooperativa" | "Mayorista" | "Laboratorio" | "Servicio"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      categoria_tipo: ["Ingreso", "Gasto"],
      cuenta_tipo: [
        "Cuenta corriente",
        "Línea de crédito",
        "Cuenta de inversión",
      ],
      entorno_tipo: ["produccion", "prueba"],
      proveedor_tipo: ["Cooperativa", "Mayorista", "Laboratorio", "Servicio"],
    },
  },
} as const
