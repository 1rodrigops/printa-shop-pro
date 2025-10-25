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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_activity_log: {
        Row: {
          action_detail: string
          action_type: string
          created_at: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          result: string | null
          timestamp: string
          user_email: string
          user_id: string | null
        }
        Insert: {
          action_detail: string
          action_type: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          result?: string | null
          timestamp?: string
          user_email: string
          user_id?: string | null
        }
        Update: {
          action_detail?: string
          action_type?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          result?: string | null
          timestamp?: string
          user_email?: string
          user_id?: string | null
        }
        Relationships: []
      }
      clientes: {
        Row: {
          cadastrado_por: string | null
          cep: string | null
          cpf_cnpj: string
          created_at: string | null
          email: string
          endereco_bairro: string | null
          endereco_cidade: string | null
          endereco_numero: string | null
          endereco_rua: string | null
          endereco_uf: string | null
          id: string
          nome_completo: string
          observacoes: string | null
          telefone: string
          updated_at: string | null
        }
        Insert: {
          cadastrado_por?: string | null
          cep?: string | null
          cpf_cnpj: string
          created_at?: string | null
          email: string
          endereco_bairro?: string | null
          endereco_cidade?: string | null
          endereco_numero?: string | null
          endereco_rua?: string | null
          endereco_uf?: string | null
          id?: string
          nome_completo: string
          observacoes?: string | null
          telefone: string
          updated_at?: string | null
        }
        Update: {
          cadastrado_por?: string | null
          cep?: string | null
          cpf_cnpj?: string
          created_at?: string | null
          email?: string
          endereco_bairro?: string | null
          endereco_cidade?: string | null
          endereco_numero?: string | null
          endereco_rua?: string | null
          endereco_uf?: string | null
          id?: string
          nome_completo?: string
          observacoes?: string | null
          telefone?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      fornecedor_historico: {
        Row: {
          created_at: string | null
          data_evento: string | null
          descricao: string
          fornecedor_id: string
          id: string
          metadata: Json | null
          tipo_evento: string
          usuario_id: string | null
          valor: number | null
        }
        Insert: {
          created_at?: string | null
          data_evento?: string | null
          descricao: string
          fornecedor_id: string
          id?: string
          metadata?: Json | null
          tipo_evento: string
          usuario_id?: string | null
          valor?: number | null
        }
        Update: {
          created_at?: string | null
          data_evento?: string | null
          descricao?: string
          fornecedor_id?: string
          id?: string
          metadata?: Json | null
          tipo_evento?: string
          usuario_id?: string | null
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fornecedor_historico_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
        ]
      }
      fornecedores: {
        Row: {
          avaliacao: number | null
          cadastrado_por: string | null
          cnpj_cpf: string
          created_at: string | null
          email_contato: string
          forma_pagamento: string
          fornece_amostras: boolean | null
          id: string
          link_catalogo: string | null
          nome_empresa: string
          observacoes: string | null
          prazo_entrega: string | null
          responsavel: string | null
          status: string
          telefone_comercial: string | null
          tipo_fornecimento: string[]
          tipo_tecido: string | null
          updated_at: string | null
        }
        Insert: {
          avaliacao?: number | null
          cadastrado_por?: string | null
          cnpj_cpf: string
          created_at?: string | null
          email_contato: string
          forma_pagamento?: string
          fornece_amostras?: boolean | null
          id?: string
          link_catalogo?: string | null
          nome_empresa: string
          observacoes?: string | null
          prazo_entrega?: string | null
          responsavel?: string | null
          status?: string
          telefone_comercial?: string | null
          tipo_fornecimento?: string[]
          tipo_tecido?: string | null
          updated_at?: string | null
        }
        Update: {
          avaliacao?: number | null
          cadastrado_por?: string | null
          cnpj_cpf?: string
          created_at?: string | null
          email_contato?: string
          forma_pagamento?: string
          fornece_amostras?: boolean | null
          id?: string
          link_catalogo?: string | null
          nome_empresa?: string
          observacoes?: string | null
          prazo_entrega?: string | null
          responsavel?: string | null
          status?: string
          telefone_comercial?: string | null
          tipo_fornecimento?: string[]
          tipo_tecido?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      movimentacoes_estoque: {
        Row: {
          created_at: string | null
          id: string
          observacao: string | null
          quantidade: number
          tipo: string
          usuario_id: string | null
          variacao_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          observacao?: string | null
          quantidade: number
          tipo: string
          usuario_id?: string | null
          variacao_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          observacao?: string | null
          quantidade?: number
          tipo?: string
          usuario_id?: string | null
          variacao_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "movimentacoes_estoque_variacao_id_fkey"
            columns: ["variacao_id"]
            isOneToOne: false
            referencedRelation: "produto_variacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          customer_email: string
          customer_name: string
          customer_phone: string
          etapa_producao: string | null
          id: string
          image_url: string | null
          notes: string | null
          quantity: number
          shirt_color: string
          shirt_size: Database["public"]["Enums"]["shirt_size"]
          status: Database["public"]["Enums"]["order_status"]
          total_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_email: string
          customer_name: string
          customer_phone: string
          etapa_producao?: string | null
          id?: string
          image_url?: string | null
          notes?: string | null
          quantity?: number
          shirt_color: string
          shirt_size: Database["public"]["Enums"]["shirt_size"]
          status?: Database["public"]["Enums"]["order_status"]
          total_price: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string
          etapa_producao?: string | null
          id?: string
          image_url?: string | null
          notes?: string | null
          quantity?: number
          shirt_color?: string
          shirt_size?: Database["public"]["Enums"]["shirt_size"]
          status?: Database["public"]["Enums"]["order_status"]
          total_price?: number
          updated_at?: string
        }
        Relationships: []
      }
      permissions_matrix: {
        Row: {
          can_delete: boolean | null
          can_edit: boolean | null
          can_export: boolean | null
          can_view: boolean | null
          created_at: string | null
          id: string
          module: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
        }
        Insert: {
          can_delete?: boolean | null
          can_edit?: boolean | null
          can_export?: boolean | null
          can_view?: boolean | null
          created_at?: string | null
          id?: string
          module: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
        }
        Update: {
          can_delete?: boolean | null
          can_edit?: boolean | null
          can_export?: boolean | null
          can_view?: boolean | null
          created_at?: string | null
          id?: string
          module?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
        }
        Relationships: []
      }
      production_log: {
        Row: {
          created_at: string | null
          data_hora: string | null
          etapa: string
          id: string
          mensagem_enviada: boolean | null
          observacao: string | null
          operador: string | null
          operador_id: string | null
          pedido_id: string
          tempo_etapa_minutos: number | null
        }
        Insert: {
          created_at?: string | null
          data_hora?: string | null
          etapa: string
          id?: string
          mensagem_enviada?: boolean | null
          observacao?: string | null
          operador?: string | null
          operador_id?: string | null
          pedido_id: string
          tempo_etapa_minutos?: number | null
        }
        Update: {
          created_at?: string | null
          data_hora?: string | null
          etapa?: string
          id?: string
          mensagem_enviada?: boolean | null
          observacao?: string | null
          operador?: string | null
          operador_id?: string | null
          pedido_id?: string
          tempo_etapa_minutos?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "production_log_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      produto_variacoes: {
        Row: {
          cor: string
          created_at: string | null
          estoque: number
          id: string
          produto_id: string
          tamanho: string
          tecido: string
          updated_at: string | null
        }
        Insert: {
          cor: string
          created_at?: string | null
          estoque?: number
          id?: string
          produto_id: string
          tamanho: string
          tecido: string
          updated_at?: string | null
        }
        Update: {
          cor?: string
          created_at?: string | null
          estoque?: number
          id?: string
          produto_id?: string
          tamanho?: string
          tecido?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "produto_variacoes_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos: {
        Row: {
          cadastrado_por: string | null
          categoria: string
          cores_disponiveis: string[]
          created_at: string | null
          descricao_completa: string | null
          descricao_curta: string | null
          estampa_url: string | null
          fornecedor_id: string | null
          id: string
          nome: string
          preco_frente: number
          preco_frente_verso: number
          promo_validade: string | null
          promo_valor: number | null
          sku: string | null
          status: string
          tamanhos_disponiveis: string[]
          tecidos: string[]
          tipo: string
          updated_at: string | null
        }
        Insert: {
          cadastrado_por?: string | null
          categoria: string
          cores_disponiveis?: string[]
          created_at?: string | null
          descricao_completa?: string | null
          descricao_curta?: string | null
          estampa_url?: string | null
          fornecedor_id?: string | null
          id?: string
          nome: string
          preco_frente: number
          preco_frente_verso: number
          promo_validade?: string | null
          promo_valor?: number | null
          sku?: string | null
          status?: string
          tamanhos_disponiveis?: string[]
          tecidos?: string[]
          tipo: string
          updated_at?: string | null
        }
        Update: {
          cadastrado_por?: string | null
          categoria?: string
          cores_disponiveis?: string[]
          created_at?: string | null
          descricao_completa?: string | null
          descricao_curta?: string | null
          estampa_url?: string | null
          fornecedor_id?: string | null
          id?: string
          nome?: string
          preco_frente?: number
          preco_frente_verso?: number
          promo_validade?: string | null
          promo_valor?: number | null
          sku?: string | null
          status?: string
          tamanhos_disponiveis?: string[]
          tecidos?: string[]
          tipo?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      quality_control_log: {
        Row: {
          aprovado: boolean | null
          checklist: Json
          created_at: string | null
          data_hora: string
          fotos: string[] | null
          id: string
          mensagem_enviada: boolean | null
          observacoes: string | null
          operador: string | null
          operador_id: string | null
          pedido_id: string
          rastreio: string | null
          transportadora: string | null
        }
        Insert: {
          aprovado?: boolean | null
          checklist?: Json
          created_at?: string | null
          data_hora?: string
          fotos?: string[] | null
          id?: string
          mensagem_enviada?: boolean | null
          observacoes?: string | null
          operador?: string | null
          operador_id?: string | null
          pedido_id: string
          rastreio?: string | null
          transportadora?: string | null
        }
        Update: {
          aprovado?: boolean | null
          checklist?: Json
          created_at?: string | null
          data_hora?: string
          fotos?: string[] | null
          id?: string
          mensagem_enviada?: boolean | null
          observacoes?: string | null
          operador?: string | null
          operador_id?: string | null
          pedido_id?: string
          rastreio?: string | null
          transportadora?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quality_control_log_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      relatorios_admin: {
        Row: {
          arquivo_pdf_url: string | null
          created_at: string | null
          dados_json: Json
          data_fim: string
          data_geracao: string | null
          data_inicio: string
          gerado_por: string | null
          id: string
          periodo: string
        }
        Insert: {
          arquivo_pdf_url?: string | null
          created_at?: string | null
          dados_json: Json
          data_fim: string
          data_geracao?: string | null
          data_inicio: string
          gerado_por?: string | null
          id?: string
          periodo: string
        }
        Update: {
          arquivo_pdf_url?: string | null
          created_at?: string | null
          dados_json?: Json
          data_fim?: string
          data_geracao?: string | null
          data_inicio?: string
          gerado_por?: string | null
          id?: string
          periodo?: string
        }
        Relationships: []
      }
      system_config: {
        Row: {
          config_category: string
          config_key: string
          config_value: string
          created_at: string | null
          description: string | null
          id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          config_category: string
          config_key: string
          config_value: string
          created_at?: string | null
          description?: string | null
          id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          config_category?: string
          config_key?: string
          config_value?: string
          created_at?: string | null
          description?: string | null
          id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_message_logs: {
        Row: {
          created_at: string | null
          enviado_por: string | null
          evento: string
          id: string
          numero: string
          payload: Json | null
          pedido_id: string | null
          resposta_api: string | null
          status_http: string | null
          tempo_envio_ms: number | null
          tipo_envio: string
        }
        Insert: {
          created_at?: string | null
          enviado_por?: string | null
          evento: string
          id?: string
          numero: string
          payload?: Json | null
          pedido_id?: string | null
          resposta_api?: string | null
          status_http?: string | null
          tempo_envio_ms?: number | null
          tipo_envio: string
        }
        Update: {
          created_at?: string | null
          enviado_por?: string | null
          evento?: string
          id?: string
          numero?: string
          payload?: Json | null
          pedido_id?: string | null
          resposta_api?: string | null
          status_http?: string | null
          tempo_envio_ms?: number | null
          tipo_envio?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calcular_metricas_relatorio: {
        Args: { data_fim: string; data_inicio: string }
        Returns: Json
      }
      calcular_tempo_medio_etapa: { Args: { p_etapa: string }; Returns: number }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_admin_activity: {
        Args: {
          p_action_detail: string
          p_action_type: string
          p_ip_address?: string
          p_metadata?: Json
          p_result?: string
        }
        Returns: string
      }
      registrar_mudanca_etapa: {
        Args: { p_etapa: string; p_observacao?: string; p_pedido_id: string }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "user" | "superadmin" | "cliente"
      order_status: "pending" | "processing" | "completed" | "cancelled"
      shirt_size: "P" | "M" | "G" | "GG" | "XG"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      app_role: ["admin", "user", "superadmin", "cliente"],
      order_status: ["pending", "processing", "completed", "cancelled"],
      shirt_size: ["P", "M", "G", "GG", "XG"],
    },
  },
} as const
