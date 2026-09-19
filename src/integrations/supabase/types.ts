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
      conciliacion_detalle: {
        Row: {
          conciliacion_id: string
          created_at: string
          id: string
          importe_aplicado: number
          movimiento_id: string
          vencimiento_id: string
        }
        Insert: {
          conciliacion_id: string
          created_at?: string
          id?: string
          importe_aplicado: number
          movimiento_id: string
          vencimiento_id: string
        }
        Update: {
          conciliacion_id?: string
          created_at?: string
          id?: string
          importe_aplicado?: number
          movimiento_id?: string
          vencimiento_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conciliacion_detalle_conciliacion_id_fkey"
            columns: ["conciliacion_id"]
            isOneToOne: false
            referencedRelation: "conciliaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conciliacion_detalle_movimiento_id_fkey"
            columns: ["movimiento_id"]
            isOneToOne: false
            referencedRelation: "movimientos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conciliacion_detalle_vencimiento_id_fkey"
            columns: ["vencimiento_id"]
            isOneToOne: false
            referencedRelation: "vencimientos"
            referencedColumns: ["id"]
          },
        ]
      }
      conciliaciones: {
        Row: {
          autorizado_por: string | null
          confirmado_por: string | null
          created_at: string
          entorno: Database["public"]["Enums"]["entorno_tipo"]
          exceso_autorizado: boolean
          fecha_confirmacion: string | null
          id: string
          motivo_exceso: string | null
          nivel_confianza: number | null
          tipo: Database["public"]["Enums"]["conciliacion_tipo"]
        }
        Insert: {
          autorizado_por?: string | null
          confirmado_por?: string | null
          created_at?: string
          entorno?: Database["public"]["Enums"]["entorno_tipo"]
          exceso_autorizado?: boolean
          fecha_confirmacion?: string | null
          id?: string
          motivo_exceso?: string | null
          nivel_confianza?: number | null
          tipo: Database["public"]["Enums"]["conciliacion_tipo"]
        }
        Update: {
          autorizado_por?: string | null
          confirmado_por?: string | null
          created_at?: string
          entorno?: Database["public"]["Enums"]["entorno_tipo"]
          exceso_autorizado?: boolean
          fecha_confirmacion?: string | null
          id?: string
          motivo_exceso?: string | null
          nivel_confianza?: number | null
          tipo?: Database["public"]["Enums"]["conciliacion_tipo"]
        }
        Relationships: []
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
      documentos: {
        Row: {
          actor: string
          created_at: string
          entorno: Database["public"]["Enums"]["entorno_tipo"]
          estado_documento: Database["public"]["Enums"]["documento_estado"]
          factura_id: string
          fecha_incorporacion: string
          hash_sha256: string
          id: string
          nombre_original: string
          referencia_almacenamiento: string
          tamano_bytes: number
          tipo_mime: string
          updated_at: string
        }
        Insert: {
          actor?: string
          created_at?: string
          entorno?: Database["public"]["Enums"]["entorno_tipo"]
          estado_documento?: Database["public"]["Enums"]["documento_estado"]
          factura_id: string
          fecha_incorporacion?: string
          hash_sha256: string
          id?: string
          nombre_original: string
          referencia_almacenamiento: string
          tamano_bytes: number
          tipo_mime: string
          updated_at?: string
        }
        Update: {
          actor?: string
          created_at?: string
          entorno?: Database["public"]["Enums"]["entorno_tipo"]
          estado_documento?: Database["public"]["Enums"]["documento_estado"]
          factura_id?: string
          fecha_incorporacion?: string
          hash_sha256?: string
          id?: string
          nombre_original?: string
          referencia_almacenamiento?: string
          tamano_bytes?: number
          tipo_mime?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documentos_factura_id_fkey"
            columns: ["factura_id"]
            isOneToOne: false
            referencedRelation: "facturas"
            referencedColumns: ["id"]
          },
        ]
      }
      factura_lineas: {
        Row: {
          base_imponible: number | null
          cantidad: number | null
          codigo_producto: string | null
          created_at: string
          cuota_impuesto: number | null
          descripcion: string | null
          descuento_tipo:
            | Database["public"]["Enums"]["linea_descuento_tipo"]
            | null
          descuento_valor: number | null
          entorno: Database["public"]["Enums"]["entorno_tipo"]
          estado_linea: Database["public"]["Enums"]["linea_estado"]
          factura_id: string
          id: string
          nombre_impuesto: string | null
          observaciones: string | null
          orden: number
          origen_importes: Database["public"]["Enums"]["linea_origen_importes"]
          precio_unitario: number | null
          referencia_proveedor: string | null
          tipo_impositivo: number | null
          tipo_impuesto: string | null
          total: number | null
          updated_at: string
        }
        Insert: {
          base_imponible?: number | null
          cantidad?: number | null
          codigo_producto?: string | null
          created_at?: string
          cuota_impuesto?: number | null
          descripcion?: string | null
          descuento_tipo?:
            | Database["public"]["Enums"]["linea_descuento_tipo"]
            | null
          descuento_valor?: number | null
          entorno?: Database["public"]["Enums"]["entorno_tipo"]
          estado_linea?: Database["public"]["Enums"]["linea_estado"]
          factura_id: string
          id?: string
          nombre_impuesto?: string | null
          observaciones?: string | null
          orden: number
          origen_importes?: Database["public"]["Enums"]["linea_origen_importes"]
          precio_unitario?: number | null
          referencia_proveedor?: string | null
          tipo_impositivo?: number | null
          tipo_impuesto?: string | null
          total?: number | null
          updated_at?: string
        }
        Update: {
          base_imponible?: number | null
          cantidad?: number | null
          codigo_producto?: string | null
          created_at?: string
          cuota_impuesto?: number | null
          descripcion?: string | null
          descuento_tipo?:
            | Database["public"]["Enums"]["linea_descuento_tipo"]
            | null
          descuento_valor?: number | null
          entorno?: Database["public"]["Enums"]["entorno_tipo"]
          estado_linea?: Database["public"]["Enums"]["linea_estado"]
          factura_id?: string
          id?: string
          nombre_impuesto?: string | null
          observaciones?: string | null
          orden?: number
          origen_importes?: Database["public"]["Enums"]["linea_origen_importes"]
          precio_unitario?: number | null
          referencia_proveedor?: string | null
          tipo_impositivo?: number | null
          tipo_impuesto?: string | null
          total?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "factura_lineas_factura_id_fkey"
            columns: ["factura_id"]
            isOneToOne: false
            referencedRelation: "facturas"
            referencedColumns: ["id"]
          },
        ]
      }
      facturas: {
        Row: {
          base_imponible: number | null
          categoria_id: string | null
          condiciones_pago: string | null
          created_at: string
          desglose_fiscal: Json
          documento_original: string | null
          entorno: Database["public"]["Enums"]["entorno_tipo"]
          estado: string
          estado_contable: Database["public"]["Enums"]["factura_estado_contable"]
          estado_documental: Database["public"]["Enums"]["factura_estado_documental"]
          estado_duplicado: Database["public"]["Enums"]["factura_estado_duplicado"]
          factura_relacionada_id: string | null
          fecha: string
          fecha_contabilizacion: string | null
          fecha_emision: string
          fecha_recepcion: string | null
          fecha_resolucion: string | null
          fecha_vencimiento: string | null
          forma_pago: string | null
          id: string
          iva: number | null
          moneda: string
          naturaleza: string | null
          numero_factura: string | null
          observaciones: string | null
          proveedor_id: string
          resuelto_por: string | null
          tipo_factura: Database["public"]["Enums"]["factura_tipo"]
          total: number
          usuario_crea: string
          usuario_valida: string | null
        }
        Insert: {
          base_imponible?: number | null
          categoria_id?: string | null
          condiciones_pago?: string | null
          created_at?: string
          desglose_fiscal?: Json
          documento_original?: string | null
          entorno?: Database["public"]["Enums"]["entorno_tipo"]
          estado?: string
          estado_contable?: Database["public"]["Enums"]["factura_estado_contable"]
          estado_documental?: Database["public"]["Enums"]["factura_estado_documental"]
          estado_duplicado?: Database["public"]["Enums"]["factura_estado_duplicado"]
          factura_relacionada_id?: string | null
          fecha: string
          fecha_contabilizacion?: string | null
          fecha_emision: string
          fecha_recepcion?: string | null
          fecha_resolucion?: string | null
          fecha_vencimiento?: string | null
          forma_pago?: string | null
          id?: string
          iva?: number | null
          moneda?: string
          naturaleza?: string | null
          numero_factura?: string | null
          observaciones?: string | null
          proveedor_id: string
          resuelto_por?: string | null
          tipo_factura?: Database["public"]["Enums"]["factura_tipo"]
          total: number
          usuario_crea: string
          usuario_valida?: string | null
        }
        Update: {
          base_imponible?: number | null
          categoria_id?: string | null
          condiciones_pago?: string | null
          created_at?: string
          desglose_fiscal?: Json
          documento_original?: string | null
          entorno?: Database["public"]["Enums"]["entorno_tipo"]
          estado?: string
          estado_contable?: Database["public"]["Enums"]["factura_estado_contable"]
          estado_documental?: Database["public"]["Enums"]["factura_estado_documental"]
          estado_duplicado?: Database["public"]["Enums"]["factura_estado_duplicado"]
          factura_relacionada_id?: string | null
          fecha?: string
          fecha_contabilizacion?: string | null
          fecha_emision?: string
          fecha_recepcion?: string | null
          fecha_resolucion?: string | null
          fecha_vencimiento?: string | null
          forma_pago?: string | null
          id?: string
          iva?: number | null
          moneda?: string
          naturaleza?: string | null
          numero_factura?: string | null
          observaciones?: string | null
          proveedor_id?: string
          resuelto_por?: string | null
          tipo_factura?: Database["public"]["Enums"]["factura_tipo"]
          total?: number
          usuario_crea?: string
          usuario_valida?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "facturas_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facturas_factura_relacionada_id_fkey"
            columns: ["factura_relacionada_id"]
            isOneToOne: false
            referencedRelation: "facturas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facturas_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["id"]
          },
        ]
      }
      movimientos: {
        Row: {
          categoria_id: string | null
          clasificacion_origen:
            | Database["public"]["Enums"]["movimiento_clasificacion_origen"]
            | null
          created_at: string
          cuenta_id: string
          direccion: Database["public"]["Enums"]["movimiento_direccion"] | null
          entorno: Database["public"]["Enums"]["entorno_tipo"]
          estado: Database["public"]["Enums"]["movimiento_estado"]
          fecha: string
          id: string
          importe: number
          metodo_cobro_pago: string | null
          origen: Database["public"]["Enums"]["movimiento_origen"]
          proveedor_id: string | null
          relacionado_con_farmacia: boolean
          subcategoria_id: string | null
          subtipo_financiacion:
            | Database["public"]["Enums"]["movimiento_subtipo_financiacion"]
            | null
          tipo: Database["public"]["Enums"]["movimiento_tipo"]
        }
        Insert: {
          categoria_id?: string | null
          clasificacion_origen?:
            | Database["public"]["Enums"]["movimiento_clasificacion_origen"]
            | null
          created_at?: string
          cuenta_id: string
          direccion?: Database["public"]["Enums"]["movimiento_direccion"] | null
          entorno?: Database["public"]["Enums"]["entorno_tipo"]
          estado?: Database["public"]["Enums"]["movimiento_estado"]
          fecha: string
          id?: string
          importe: number
          metodo_cobro_pago?: string | null
          origen?: Database["public"]["Enums"]["movimiento_origen"]
          proveedor_id?: string | null
          relacionado_con_farmacia?: boolean
          subcategoria_id?: string | null
          subtipo_financiacion?:
            | Database["public"]["Enums"]["movimiento_subtipo_financiacion"]
            | null
          tipo: Database["public"]["Enums"]["movimiento_tipo"]
        }
        Update: {
          categoria_id?: string | null
          clasificacion_origen?:
            | Database["public"]["Enums"]["movimiento_clasificacion_origen"]
            | null
          created_at?: string
          cuenta_id?: string
          direccion?: Database["public"]["Enums"]["movimiento_direccion"] | null
          entorno?: Database["public"]["Enums"]["entorno_tipo"]
          estado?: Database["public"]["Enums"]["movimiento_estado"]
          fecha?: string
          id?: string
          importe?: number
          metodo_cobro_pago?: string | null
          origen?: Database["public"]["Enums"]["movimiento_origen"]
          proveedor_id?: string | null
          relacionado_con_farmacia?: boolean
          subcategoria_id?: string | null
          subtipo_financiacion?:
            | Database["public"]["Enums"]["movimiento_subtipo_financiacion"]
            | null
          tipo?: Database["public"]["Enums"]["movimiento_tipo"]
        }
        Relationships: [
          {
            foreignKeyName: "movimientos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_cuenta_id_fkey"
            columns: ["cuenta_id"]
            isOneToOne: false
            referencedRelation: "cuentas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_subcategoria_id_fkey"
            columns: ["subcategoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
        ]
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
      vencimientos: {
        Row: {
          compromiso_fijo_id: string | null
          created_at: string
          entorno: Database["public"]["Enums"]["entorno_tipo"]
          estado: Database["public"]["Enums"]["vencimiento_estado"]
          factura_id: string | null
          fecha: string
          id: string
          importe: number
          tipo: Database["public"]["Enums"]["vencimiento_tipo"]
          tipo_vencimiento: Database["public"]["Enums"]["vencimiento_clase"]
        }
        Insert: {
          compromiso_fijo_id?: string | null
          created_at?: string
          entorno?: Database["public"]["Enums"]["entorno_tipo"]
          estado?: Database["public"]["Enums"]["vencimiento_estado"]
          factura_id?: string | null
          fecha: string
          id?: string
          importe: number
          tipo: Database["public"]["Enums"]["vencimiento_tipo"]
          tipo_vencimiento?: Database["public"]["Enums"]["vencimiento_clase"]
        }
        Update: {
          compromiso_fijo_id?: string | null
          created_at?: string
          entorno?: Database["public"]["Enums"]["entorno_tipo"]
          estado?: Database["public"]["Enums"]["vencimiento_estado"]
          factura_id?: string | null
          fecha?: string
          id?: string
          importe?: number
          tipo?: Database["public"]["Enums"]["vencimiento_tipo"]
          tipo_vencimiento?: Database["public"]["Enums"]["vencimiento_clase"]
        }
        Relationships: [
          {
            foreignKeyName: "vencimientos_factura_id_fkey"
            columns: ["factura_id"]
            isOneToOne: false
            referencedRelation: "facturas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      registrar_conciliacion: {
        Args: {
          p_actor: string
          p_autorizar_exceso: boolean
          p_confirmado_por: string
          p_importe_aplicado: number
          p_motivo_exceso: string
          p_movimiento_id: string
          p_nivel_confianza: number
          p_tipo: Database["public"]["Enums"]["conciliacion_tipo"]
          p_vencimiento_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      categoria_tipo: "Ingreso" | "Gasto"
      conciliacion_tipo: "Exacta" | "Parcial" | "Agrupada"
      cuenta_tipo:
        | "Cuenta corriente"
        | "Línea de crédito"
        | "Cuenta de inversión"
      documento_estado: "Activo" | "Sustituido"
      entorno_tipo: "produccion" | "prueba"
      factura_estado_contable: "Pendiente" | "Contabilizada" | "Revisada"
      factura_estado_documental:
        | "Recibida"
        | "En revisión"
        | "Validada"
        | "Incidencia"
        | "Anulada"
      factura_estado_duplicado:
        | "No detectado"
        | "Posible duplicado"
        | "Duplicado confirmado"
        | "Falso positivo"
      factura_tipo: "Normal" | "Rectificativa" | "Abono"
      linea_descuento_tipo: "Porcentual" | "Absoluto"
      linea_estado: "Activa" | "Eliminada"
      linea_origen_importes: "formula" | "documento"
      movimiento_clasificacion_origen: "automatica" | "manual"
      movimiento_direccion: "entrada" | "salida"
      movimiento_estado: "Previsto" | "Pendiente" | "Confirmado" | "Conciliado"
      movimiento_origen: "Manual" | "Importado" | "Regla"
      movimiento_subtipo_financiacion:
        | "Principal recibido"
        | "Principal devuelto"
        | "Intereses"
        | "Comisiones"
      movimiento_tipo:
        | "Ingreso"
        | "Gasto"
        | "Financiación"
        | "Transferencia interna"
      proveedor_tipo: "Cooperativa" | "Mayorista" | "Laboratorio" | "Servicio"
      vencimiento_clase: "Pago" | "Cobro"
      vencimiento_estado: "Previsto" | "Pendiente" | "Pagado"
      vencimiento_tipo:
        | "Proveedor"
        | "Impuesto"
        | "Nómina"
        | "Financiación"
        | "Otro"
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
      conciliacion_tipo: ["Exacta", "Parcial", "Agrupada"],
      cuenta_tipo: [
        "Cuenta corriente",
        "Línea de crédito",
        "Cuenta de inversión",
      ],
      documento_estado: ["Activo", "Sustituido"],
      entorno_tipo: ["produccion", "prueba"],
      factura_estado_contable: ["Pendiente", "Contabilizada", "Revisada"],
      factura_estado_documental: [
        "Recibida",
        "En revisión",
        "Validada",
        "Incidencia",
        "Anulada",
      ],
      factura_estado_duplicado: [
        "No detectado",
        "Posible duplicado",
        "Duplicado confirmado",
        "Falso positivo",
      ],
      factura_tipo: ["Normal", "Rectificativa", "Abono"],
      linea_descuento_tipo: ["Porcentual", "Absoluto"],
      linea_estado: ["Activa", "Eliminada"],
      linea_origen_importes: ["formula", "documento"],
      movimiento_clasificacion_origen: ["automatica", "manual"],
      movimiento_direccion: ["entrada", "salida"],
      movimiento_estado: ["Previsto", "Pendiente", "Confirmado", "Conciliado"],
      movimiento_origen: ["Manual", "Importado", "Regla"],
      movimiento_subtipo_financiacion: [
        "Principal recibido",
        "Principal devuelto",
        "Intereses",
        "Comisiones",
      ],
      movimiento_tipo: [
        "Ingreso",
        "Gasto",
        "Financiación",
        "Transferencia interna",
      ],
      proveedor_tipo: ["Cooperativa", "Mayorista", "Laboratorio", "Servicio"],
      vencimiento_clase: ["Pago", "Cobro"],
      vencimiento_estado: ["Previsto", "Pendiente", "Pagado"],
      vencimiento_tipo: [
        "Proveedor",
        "Impuesto",
        "Nómina",
        "Financiación",
        "Otro",
      ],
    },
  },
} as const
