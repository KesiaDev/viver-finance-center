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
      automacoes_execucoes: {
        Row: {
          created_at: string
          detalhes: Json | null
          erro: string | null
          id: string
          itens_processados: number
          regra_id: string | null
          status: string
        }
        Insert: {
          created_at?: string
          detalhes?: Json | null
          erro?: string | null
          id?: string
          itens_processados?: number
          regra_id?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          detalhes?: Json | null
          erro?: string | null
          id?: string
          itens_processados?: number
          regra_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "automacoes_execucoes_regra_id_fkey"
            columns: ["regra_id"]
            isOneToOne: false
            referencedRelation: "automacoes_regras"
            referencedColumns: ["id"]
          },
        ]
      }
      automacoes_regras: {
        Row: {
          ativo: boolean
          canal: string
          created_at: string
          dias_antecedencia: number
          empresa_id: string | null
          hora_execucao: string
          id: string
          nome: string
          template: string | null
          tipo: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          canal?: string
          created_at?: string
          dias_antecedencia?: number
          empresa_id?: string | null
          hora_execucao?: string
          id?: string
          nome: string
          template?: string | null
          tipo: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          canal?: string
          created_at?: string
          dias_antecedencia?: number
          empresa_id?: string | null
          hora_execucao?: string
          id?: string
          nome?: string
          template?: string | null
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "automacoes_regras_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_config: {
        Row: {
          config: Json | null
          created_at: string
          description: string | null
          function_name: string
          id: string
          is_active: boolean | null
          job_name: string
          last_run: string | null
          name: string
          schedule: string
          updated_at: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          description?: string | null
          function_name: string
          id?: string
          is_active?: boolean | null
          job_name: string
          last_run?: string | null
          name: string
          schedule: string
          updated_at?: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          description?: string | null
          function_name?: string
          id?: string
          is_active?: boolean | null
          job_name?: string
          last_run?: string | null
          name?: string
          schedule?: string
          updated_at?: string
        }
        Relationships: []
      }
      cash_flow_categories: {
        Row: {
          code: string
          created_at: string | null
          id: string
          is_calculated: boolean | null
          name: string
          parent_code: string | null
          sort_order: number
          type: string
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: string
          is_calculated?: boolean | null
          name: string
          parent_code?: string | null
          sort_order: number
          type: string
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
          is_calculated?: boolean | null
          name?: string
          parent_code?: string | null
          sort_order?: number
          type?: string
        }
        Relationships: []
      }
      cash_flow_data: {
        Row: {
          category_code: string
          created_at: string | null
          id: string
          month: string
          notes: string | null
          projected_value: number | null
          realized_value: number | null
          synced_at: string | null
          synced_from: string | null
          updated_at: string | null
        }
        Insert: {
          category_code: string
          created_at?: string | null
          id?: string
          month: string
          notes?: string | null
          projected_value?: number | null
          realized_value?: number | null
          synced_at?: string | null
          synced_from?: string | null
          updated_at?: string | null
        }
        Update: {
          category_code?: string
          created_at?: string | null
          id?: string
          month?: string
          notes?: string | null
          projected_value?: number | null
          realized_value?: number | null
          synced_at?: string | null
          synced_from?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cash_flow_data_category_code_fkey"
            columns: ["category_code"]
            isOneToOne: false
            referencedRelation: "cash_flow_categories"
            referencedColumns: ["code"]
          },
        ]
      }
      cash_flow_data_detailed: {
        Row: {
          created_at: string | null
          id: string
          marvee_category_description: string | null
          marvee_category_structure: string
          month: string
          projected_value: number | null
          realized_value: number | null
          source_type: string
          synced_at: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          marvee_category_description?: string | null
          marvee_category_structure: string
          month: string
          projected_value?: number | null
          realized_value?: number | null
          source_type: string
          synced_at?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          marvee_category_description?: string | null
          marvee_category_structure?: string
          month?: string
          projected_value?: number | null
          realized_value?: number | null
          source_type?: string
          synced_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      cash_flow_expenses: {
        Row: {
          category_description: string | null
          category_structure: string
          created_at: string | null
          document_number: string | null
          expiration_date: string | null
          id: string
          installment: number | null
          marvee_id: number
          month: string
          movement_value: number
        }
        Insert: {
          category_description?: string | null
          category_structure: string
          created_at?: string | null
          document_number?: string | null
          expiration_date?: string | null
          id?: string
          installment?: number | null
          marvee_id: number
          month: string
          movement_value?: number
        }
        Update: {
          category_description?: string | null
          category_structure?: string
          created_at?: string | null
          document_number?: string | null
          expiration_date?: string | null
          id?: string
          installment?: number | null
          marvee_id?: number
          month?: string
          movement_value?: number
        }
        Relationships: []
      }
      cash_flow_revenues: {
        Row: {
          category_description: string | null
          category_structure: string
          created_at: string | null
          document_number: string
          id: string
          installment: number | null
          marvee_id: number
          month: string
          movement_value: number
          payment_date: string | null
        }
        Insert: {
          category_description?: string | null
          category_structure: string
          created_at?: string | null
          document_number: string
          id?: string
          installment?: number | null
          marvee_id: number
          month: string
          movement_value?: number
          payment_date?: string | null
        }
        Update: {
          category_description?: string | null
          category_structure?: string
          created_at?: string | null
          document_number?: string
          id?: string
          installment?: number | null
          marvee_id?: number
          month?: string
          movement_value?: number
          payment_date?: string | null
        }
        Relationships: []
      }
      categorias_financeiras: {
        Row: {
          ativo: boolean
          created_at: string
          created_by: string | null
          empresa_id: string | null
          entra_no_dre: boolean
          grupo_dre: string
          id: string
          nome: string
          ordem: number
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          created_by?: string | null
          empresa_id?: string | null
          entra_no_dre?: boolean
          grupo_dre: string
          id?: string
          nome: string
          ordem?: number
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          created_by?: string | null
          empresa_id?: string | null
          entra_no_dre?: boolean
          grupo_dre?: string
          id?: string
          nome?: string
          ordem?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categorias_financeiras_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      centros_custo: {
        Row: {
          ativo: boolean
          codigo: string | null
          created_at: string
          empresa_id: string | null
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          codigo?: string | null
          created_at?: string
          empresa_id?: string | null
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          codigo?: string | null
          created_at?: string
          empresa_id?: string | null
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "centros_custo_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      centros_custo_ferramentas: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      cliente_contratos: {
        Row: {
          cliente_id: string
          created_at: string
          created_by: string | null
          data_fim: string | null
          data_inicio: string
          descricao: string
          dia_vencimento: number | null
          empresa_id: string | null
          id: string
          observacoes: string | null
          periodicidade: string
          status: string
          updated_at: string
          valor: number
        }
        Insert: {
          cliente_id: string
          created_at?: string
          created_by?: string | null
          data_fim?: string | null
          data_inicio?: string
          descricao: string
          dia_vencimento?: number | null
          empresa_id?: string | null
          id?: string
          observacoes?: string | null
          periodicidade?: string
          status?: string
          updated_at?: string
          valor?: number
        }
        Update: {
          cliente_id?: string
          created_at?: string
          created_by?: string | null
          data_fim?: string | null
          data_inicio?: string
          descricao?: string
          dia_vencimento?: number | null
          empresa_id?: string | null
          id?: string
          observacoes?: string | null
          periodicidade?: string
          status?: string
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "cliente_contratos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cliente_contratos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          cep: string | null
          cidade: string | null
          cpf_cnpj: string | null
          created_at: string
          created_by: string | null
          email: string | null
          empresa_id: string | null
          endereco: string | null
          id: string
          nome: string
          observacoes: string | null
          status: string
          uf: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          cep?: string | null
          cidade?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          empresa_id?: string | null
          endereco?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          status?: string
          uf?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          cep?: string | null
          cidade?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          empresa_id?: string | null
          endereco?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          status?: string
          uf?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clientes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      cobranca_historico: {
        Row: {
          canal: string
          cliente_id: string | null
          conta_receber_id: string | null
          created_at: string
          created_by: string | null
          id: string
          mensagem: string | null
          resultado: string | null
          tipo: string
        }
        Insert: {
          canal?: string
          cliente_id?: string | null
          conta_receber_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          mensagem?: string | null
          resultado?: string | null
          tipo?: string
        }
        Update: {
          canal?: string
          cliente_id?: string | null
          conta_receber_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          mensagem?: string | null
          resultado?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "cobranca_historico_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cobranca_historico_conta_receber_id_fkey"
            columns: ["conta_receber_id"]
            isOneToOne: false
            referencedRelation: "contas_receber"
            referencedColumns: ["id"]
          },
        ]
      }
      colaborador_documentos: {
        Row: {
          arquivo_url: string
          colaborador_id: string
          created_at: string | null
          id: string
          nome: string
          tipo: string
          uploaded_by: string | null
        }
        Insert: {
          arquivo_url: string
          colaborador_id: string
          created_at?: string | null
          id?: string
          nome: string
          tipo: string
          uploaded_by?: string | null
        }
        Update: {
          arquivo_url?: string
          colaborador_id?: string
          created_at?: string | null
          id?: string
          nome?: string
          tipo?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "colaborador_documentos_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
        ]
      }
      colaborador_notas: {
        Row: {
          colaborador_id: string
          conteudo: string
          created_at: string | null
          created_by: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          colaborador_id: string
          conteudo: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          colaborador_id?: string
          conteudo?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "colaborador_notas_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
        ]
      }
      colaboradores: {
        Row: {
          area: string
          ativo: boolean | null
          can_approve_devolucoes: boolean | null
          can_approve_materiais: boolean | null
          can_approve_notas: boolean | null
          can_approve_reembolsos: boolean | null
          chave_pix_cnpj: string | null
          cnpj: string | null
          cpf: string
          created_at: string | null
          created_by: string | null
          data_fim_contrato: string | null
          data_inicio_contrato: string
          data_nascimento: string | null
          email: string
          endereco: string | null
          funcao: string
          has_admin_view_access: boolean | null
          has_finance_access: boolean | null
          has_finance_view_access: boolean | null
          id: string
          is_admin: boolean | null
          nome: string
          regra_ote: string | null
          remuneracao: number
          updated_at: string | null
          user_id: string | null
          variavel: string | null
        }
        Insert: {
          area: string
          ativo?: boolean | null
          can_approve_devolucoes?: boolean | null
          can_approve_materiais?: boolean | null
          can_approve_notas?: boolean | null
          can_approve_reembolsos?: boolean | null
          chave_pix_cnpj?: string | null
          cnpj?: string | null
          cpf: string
          created_at?: string | null
          created_by?: string | null
          data_fim_contrato?: string | null
          data_inicio_contrato: string
          data_nascimento?: string | null
          email: string
          endereco?: string | null
          funcao: string
          has_admin_view_access?: boolean | null
          has_finance_access?: boolean | null
          has_finance_view_access?: boolean | null
          id?: string
          is_admin?: boolean | null
          nome: string
          regra_ote?: string | null
          remuneracao: number
          updated_at?: string | null
          user_id?: string | null
          variavel?: string | null
        }
        Update: {
          area?: string
          ativo?: boolean | null
          can_approve_devolucoes?: boolean | null
          can_approve_materiais?: boolean | null
          can_approve_notas?: boolean | null
          can_approve_reembolsos?: boolean | null
          chave_pix_cnpj?: string | null
          cnpj?: string | null
          cpf?: string
          created_at?: string | null
          created_by?: string | null
          data_fim_contrato?: string | null
          data_inicio_contrato?: string
          data_nascimento?: string | null
          email?: string
          endereco?: string | null
          funcao?: string
          has_admin_view_access?: boolean | null
          has_finance_access?: boolean | null
          has_finance_view_access?: boolean | null
          id?: string
          is_admin?: boolean | null
          nome?: string
          regra_ote?: string | null
          remuneracao?: number
          updated_at?: string | null
          user_id?: string | null
          variavel?: string | null
        }
        Relationships: []
      }
      contas_financeiras: {
        Row: {
          ativo: boolean
          conta_no_disponivel: boolean
          conta_pagamento_id: string | null
          created_at: string
          created_by: string | null
          dia_vencimento: number | null
          empresa_id: string
          final_cartao: string | null
          id: string
          moeda: string
          nome: string
          tipo: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          conta_no_disponivel?: boolean
          conta_pagamento_id?: string | null
          created_at?: string
          created_by?: string | null
          dia_vencimento?: number | null
          empresa_id: string
          final_cartao?: string | null
          id?: string
          moeda?: string
          nome: string
          tipo: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          conta_no_disponivel?: boolean
          conta_pagamento_id?: string | null
          created_at?: string
          created_by?: string | null
          dia_vencimento?: number | null
          empresa_id?: string
          final_cartao?: string | null
          id?: string
          moeda?: string
          nome?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contas_financeiras_conta_pagamento_id_fkey"
            columns: ["conta_pagamento_id"]
            isOneToOne: false
            referencedRelation: "contas_financeiras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_financeiras_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      contas_pagar: {
        Row: {
          categoria_id: string | null
          centro_custo: string | null
          comprovante_url: string | null
          created_at: string
          created_by: string | null
          data_pagamento: string | null
          data_vencimento: string
          descricao: string
          empresa_id: string | null
          forma_pagamento: string | null
          fornecedor_id: string | null
          id: string
          lancamento_id: string | null
          observacoes: string | null
          origem: string
          parcela: number
          status: string
          total_parcelas: number
          updated_at: string
          valor: number
          valor_pago: number
          veiculo_id: string | null
        }
        Insert: {
          categoria_id?: string | null
          centro_custo?: string | null
          comprovante_url?: string | null
          created_at?: string
          created_by?: string | null
          data_pagamento?: string | null
          data_vencimento: string
          descricao: string
          empresa_id?: string | null
          forma_pagamento?: string | null
          fornecedor_id?: string | null
          id?: string
          lancamento_id?: string | null
          observacoes?: string | null
          origem?: string
          parcela?: number
          status?: string
          total_parcelas?: number
          updated_at?: string
          valor: number
          valor_pago?: number
          veiculo_id?: string | null
        }
        Update: {
          categoria_id?: string | null
          centro_custo?: string | null
          comprovante_url?: string | null
          created_at?: string
          created_by?: string | null
          data_pagamento?: string | null
          data_vencimento?: string
          descricao?: string
          empresa_id?: string | null
          forma_pagamento?: string | null
          fornecedor_id?: string | null
          id?: string
          lancamento_id?: string | null
          observacoes?: string | null
          origem?: string
          parcela?: number
          status?: string
          total_parcelas?: number
          updated_at?: string
          valor?: number
          valor_pago?: number
          veiculo_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contas_pagar_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "despesa_categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_pagar_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_pagar_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_pagar_lancamento_id_fkey"
            columns: ["lancamento_id"]
            isOneToOne: false
            referencedRelation: "lancamentos_empresa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_pagar_veiculo_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      contas_receber: {
        Row: {
          cliente_id: string
          contrato_id: string | null
          created_at: string
          created_by: string | null
          data_vencimento: string
          descricao: string
          empresa_id: string | null
          forma_pagamento: string | null
          id: string
          observacoes: string | null
          parcela: number
          status: string
          total_parcelas: number
          updated_at: string
          valor: number
          valor_pago: number
        }
        Insert: {
          cliente_id: string
          contrato_id?: string | null
          created_at?: string
          created_by?: string | null
          data_vencimento: string
          descricao: string
          empresa_id?: string | null
          forma_pagamento?: string | null
          id?: string
          observacoes?: string | null
          parcela?: number
          status?: string
          total_parcelas?: number
          updated_at?: string
          valor: number
          valor_pago?: number
        }
        Update: {
          cliente_id?: string
          contrato_id?: string | null
          created_at?: string
          created_by?: string | null
          data_vencimento?: string
          descricao?: string
          empresa_id?: string | null
          forma_pagamento?: string | null
          id?: string
          observacoes?: string | null
          parcela?: number
          status?: string
          total_parcelas?: number
          updated_at?: string
          valor?: number
          valor_pago?: number
        }
        Relationships: [
          {
            foreignKeyName: "contas_receber_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_receber_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "cliente_contratos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_receber_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      contratos_itens: {
        Row: {
          contrato_id: string
          created_at: string
          descricao: string
          id: string
          produto_id: string | null
          quantidade: number
          valor_unitario: number
        }
        Insert: {
          contrato_id: string
          created_at?: string
          descricao: string
          id?: string
          produto_id?: string | null
          quantidade?: number
          valor_unitario?: number
        }
        Update: {
          contrato_id?: string
          created_at?: string
          descricao?: string
          id?: string
          produto_id?: string | null
          quantidade?: number
          valor_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: "contratos_itens_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "cliente_contratos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratos_itens_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos_servicos"
            referencedColumns: ["id"]
          },
        ]
      }
      despesa_categorias: {
        Row: {
          ativo: boolean
          centro_custo_sugerido: string | null
          created_at: string
          id: string
          nome: string
          palavras_chave: string[] | null
        }
        Insert: {
          ativo?: boolean
          centro_custo_sugerido?: string | null
          created_at?: string
          id?: string
          nome: string
          palavras_chave?: string[] | null
        }
        Update: {
          ativo?: boolean
          centro_custo_sugerido?: string | null
          created_at?: string
          id?: string
          nome?: string
          palavras_chave?: string[] | null
        }
        Relationships: []
      }
      devolucao_anexos: {
        Row: {
          arquivo_url: string
          created_at: string | null
          descricao: string
          devolucao_id: string
          id: string
          ordem: number | null
        }
        Insert: {
          arquivo_url: string
          created_at?: string | null
          descricao: string
          devolucao_id: string
          id?: string
          ordem?: number | null
        }
        Update: {
          arquivo_url?: string
          created_at?: string | null
          descricao?: string
          devolucao_id?: string
          id?: string
          ordem?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "devolucao_anexos_devolucao_id_fkey"
            columns: ["devolucao_id"]
            isOneToOne: false
            referencedRelation: "devolucoes"
            referencedColumns: ["id"]
          },
        ]
      }
      devolucoes: {
        Row: {
          chave_pix: string
          comprovante_original_url: string | null
          created_at: string | null
          data_prevista_pagamento: string | null
          id: string
          link_venda_hubla: string
          motivo: string
          nome_cliente: string
          responsavel: string
          status: string | null
          status_comentario: string | null
          tipo_chave_pix: string
          updated_at: string | null
          user_id: string
          valor: number
        }
        Insert: {
          chave_pix?: string
          comprovante_original_url?: string | null
          created_at?: string | null
          data_prevista_pagamento?: string | null
          id?: string
          link_venda_hubla: string
          motivo: string
          nome_cliente: string
          responsavel: string
          status?: string | null
          status_comentario?: string | null
          tipo_chave_pix?: string
          updated_at?: string | null
          user_id: string
          valor: number
        }
        Update: {
          chave_pix?: string
          comprovante_original_url?: string | null
          created_at?: string | null
          data_prevista_pagamento?: string | null
          id?: string
          link_venda_hubla?: string
          motivo?: string
          nome_cliente?: string
          responsavel?: string
          status?: string | null
          status_comentario?: string | null
          tipo_chave_pix?: string
          updated_at?: string | null
          user_id?: string
          valor?: number
        }
        Relationships: []
      }
      director_bonus_config: {
        Row: {
          annual_base: number
          created_at: string | null
          director_id: string
          id: string
          quarterly_base: number
          updated_at: string | null
          year: number
        }
        Insert: {
          annual_base: number
          created_at?: string | null
          director_id: string
          id?: string
          quarterly_base: number
          updated_at?: string | null
          year: number
        }
        Update: {
          annual_base?: number
          created_at?: string | null
          director_id?: string
          id?: string
          quarterly_base?: number
          updated_at?: string | null
          year?: number
        }
        Relationships: []
      }
      drafts: {
        Row: {
          created_at: string | null
          data: Json
          id: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data: Json
          id?: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json
          id?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      empresa_usuarios: {
        Row: {
          created_at: string
          empresa_id: string
          id: string
          papel: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          empresa_id: string
          id?: string
          papel?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          empresa_id?: string
          id?: string
          papel?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "empresa_usuarios_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      empresas: {
        Row: {
          ativo: boolean
          cep: string | null
          cidade: string | null
          cnpj: string | null
          cor: string
          created_at: string
          email: string | null
          endereco: string | null
          id: string
          nome: string
          ordem: number
          razao_social: string | null
          responsavel_id: string | null
          slug: string
          telefone: string | null
          uf: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          cor?: string
          created_at?: string
          email?: string | null
          endereco?: string | null
          id?: string
          nome: string
          ordem?: number
          razao_social?: string | null
          responsavel_id?: string | null
          slug: string
          telefone?: string | null
          uf?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          cor?: string
          created_at?: string
          email?: string | null
          endereco?: string | null
          id?: string
          nome?: string
          ordem?: number
          razao_social?: string | null
          responsavel_id?: string | null
          slug?: string
          telefone?: string | null
          uf?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "empresas_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
        ]
      }
      equipamento_fotos: {
        Row: {
          arquivo_url: string
          created_at: string | null
          descricao: string | null
          equipamento_id: string
          id: string
          ordem: number | null
          uploaded_by: string | null
        }
        Insert: {
          arquivo_url: string
          created_at?: string | null
          descricao?: string | null
          equipamento_id: string
          id?: string
          ordem?: number | null
          uploaded_by?: string | null
        }
        Update: {
          arquivo_url?: string
          created_at?: string | null
          descricao?: string | null
          equipamento_id?: string
          id?: string
          ordem?: number | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipamento_fotos_equipamento_id_fkey"
            columns: ["equipamento_id"]
            isOneToOne: false
            referencedRelation: "equipamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      equipamentos: {
        Row: {
          ativo: boolean | null
          colaborador_id: string | null
          created_at: string | null
          data_aquisicao: string | null
          estado: string
          id: string
          marca: string | null
          modelo: string | null
          nome: string
          numero_serie: string | null
          observacoes: string | null
          patrimonio: string | null
          tipo: string
          updated_at: string | null
          valor: number | null
        }
        Insert: {
          ativo?: boolean | null
          colaborador_id?: string | null
          created_at?: string | null
          data_aquisicao?: string | null
          estado?: string
          id?: string
          marca?: string | null
          modelo?: string | null
          nome: string
          numero_serie?: string | null
          observacoes?: string | null
          patrimonio?: string | null
          tipo: string
          updated_at?: string | null
          valor?: number | null
        }
        Update: {
          ativo?: boolean | null
          colaborador_id?: string | null
          created_at?: string | null
          data_aquisicao?: string | null
          estado?: string
          id?: string
          marca?: string | null
          modelo?: string | null
          nome?: string
          numero_serie?: string | null
          observacoes?: string | null
          patrimonio?: string | null
          tipo?: string
          updated_at?: string | null
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "equipamentos_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
        ]
      }
      ferramentas: {
        Row: {
          ativo: boolean
          cartao_cadastrado: string | null
          centro_custo: string | null
          created_at: string
          data_cancelamento: string | null
          data_inicio: string | null
          id: string
          link_acesso: string | null
          login_gmail: boolean
          nome: string
          observacoes: string | null
          responsavel_id: string | null
          senha: string | null
          tipo_pagamento: string | null
          updated_at: string
          usuario: string | null
          valor: number | null
        }
        Insert: {
          ativo?: boolean
          cartao_cadastrado?: string | null
          centro_custo?: string | null
          created_at?: string
          data_cancelamento?: string | null
          data_inicio?: string | null
          id?: string
          link_acesso?: string | null
          login_gmail?: boolean
          nome: string
          observacoes?: string | null
          responsavel_id?: string | null
          senha?: string | null
          tipo_pagamento?: string | null
          updated_at?: string
          usuario?: string | null
          valor?: number | null
        }
        Update: {
          ativo?: boolean
          cartao_cadastrado?: string | null
          centro_custo?: string | null
          created_at?: string
          data_cancelamento?: string | null
          data_inicio?: string | null
          id?: string
          link_acesso?: string | null
          login_gmail?: boolean
          nome?: string
          observacoes?: string | null
          responsavel_id?: string | null
          senha?: string | null
          tipo_pagamento?: string | null
          updated_at?: string
          usuario?: string | null
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ferramentas_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_config: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          value: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: number
        }
        Relationships: []
      }
      financial_periods: {
        Row: {
          created_at: string | null
          end_date: string
          id: string
          initial_cash_balance: number | null
          name: string
          start_date: string
          status: Database["public"]["Enums"]["period_status"] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          end_date: string
          id?: string
          initial_cash_balance?: number | null
          name: string
          start_date: string
          status?: Database["public"]["Enums"]["period_status"] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          end_date?: string
          id?: string
          initial_cash_balance?: number | null
          name?: string
          start_date?: string
          status?: Database["public"]["Enums"]["period_status"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      fornecedores: {
        Row: {
          ativo: boolean
          categoria: string | null
          cpf_cnpj: string | null
          created_at: string
          email: string | null
          id: string
          nome: string
          observacoes: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          ativo?: boolean
          categoria?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          ativo?: boolean
          categoria?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      goals: {
        Row: {
          achieved_value: number | null
          created_at: string | null
          description: string | null
          id: string
          period_id: string
          target_value: number
          type: Database["public"]["Enums"]["goal_type"]
          updated_at: string | null
        }
        Insert: {
          achieved_value?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          period_id: string
          target_value: number
          type: Database["public"]["Enums"]["goal_type"]
          updated_at?: string | null
        }
        Update: {
          achieved_value?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          period_id?: string
          target_value?: number
          type?: Database["public"]["Enums"]["goal_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "goals_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "financial_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      historico_alteracoes: {
        Row: {
          acao: string
          changed_by: string | null
          created_at: string
          id: string
          registro_id: string | null
          tabela: string
          valor_anterior: Json | null
          valor_novo: Json | null
        }
        Insert: {
          acao: string
          changed_by?: string | null
          created_at?: string
          id?: string
          registro_id?: string | null
          tabela: string
          valor_anterior?: Json | null
          valor_novo?: Json | null
        }
        Update: {
          acao?: string
          changed_by?: string | null
          created_at?: string
          id?: string
          registro_id?: string | null
          tabela?: string
          valor_anterior?: Json | null
          valor_novo?: Json | null
        }
        Relationships: []
      }
      hotmart_webhook_events: {
        Row: {
          created_at: string
          error: string | null
          event: string | null
          event_id: string | null
          id: string
          occurred_at: string | null
          payload: Json
          processed: boolean
          processed_at: string | null
          version: string | null
        }
        Insert: {
          created_at?: string
          error?: string | null
          event?: string | null
          event_id?: string | null
          id?: string
          occurred_at?: string | null
          payload: Json
          processed?: boolean
          processed_at?: string | null
          version?: string | null
        }
        Update: {
          created_at?: string
          error?: string | null
          event?: string | null
          event_id?: string | null
          id?: string
          occurred_at?: string | null
          payload?: Json
          processed?: boolean
          processed_at?: string | null
          version?: string | null
        }
        Relationships: []
      }
      hubla_webhook_events: {
        Row: {
          amount_cents: number | null
          created_at: string | null
          event_type: string
          id: string
          installment: number | null
          payer_document: string | null
          payer_email: string | null
          payer_id: string | null
          payer_name: string | null
          payer_phone: string | null
          payload: Json
          payment_method: string | null
          processed: boolean | null
          processed_at: string | null
          product_id: string | null
          product_name: string | null
          seller_id: string | null
          smart_installment_id: string | null
          source_invoice_id: string | null
          status: string | null
          subscription_id: string | null
          total_installments: number | null
        }
        Insert: {
          amount_cents?: number | null
          created_at?: string | null
          event_type: string
          id?: string
          installment?: number | null
          payer_document?: string | null
          payer_email?: string | null
          payer_id?: string | null
          payer_name?: string | null
          payer_phone?: string | null
          payload: Json
          payment_method?: string | null
          processed?: boolean | null
          processed_at?: string | null
          product_id?: string | null
          product_name?: string | null
          seller_id?: string | null
          smart_installment_id?: string | null
          source_invoice_id?: string | null
          status?: string | null
          subscription_id?: string | null
          total_installments?: number | null
        }
        Update: {
          amount_cents?: number | null
          created_at?: string | null
          event_type?: string
          id?: string
          installment?: number | null
          payer_document?: string | null
          payer_email?: string | null
          payer_id?: string | null
          payer_name?: string | null
          payer_phone?: string | null
          payload?: Json
          payment_method?: string | null
          processed?: boolean | null
          processed_at?: string | null
          product_id?: string | null
          product_name?: string | null
          seller_id?: string | null
          smart_installment_id?: string | null
          source_invoice_id?: string | null
          status?: string | null
          subscription_id?: string | null
          total_installments?: number | null
        }
        Relationships: []
      }
      lancamento_anexos: {
        Row: {
          arquivo_url: string
          created_at: string
          descricao: string
          id: string
          lancamento_id: string
          uploaded_by: string | null
        }
        Insert: {
          arquivo_url: string
          created_at?: string
          descricao: string
          id?: string
          lancamento_id: string
          uploaded_by?: string | null
        }
        Update: {
          arquivo_url?: string
          created_at?: string
          descricao?: string
          id?: string
          lancamento_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lancamento_anexos_lancamento_id_fkey"
            columns: ["lancamento_id"]
            isOneToOne: false
            referencedRelation: "lancamentos_empresa"
            referencedColumns: ["id"]
          },
        ]
      }
      lancamentos: {
        Row: {
          categoria_id: string | null
          centro_custo_id: string | null
          conta_id: string | null
          contraparte: string | null
          cotacao: number | null
          created_at: string
          created_by: string | null
          data_caixa: string | null
          data_competencia: string | null
          descricao: string
          empresa_id: string
          external_id: string | null
          hash_dedup: string | null
          id: string
          import_batch_id: string | null
          moeda_original: string
          observacao: string | null
          pago_por_socio: string | null
          produto: string | null
          raw: Json | null
          regra_id: string | null
          source: string
          status: string
          status_classificacao: string
          tipo: string | null
          updated_at: string
          valor_brl: number | null
          valor_original: number
        }
        Insert: {
          categoria_id?: string | null
          centro_custo_id?: string | null
          conta_id?: string | null
          contraparte?: string | null
          cotacao?: number | null
          created_at?: string
          created_by?: string | null
          data_caixa?: string | null
          data_competencia?: string | null
          descricao?: string
          empresa_id: string
          external_id?: string | null
          hash_dedup?: string | null
          id?: string
          import_batch_id?: string | null
          moeda_original?: string
          observacao?: string | null
          pago_por_socio?: string | null
          produto?: string | null
          raw?: Json | null
          regra_id?: string | null
          source?: string
          status?: string
          status_classificacao?: string
          tipo?: string | null
          updated_at?: string
          valor_brl?: number | null
          valor_original?: number
        }
        Update: {
          categoria_id?: string | null
          centro_custo_id?: string | null
          conta_id?: string | null
          contraparte?: string | null
          cotacao?: number | null
          created_at?: string
          created_by?: string | null
          data_caixa?: string | null
          data_competencia?: string | null
          descricao?: string
          empresa_id?: string
          external_id?: string | null
          hash_dedup?: string | null
          id?: string
          import_batch_id?: string | null
          moeda_original?: string
          observacao?: string | null
          pago_por_socio?: string | null
          produto?: string | null
          raw?: Json | null
          regra_id?: string | null
          source?: string
          status?: string
          status_classificacao?: string
          tipo?: string | null
          updated_at?: string
          valor_brl?: number | null
          valor_original?: number
        }
        Relationships: [
          {
            foreignKeyName: "lancamentos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_financeiras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_centro_custo_id_fkey"
            columns: ["centro_custo_id"]
            isOneToOne: false
            referencedRelation: "centros_custo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "contas_financeiras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_regra_id_fkey"
            columns: ["regra_id"]
            isOneToOne: false
            referencedRelation: "regras_classificacao"
            referencedColumns: ["id"]
          },
        ]
      }
      lancamentos_auditoria: {
        Row: {
          acao: string
          changed_by: string | null
          created_at: string
          descricao: string | null
          empresa_id: string | null
          id: string
          lancamento_id: string
          valor_anterior: Json | null
          valor_novo: Json | null
        }
        Insert: {
          acao: string
          changed_by?: string | null
          created_at?: string
          descricao?: string | null
          empresa_id?: string | null
          id?: string
          lancamento_id: string
          valor_anterior?: Json | null
          valor_novo?: Json | null
        }
        Update: {
          acao?: string
          changed_by?: string | null
          created_at?: string
          descricao?: string | null
          empresa_id?: string | null
          id?: string
          lancamento_id?: string
          valor_anterior?: Json | null
          valor_novo?: Json | null
        }
        Relationships: []
      }
      lancamentos_empresa: {
        Row: {
          categoria: string | null
          centro_custo: string | null
          comprovante_url: string | null
          created_at: string
          created_by: string | null
          data_competencia: string
          data_pagamento: string | null
          descricao: string
          empresa_id: string
          fornecedor_cliente: string | null
          id: string
          observacoes: string | null
          recorrencia_id: string | null
          status: string
          tipo: string
          updated_at: string
          valor: number
        }
        Insert: {
          categoria?: string | null
          centro_custo?: string | null
          comprovante_url?: string | null
          created_at?: string
          created_by?: string | null
          data_competencia: string
          data_pagamento?: string | null
          descricao: string
          empresa_id: string
          fornecedor_cliente?: string | null
          id?: string
          observacoes?: string | null
          recorrencia_id?: string | null
          status?: string
          tipo: string
          updated_at?: string
          valor: number
        }
        Update: {
          categoria?: string | null
          centro_custo?: string | null
          comprovante_url?: string | null
          created_at?: string
          created_by?: string | null
          data_competencia?: string
          data_pagamento?: string | null
          descricao?: string
          empresa_id?: string
          fornecedor_cliente?: string | null
          id?: string
          observacoes?: string | null
          recorrencia_id?: string | null
          status?: string
          tipo?: string
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "lancamentos_empresa_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_empresa_recorrencia_id_fkey"
            columns: ["recorrencia_id"]
            isOneToOne: false
            referencedRelation: "recorrencias_lancamento"
            referencedColumns: ["id"]
          },
        ]
      }
      marvee_category_mapping: {
        Row: {
          cash_flow_category_code: string
          created_at: string | null
          id: string
          is_active: boolean | null
          marvee_category_description: string | null
          marvee_category_structure: string | null
          marvee_cost_center_id: string | null
          marvee_cost_center_name: string | null
          updated_at: string | null
        }
        Insert: {
          cash_flow_category_code: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          marvee_category_description?: string | null
          marvee_category_structure?: string | null
          marvee_cost_center_id?: string | null
          marvee_cost_center_name?: string | null
          updated_at?: string | null
        }
        Update: {
          cash_flow_category_code?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          marvee_category_description?: string | null
          marvee_category_structure?: string | null
          marvee_cost_center_id?: string | null
          marvee_cost_center_name?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marvee_category_mapping_cash_flow_category_code_fkey"
            columns: ["cash_flow_category_code"]
            isOneToOne: false
            referencedRelation: "cash_flow_categories"
            referencedColumns: ["code"]
          },
        ]
      }
      marvee_extrato: {
        Row: {
          account_bank_code: string | null
          account_id: number | null
          account_name: string | null
          category_description: string | null
          category_structure: string | null
          comments: string | null
          consolidated: boolean
          cost_center_name: string | null
          created_at: string | null
          document_code: string | null
          document_description: string | null
          document_id: number | null
          generation_date: string | null
          guid: string
          id: string
          installment_id: number | null
          month: string
          movement_date: string
          movement_value: number
          payment_method: string | null
          people_name: string | null
          raw_payload: Json | null
          source: string
          synced_at: string | null
          type_column: string
          type_sign: number
        }
        Insert: {
          account_bank_code?: string | null
          account_id?: number | null
          account_name?: string | null
          category_description?: string | null
          category_structure?: string | null
          comments?: string | null
          consolidated?: boolean
          cost_center_name?: string | null
          created_at?: string | null
          document_code?: string | null
          document_description?: string | null
          document_id?: number | null
          generation_date?: string | null
          guid: string
          id?: string
          installment_id?: number | null
          month: string
          movement_date: string
          movement_value: number
          payment_method?: string | null
          people_name?: string | null
          raw_payload?: Json | null
          source: string
          synced_at?: string | null
          type_column: string
          type_sign: number
        }
        Update: {
          account_bank_code?: string | null
          account_id?: number | null
          account_name?: string | null
          category_description?: string | null
          category_structure?: string | null
          comments?: string | null
          consolidated?: boolean
          cost_center_name?: string | null
          created_at?: string | null
          document_code?: string | null
          document_description?: string | null
          document_id?: number | null
          generation_date?: string | null
          guid?: string
          id?: string
          installment_id?: number | null
          month?: string
          movement_date?: string
          movement_value?: number
          payment_method?: string | null
          people_name?: string | null
          raw_payload?: Json | null
          source?: string
          synced_at?: string | null
          type_column?: string
          type_sign?: number
        }
        Relationships: []
      }
      marvee_extrato_consolidated_months: {
        Row: {
          consolidated_at: string
          created_at: string
          month: string
        }
        Insert: {
          consolidated_at?: string
          created_at?: string
          month: string
        }
        Update: {
          consolidated_at?: string
          created_at?: string
          month?: string
        }
        Relationships: []
      }
      marvee_sync_logs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          id: string
          records_created: number | null
          records_processed: number | null
          records_updated: number | null
          started_at: string
          status: string
          sync_type: string
          triggered_by: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          records_created?: number | null
          records_processed?: number | null
          records_updated?: number | null
          started_at: string
          status: string
          sync_type: string
          triggered_by?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          records_created?: number | null
          records_processed?: number | null
          records_updated?: number | null
          started_at?: string
          status?: string
          sync_type?: string
          triggered_by?: string | null
        }
        Relationships: []
      }
      marvee_transactions: {
        Row: {
          category_level_1_description: string | null
          category_level_1_id: number | null
          category_level_1_structure: string | null
          category_level_2_description: string | null
          category_level_2_id: number | null
          category_level_2_structure: string | null
          category_level_3_description: string | null
          category_level_3_id: number | null
          category_level_3_structure: string | null
          cost_center_name: string | null
          created_at: string | null
          description: string | null
          document_number: string | null
          expiration_date: string | null
          generation_date: string | null
          id: string
          installment: number | null
          marvee_id: number
          movement_value: number
          original_value: number | null
          payment_date: string | null
          payment_method: string | null
          people_fantasy_name: string | null
          people_name: string | null
          raw_payload: Json | null
          source_type: string
          status: string
          synced_at: string | null
        }
        Insert: {
          category_level_1_description?: string | null
          category_level_1_id?: number | null
          category_level_1_structure?: string | null
          category_level_2_description?: string | null
          category_level_2_id?: number | null
          category_level_2_structure?: string | null
          category_level_3_description?: string | null
          category_level_3_id?: number | null
          category_level_3_structure?: string | null
          cost_center_name?: string | null
          created_at?: string | null
          description?: string | null
          document_number?: string | null
          expiration_date?: string | null
          generation_date?: string | null
          id?: string
          installment?: number | null
          marvee_id: number
          movement_value?: number
          original_value?: number | null
          payment_date?: string | null
          payment_method?: string | null
          people_fantasy_name?: string | null
          people_name?: string | null
          raw_payload?: Json | null
          source_type: string
          status: string
          synced_at?: string | null
        }
        Update: {
          category_level_1_description?: string | null
          category_level_1_id?: number | null
          category_level_1_structure?: string | null
          category_level_2_description?: string | null
          category_level_2_id?: number | null
          category_level_2_structure?: string | null
          category_level_3_description?: string | null
          category_level_3_id?: number | null
          category_level_3_structure?: string | null
          cost_center_name?: string | null
          created_at?: string | null
          description?: string | null
          document_number?: string | null
          expiration_date?: string | null
          generation_date?: string | null
          id?: string
          installment?: number | null
          marvee_id?: number
          movement_value?: number
          original_value?: number | null
          payment_date?: string | null
          payment_method?: string | null
          people_fantasy_name?: string | null
          people_name?: string | null
          raw_payload?: Json | null
          source_type?: string
          status?: string
          synced_at?: string | null
        }
        Relationships: []
      }
      materiais: {
        Row: {
          centro_custo: string
          created_at: string
          id: string
          justificativa: string
          material: string
          nome_solicitante: string
          status: string
          status_comentario: string | null
          updated_at: string
          user_id: string
          valor_total: number | null
        }
        Insert: {
          centro_custo: string
          created_at?: string
          id?: string
          justificativa: string
          material: string
          nome_solicitante: string
          status?: string
          status_comentario?: string | null
          updated_at?: string
          user_id: string
          valor_total?: number | null
        }
        Update: {
          centro_custo?: string
          created_at?: string
          id?: string
          justificativa?: string
          material?: string
          nome_solicitante?: string
          status?: string
          status_comentario?: string | null
          updated_at?: string
          user_id?: string
          valor_total?: number | null
        }
        Relationships: []
      }
      material_itens: {
        Row: {
          created_at: string | null
          descricao: string
          id: string
          link: string | null
          material_id: string
          quantidade: number
          valor: number
        }
        Insert: {
          created_at?: string | null
          descricao: string
          id?: string
          link?: string | null
          material_id: string
          quantidade?: number
          valor?: number
        }
        Update: {
          created_at?: string | null
          descricao?: string
          id?: string
          link?: string | null
          material_id?: string
          quantidade?: number
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "material_itens_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materiais"
            referencedColumns: ["id"]
          },
        ]
      }
      modelos_contrato: {
        Row: {
          cargo_funcao: string
          conteudo: string
          created_at: string | null
          id: string
          is_default: boolean | null
          nome: string
          updated_at: string | null
        }
        Insert: {
          cargo_funcao: string
          conteudo: string
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          nome: string
          updated_at?: string | null
        }
        Update: {
          cargo_funcao?: string
          conteudo?: string
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          nome?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      monthly_planning: {
        Row: {
          created_at: string | null
          distribution: number | null
          expense: number | null
          forecast_expense: number | null
          forecast_revenue: number | null
          id: string
          initial_balance: number | null
          month: string
          notes: string | null
          other_expense: number | null
          other_revenue: number | null
          planned_expense: number | null
          planned_revenue: number | null
          platform_fee: number | null
          revenue: number | null
          revenue_new_sales: number | null
          revenue_recurring_previous: number | null
          tax: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          distribution?: number | null
          expense?: number | null
          forecast_expense?: number | null
          forecast_revenue?: number | null
          id?: string
          initial_balance?: number | null
          month: string
          notes?: string | null
          other_expense?: number | null
          other_revenue?: number | null
          planned_expense?: number | null
          planned_revenue?: number | null
          platform_fee?: number | null
          revenue?: number | null
          revenue_new_sales?: number | null
          revenue_recurring_previous?: number | null
          tax?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          distribution?: number | null
          expense?: number | null
          forecast_expense?: number | null
          forecast_revenue?: number | null
          id?: string
          initial_balance?: number | null
          month?: string
          notes?: string | null
          other_expense?: number | null
          other_revenue?: number | null
          planned_expense?: number | null
          planned_revenue?: number | null
          platform_fee?: number | null
          revenue?: number | null
          revenue_new_sales?: number | null
          revenue_recurring_previous?: number | null
          tax?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      monthly_targets: {
        Row: {
          created_at: string | null
          id: string
          month: string
          notes: string | null
          revenue_target: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          month: string
          notes?: string | null
          revenue_target?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          month?: string
          notes?: string | null
          revenue_target?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      nota_fiscal_anexos: {
        Row: {
          arquivo_url: string
          created_at: string | null
          descricao: string
          id: string
          nota_fiscal_id: string
          ordem: number | null
        }
        Insert: {
          arquivo_url: string
          created_at?: string | null
          descricao: string
          id?: string
          nota_fiscal_id: string
          ordem?: number | null
        }
        Update: {
          arquivo_url?: string
          created_at?: string | null
          descricao?: string
          id?: string
          nota_fiscal_id?: string
          ordem?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "nota_fiscal_anexos_nota_fiscal_id_fkey"
            columns: ["nota_fiscal_id"]
            isOneToOne: false
            referencedRelation: "notas_fiscais"
            referencedColumns: ["id"]
          },
        ]
      }
      notas_fiscais: {
        Row: {
          agencia: string | null
          banco: string | null
          chave_pix: string
          cnpj: string
          conta: string | null
          created_at: string | null
          descricao: string | null
          id: string
          mes_pagamento: string | null
          nome: string
          nota_url: string
          periodo_referencia: string
          status: string | null
          status_comentario: string | null
          tipo_chave_pix: string | null
          tipo_conta: string | null
          updated_at: string | null
          user_id: string
          valor: number
        }
        Insert: {
          agencia?: string | null
          banco?: string | null
          chave_pix?: string
          cnpj: string
          conta?: string | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          mes_pagamento?: string | null
          nome: string
          nota_url: string
          periodo_referencia: string
          status?: string | null
          status_comentario?: string | null
          tipo_chave_pix?: string | null
          tipo_conta?: string | null
          updated_at?: string | null
          user_id: string
          valor: number
        }
        Update: {
          agencia?: string | null
          banco?: string | null
          chave_pix?: string
          cnpj?: string
          conta?: string | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          mes_pagamento?: string | null
          nome?: string
          nota_url?: string
          periodo_referencia?: string
          status?: string | null
          status_comentario?: string | null
          tipo_chave_pix?: string | null
          tipo_conta?: string | null
          updated_at?: string | null
          user_id?: string
          valor?: number
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action: string
          created_at: string | null
          id: string
          message: string
          read: boolean | null
          reference_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          message: string
          read?: boolean | null
          reference_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          message?: string
          read?: boolean | null
          reference_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      parcelamento_dashboard_data: {
        Row: {
          card_data: Json
          card_name: string
          created_at: string
          id: string
          synced_at: string
        }
        Insert: {
          card_data?: Json
          card_name: string
          created_at?: string
          id?: string
          synced_at?: string
        }
        Update: {
          card_data?: Json
          card_name?: string
          created_at?: string
          id?: string
          synced_at?: string
        }
        Relationships: []
      }
      produtos_servicos: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string | null
          id: string
          nome: string
          tipo: string
          updated_at: string
          valor_padrao: number | null
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          tipo?: string
          updated_at?: string
          valor_padrao?: number | null
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          tipo?: string
          updated_at?: string
          valor_padrao?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          chave_pix: string | null
          created_at: string | null
          email: string | null
          id: string
          nome_completo: string | null
          tipo_chave_pix: string | null
          updated_at: string | null
        }
        Insert: {
          chave_pix?: string | null
          created_at?: string | null
          email?: string | null
          id: string
          nome_completo?: string | null
          tipo_chave_pix?: string | null
          updated_at?: string | null
        }
        Update: {
          chave_pix?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          nome_completo?: string | null
          tipo_chave_pix?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      recebimentos: {
        Row: {
          conta_receber_id: string
          created_at: string
          created_by: string | null
          data_pagamento: string
          forma_pagamento: string | null
          id: string
          observacoes: string | null
          valor: number
        }
        Insert: {
          conta_receber_id: string
          created_at?: string
          created_by?: string | null
          data_pagamento?: string
          forma_pagamento?: string | null
          id?: string
          observacoes?: string | null
          valor: number
        }
        Update: {
          conta_receber_id?: string
          created_at?: string
          created_by?: string | null
          data_pagamento?: string
          forma_pagamento?: string | null
          id?: string
          observacoes?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "recebimentos_conta_receber_id_fkey"
            columns: ["conta_receber_id"]
            isOneToOne: false
            referencedRelation: "contas_receber"
            referencedColumns: ["id"]
          },
        ]
      }
      recorrencia_geracoes: {
        Row: {
          gerado_em: string
          id: string
          lancamento_id: string | null
          mes_referencia: string
          recorrencia_id: string
        }
        Insert: {
          gerado_em?: string
          id?: string
          lancamento_id?: string | null
          mes_referencia: string
          recorrencia_id: string
        }
        Update: {
          gerado_em?: string
          id?: string
          lancamento_id?: string | null
          mes_referencia?: string
          recorrencia_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recorrencia_geracoes_lancamento_id_fkey"
            columns: ["lancamento_id"]
            isOneToOne: false
            referencedRelation: "lancamentos_empresa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recorrencia_geracoes_recorrencia_id_fkey"
            columns: ["recorrencia_id"]
            isOneToOne: false
            referencedRelation: "recorrencias_lancamento"
            referencedColumns: ["id"]
          },
        ]
      }
      recorrencias_lancamento: {
        Row: {
          ativo: boolean
          categoria: string | null
          centro_custo: string | null
          created_at: string
          created_by: string | null
          data_fim: string | null
          data_inicio: string
          descricao: string
          dia_vencimento: number
          empresa_id: string
          fornecedor_cliente: string | null
          id: string
          tipo: string
          updated_at: string
          valor: number
        }
        Insert: {
          ativo?: boolean
          categoria?: string | null
          centro_custo?: string | null
          created_at?: string
          created_by?: string | null
          data_fim?: string | null
          data_inicio: string
          descricao: string
          dia_vencimento: number
          empresa_id: string
          fornecedor_cliente?: string | null
          id?: string
          tipo: string
          updated_at?: string
          valor: number
        }
        Update: {
          ativo?: boolean
          categoria?: string | null
          centro_custo?: string | null
          created_at?: string
          created_by?: string | null
          data_fim?: string | null
          data_inicio?: string
          descricao?: string
          dia_vencimento?: number
          empresa_id?: string
          fornecedor_cliente?: string | null
          id?: string
          tipo?: string
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "recorrencias_lancamento_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      reembolso_anexos: {
        Row: {
          arquivo_url: string
          created_at: string | null
          descricao: string
          id: string
          ordem: number | null
          reembolso_id: string
        }
        Insert: {
          arquivo_url: string
          created_at?: string | null
          descricao: string
          id?: string
          ordem?: number | null
          reembolso_id: string
        }
        Update: {
          arquivo_url?: string
          created_at?: string | null
          descricao?: string
          id?: string
          ordem?: number | null
          reembolso_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reembolso_anexos_reembolso_id_fkey"
            columns: ["reembolso_id"]
            isOneToOne: false
            referencedRelation: "reembolsos"
            referencedColumns: ["id"]
          },
        ]
      }
      reembolsos: {
        Row: {
          centro_custo: string
          chave_pix: string
          comprovante_url: string | null
          created_at: string | null
          data: string
          data_prevista_pagamento: string | null
          id: string
          motivo: string
          nome: string
          status: string | null
          status_comentario: string | null
          tipo_chave_pix: string
          updated_at: string | null
          user_id: string
          valor: number
        }
        Insert: {
          centro_custo: string
          chave_pix: string
          comprovante_url?: string | null
          created_at?: string | null
          data: string
          data_prevista_pagamento?: string | null
          id?: string
          motivo: string
          nome: string
          status?: string | null
          status_comentario?: string | null
          tipo_chave_pix: string
          updated_at?: string | null
          user_id: string
          valor: number
        }
        Update: {
          centro_custo?: string
          chave_pix?: string
          comprovante_url?: string | null
          created_at?: string | null
          data?: string
          data_prevista_pagamento?: string | null
          id?: string
          motivo?: string
          nome?: string
          status?: string | null
          status_comentario?: string | null
          tipo_chave_pix?: string
          updated_at?: string | null
          user_id?: string
          valor?: number
        }
        Relationships: []
      }
      regras_classificacao: {
        Row: {
          ativo: boolean
          campo: string
          categoria_id: string | null
          centro_custo_id: string | null
          conta_id: string | null
          created_at: string
          created_by: string | null
          empresa_id: string | null
          empresa_id_destino: string | null
          id: string
          nome: string
          operador: string
          padrao: string
          prioridade: number
          sinal: string
          tipo: string | null
          tipo_conta: string | null
          updated_at: string
          valor_max: number | null
          valor_min: number | null
          vezes_aplicada: number
        }
        Insert: {
          ativo?: boolean
          campo?: string
          categoria_id?: string | null
          centro_custo_id?: string | null
          conta_id?: string | null
          created_at?: string
          created_by?: string | null
          empresa_id?: string | null
          empresa_id_destino?: string | null
          id?: string
          nome: string
          operador?: string
          padrao: string
          prioridade?: number
          sinal?: string
          tipo?: string | null
          tipo_conta?: string | null
          updated_at?: string
          valor_max?: number | null
          valor_min?: number | null
          vezes_aplicada?: number
        }
        Update: {
          ativo?: boolean
          campo?: string
          categoria_id?: string | null
          centro_custo_id?: string | null
          conta_id?: string | null
          created_at?: string
          created_by?: string | null
          empresa_id?: string | null
          empresa_id_destino?: string | null
          id?: string
          nome?: string
          operador?: string
          padrao?: string
          prioridade?: number
          sinal?: string
          tipo?: string | null
          tipo_conta?: string | null
          updated_at?: string
          valor_max?: number | null
          valor_min?: number | null
          vezes_aplicada?: number
        }
        Relationships: [
          {
            foreignKeyName: "regras_classificacao_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_financeiras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "regras_classificacao_centro_custo_id_fkey"
            columns: ["centro_custo_id"]
            isOneToOne: false
            referencedRelation: "centros_custo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "regras_classificacao_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "contas_financeiras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "regras_classificacao_empresa_id_destino_fkey"
            columns: ["empresa_id_destino"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "regras_classificacao_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_target_monthly: {
        Row: {
          achieved_value: number | null
          cash_achieved: number | null
          created_at: string | null
          id: string
          month: string
          monthly_target: number | null
          recurring_achieved: number | null
          sales_target_id: string
          updated_at: string | null
        }
        Insert: {
          achieved_value?: number | null
          cash_achieved?: number | null
          created_at?: string | null
          id?: string
          month: string
          monthly_target?: number | null
          recurring_achieved?: number | null
          sales_target_id: string
          updated_at?: string | null
        }
        Update: {
          achieved_value?: number | null
          cash_achieved?: number | null
          created_at?: string | null
          id?: string
          month?: string
          monthly_target?: number | null
          recurring_achieved?: number | null
          sales_target_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_target_monthly_sales_target_id_fkey"
            columns: ["sales_target_id"]
            isOneToOne: false
            referencedRelation: "sales_targets"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_targets: {
        Row: {
          annual_target: number | null
          cash_sale_percentage: number | null
          created_at: string | null
          id: string
          month_forecast: number | null
          monthly_target: number | null
          period_id: string
          recurring_installments: number | null
          recurring_sale_percentage: number | null
          target_ml_percentage: number | null
          updated_at: string | null
        }
        Insert: {
          annual_target?: number | null
          cash_sale_percentage?: number | null
          created_at?: string | null
          id?: string
          month_forecast?: number | null
          monthly_target?: number | null
          period_id: string
          recurring_installments?: number | null
          recurring_sale_percentage?: number | null
          target_ml_percentage?: number | null
          updated_at?: string | null
        }
        Update: {
          annual_target?: number | null
          cash_sale_percentage?: number | null
          created_at?: string | null
          id?: string
          month_forecast?: number | null
          monthly_target?: number | null
          period_id?: string
          recurring_installments?: number | null
          recurring_sale_percentage?: number | null
          target_ml_percentage?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_targets_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "financial_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      scenarios: {
        Row: {
          ai_analysis: string | null
          ai_recommendations: Json | null
          created_at: string | null
          expense_change_percent: number | null
          id: string
          name: string
          period_id: string
          projected_cash_balance: number | null
          projected_expenses: number | null
          projected_net_margin: number | null
          projected_revenue: number | null
          projected_taxes: number | null
          revenue_change_percent: number | null
          time_horizon_months: number | null
        }
        Insert: {
          ai_analysis?: string | null
          ai_recommendations?: Json | null
          created_at?: string | null
          expense_change_percent?: number | null
          id?: string
          name: string
          period_id: string
          projected_cash_balance?: number | null
          projected_expenses?: number | null
          projected_net_margin?: number | null
          projected_revenue?: number | null
          projected_taxes?: number | null
          revenue_change_percent?: number | null
          time_horizon_months?: number | null
        }
        Update: {
          ai_analysis?: string | null
          ai_recommendations?: Json | null
          created_at?: string | null
          expense_change_percent?: number | null
          id?: string
          name?: string
          period_id?: string
          projected_cash_balance?: number | null
          projected_expenses?: number | null
          projected_net_margin?: number | null
          projected_revenue?: number | null
          projected_taxes?: number | null
          revenue_change_percent?: number | null
          time_horizon_months?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "scenarios_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "financial_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      security_scan_status: {
        Row: {
          created_at: string
          critical_count: number
          high_count: number
          id: string
          info_count: number
          scan_timestamp: string
          scanner_summary: Json | null
          total_findings: number
          updated_at: string
          warn_count: number
        }
        Insert: {
          created_at?: string
          critical_count?: number
          high_count?: number
          id?: string
          info_count?: number
          scan_timestamp: string
          scanner_summary?: Json | null
          total_findings?: number
          updated_at?: string
          warn_count?: number
        }
        Update: {
          created_at?: string
          critical_count?: number
          high_count?: number
          id?: string
          info_count?: number
          scan_timestamp?: string
          scanner_summary?: Json | null
          total_findings?: number
          updated_at?: string
          warn_count?: number
        }
        Relationships: []
      }
      solicitacoes_baixa_cerbro: {
        Row: {
          cpf: string | null
          created_at: string
          id: string
          identificador: string | null
          motivo: string
          nome_cliente: string
          observacoes: string | null
          solicitante: string | null
          status: string
          status_comentario: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cpf?: string | null
          created_at?: string
          id?: string
          identificador?: string | null
          motivo: string
          nome_cliente: string
          observacoes?: string | null
          solicitante?: string | null
          status?: string
          status_comentario?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cpf?: string | null
          created_at?: string
          id?: string
          identificador?: string | null
          motivo?: string
          nome_cliente?: string
          observacoes?: string | null
          solicitante?: string | null
          status?: string
          status_comentario?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      solicitacoes_contrato: {
        Row: {
          area: string
          autentique_doc_id: string | null
          cartao_cnpj_url: string | null
          chave_pix: string | null
          cnpj: string
          contrato_url: string | null
          cpf: string | null
          created_at: string
          data_inicio_contrato: string
          documento_foto_url: string | null
          email: string
          endereco: string
          escopo_trabalho: string
          funcao: string
          id: string
          nome: string
          nome_completo: string | null
          remuneracao: number
          remuneracao_extenso: string | null
          status: string
          status_comentario: string | null
          tipo_chave_pix: string | null
          updated_at: string
          user_id: string
          variavel: string | null
        }
        Insert: {
          area: string
          autentique_doc_id?: string | null
          cartao_cnpj_url?: string | null
          chave_pix?: string | null
          cnpj: string
          contrato_url?: string | null
          cpf?: string | null
          created_at?: string
          data_inicio_contrato: string
          documento_foto_url?: string | null
          email: string
          endereco: string
          escopo_trabalho: string
          funcao: string
          id?: string
          nome: string
          nome_completo?: string | null
          remuneracao: number
          remuneracao_extenso?: string | null
          status?: string
          status_comentario?: string | null
          tipo_chave_pix?: string | null
          updated_at?: string
          user_id: string
          variavel?: string | null
        }
        Update: {
          area?: string
          autentique_doc_id?: string | null
          cartao_cnpj_url?: string | null
          chave_pix?: string | null
          cnpj?: string
          contrato_url?: string | null
          cpf?: string | null
          created_at?: string
          data_inicio_contrato?: string
          documento_foto_url?: string | null
          email?: string
          endereco?: string
          escopo_trabalho?: string
          funcao?: string
          id?: string
          nome?: string
          nome_completo?: string | null
          remuneracao?: number
          remuneracao_extenso?: string | null
          status?: string
          status_comentario?: string | null
          tipo_chave_pix?: string | null
          updated_at?: string
          user_id?: string
          variavel?: string | null
        }
        Relationships: []
      }
      solicitacoes_mensagem: {
        Row: {
          created_at: string
          data_envio_desejada: string | null
          destinatario: string
          id: string
          mensagem: string
          observacoes: string | null
          solicitante: string | null
          status: string
          status_comentario: string | null
          telefone: string | null
          tipo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data_envio_desejada?: string | null
          destinatario: string
          id?: string
          mensagem: string
          observacoes?: string | null
          solicitante?: string | null
          status?: string
          status_comentario?: string | null
          telefone?: string | null
          tipo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data_envio_desejada?: string | null
          destinatario?: string
          id?: string
          mensagem?: string
          observacoes?: string | null
          solicitante?: string | null
          status?: string
          status_comentario?: string | null
          telefone?: string | null
          tipo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tax_rules: {
        Row: {
          aliquot_percentage: number
          created_at: string | null
          id: string
          is_active: boolean | null
          max_revenue: number | null
          min_revenue: number | null
          name: string
          regime: Database["public"]["Enums"]["tax_regime"]
          updated_at: string | null
        }
        Insert: {
          aliquot_percentage: number
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_revenue?: number | null
          min_revenue?: number | null
          name: string
          regime: Database["public"]["Enums"]["tax_regime"]
          updated_at?: string | null
        }
        Update: {
          aliquot_percentage?: number
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_revenue?: number | null
          min_revenue?: number | null
          name?: string
          regime?: Database["public"]["Enums"]["tax_regime"]
          updated_at?: string | null
        }
        Relationships: []
      }
      transaction_categories: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          is_default: boolean | null
          name: string
          type: Database["public"]["Enums"]["transaction_type"]
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          type: Database["public"]["Enums"]["transaction_type"]
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          type?: Database["public"]["Enums"]["transaction_type"]
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string | null
          date: string
          description: string | null
          id: string
          is_forecast: boolean | null
          is_recurring: boolean | null
          period_id: string
          recurring_interval: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string | null
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string | null
          date: string
          description?: string | null
          id?: string
          is_forecast?: boolean | null
          is_recurring?: boolean | null
          period_id: string
          recurring_interval?: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string | null
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          is_forecast?: boolean | null
          is_recurring?: boolean | null
          period_id?: string
          recurring_interval?: string | null
          type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "transaction_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "financial_periods"
            referencedColumns: ["id"]
          },
        ]
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
      veiculos: {
        Row: {
          ano: number | null
          apelido: string
          ativo: boolean
          created_at: string
          empresa_id: string | null
          id: string
          modelo: string | null
          placa: string | null
          responsavel_id: string | null
          updated_at: string
        }
        Insert: {
          ano?: number | null
          apelido: string
          ativo?: boolean
          created_at?: string
          empresa_id?: string | null
          id?: string
          modelo?: string | null
          placa?: string | null
          responsavel_id?: string | null
          updated_at?: string
        }
        Update: {
          ano?: number | null
          apelido?: string
          ativo?: boolean
          created_at?: string
          empresa_id?: string | null
          id?: string
          modelo?: string | null
          placa?: string | null
          responsavel_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "veiculos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "veiculos_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_contatos: {
        Row: {
          cliente_id: string | null
          colaborador_id: string | null
          created_at: string
          id: string
          nome: string | null
          push_name: string | null
          telefone: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          cliente_id?: string | null
          colaborador_id?: string | null
          created_at?: string
          id?: string
          nome?: string | null
          push_name?: string | null
          telefone: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          cliente_id?: string | null
          colaborador_id?: string | null
          created_at?: string
          id?: string
          nome?: string | null
          push_name?: string | null
          telefone?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_contatos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_contatos_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_conversa_estado: {
        Row: {
          pendencia: Json | null
          telefone: string
          updated_at: string
        }
        Insert: {
          pendencia?: Json | null
          telefone: string
          updated_at?: string
        }
        Update: {
          pendencia?: Json | null
          telefone?: string
          updated_at?: string
        }
        Relationships: []
      }
      whatsapp_conversas: {
        Row: {
          contato_id: string | null
          created_at: string
          id: string
          instancia_id: string | null
          nao_lidas: number
          telefone: string
          ultima_mensagem: string | null
          ultima_mensagem_at: string | null
          updated_at: string
        }
        Insert: {
          contato_id?: string | null
          created_at?: string
          id?: string
          instancia_id?: string | null
          nao_lidas?: number
          telefone: string
          ultima_mensagem?: string | null
          ultima_mensagem_at?: string | null
          updated_at?: string
        }
        Update: {
          contato_id?: string | null
          created_at?: string
          id?: string
          instancia_id?: string | null
          nao_lidas?: number
          telefone?: string
          ultima_mensagem?: string | null
          ultima_mensagem_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_conversas_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_contatos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_conversas_instancia_id_fkey"
            columns: ["instancia_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instancias"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_envios: {
        Row: {
          created_at: string
          created_by: string | null
          enviado_at: string | null
          erro: string | null
          id: string
          instancia_id: string | null
          mensagem: string
          origem: string
          referencia_id: string | null
          referencia_tipo: string | null
          status: string
          telefone: string
          tipo: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          enviado_at?: string | null
          erro?: string | null
          id?: string
          instancia_id?: string | null
          mensagem: string
          origem?: string
          referencia_id?: string | null
          referencia_tipo?: string | null
          status?: string
          telefone: string
          tipo?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          enviado_at?: string | null
          erro?: string | null
          id?: string
          instancia_id?: string | null
          mensagem?: string
          origem?: string
          referencia_id?: string | null
          referencia_tipo?: string | null
          status?: string
          telefone?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_envios_instancia_id_fkey"
            columns: ["instancia_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instancias"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_instancias: {
        Row: {
          ativo: boolean
          base_url: string
          created_at: string
          empresa_id: string | null
          id: string
          last_checked_at: string | null
          nome: string
          numero: string | null
          status: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          base_url: string
          created_at?: string
          empresa_id?: string | null
          id?: string
          last_checked_at?: string | null
          nome: string
          numero?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          base_url?: string
          created_at?: string
          empresa_id?: string | null
          id?: string
          last_checked_at?: string | null
          nome?: string
          numero?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_instancias_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_mensagens: {
        Row: {
          anexo_url: string | null
          confianca: number | null
          contato_id: string | null
          conversa_id: string | null
          created_at: string
          delivery_status: string | null
          direcao: string
          erro: string | null
          id: string
          instancia_id: string | null
          intencao: string | null
          interpretacao: Json | null
          lancamento_id: string | null
          message_id: string | null
          resposta: string | null
          telefone: string
          texto: string | null
          tipo_midia: string
          transcricao: string | null
        }
        Insert: {
          anexo_url?: string | null
          confianca?: number | null
          contato_id?: string | null
          conversa_id?: string | null
          created_at?: string
          delivery_status?: string | null
          direcao?: string
          erro?: string | null
          id?: string
          instancia_id?: string | null
          intencao?: string | null
          interpretacao?: Json | null
          lancamento_id?: string | null
          message_id?: string | null
          resposta?: string | null
          telefone: string
          texto?: string | null
          tipo_midia?: string
          transcricao?: string | null
        }
        Update: {
          anexo_url?: string | null
          confianca?: number | null
          contato_id?: string | null
          conversa_id?: string | null
          created_at?: string
          delivery_status?: string | null
          direcao?: string
          erro?: string | null
          id?: string
          instancia_id?: string | null
          intencao?: string | null
          interpretacao?: Json | null
          lancamento_id?: string | null
          message_id?: string | null
          resposta?: string | null
          telefone?: string
          texto?: string | null
          tipo_midia?: string
          transcricao?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_mensagens_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_contatos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_mensagens_conversa_id_fkey"
            columns: ["conversa_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_mensagens_instancia_id_fkey"
            columns: ["instancia_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instancias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_mensagens_lancamento_id_fkey"
            columns: ["lancamento_id"]
            isOneToOne: false
            referencedRelation: "lancamentos_empresa"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_numeros_autorizados: {
        Row: {
          ativo: boolean
          created_at: string
          empresa_padrao_id: string | null
          id: string
          nome: string
          telefone: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          empresa_padrao_id?: string | null
          id?: string
          nome: string
          telefone: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          empresa_padrao_id?: string | null
          id?: string
          nome?: string
          telefone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_numeros_autorizados_empresa_padrao_id_fkey"
            columns: ["empresa_padrao_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      cash_flow_detailed_view: {
        Row: {
          category_description: string | null
          category_structure: string | null
          month: string | null
          source_type: string | null
          total_value: number | null
          transaction_count: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_business_days: {
        Args: { days_to_add: number; start_date: string }
        Returns: string
      }
      aggregate_raw_to_detailed: {
        Args: { p_year?: number }
        Returns: {
          created: number
          processed: number
          updated: number
        }[]
      }
      calcular_data_prevista_devolucao: {
        Args: { data_solicitacao: string }
        Returns: string
      }
      calcular_data_prevista_reembolso: {
        Args: { data_solicitacao: string }
        Returns: string
      }
      can_manage_finance: { Args: { _user_id: string }; Returns: boolean }
      can_view_finance: { Args: { _user_id: string }; Returns: boolean }
      classificar_lancamento: { Args: { p_id: string }; Returns: string }
      create_notification: {
        Args: {
          p_action: string
          p_message: string
          p_reference_id?: string
          p_title: string
          p_type: string
          p_user_id: string
        }
        Returns: undefined
      }
      fin_normalize_text: { Args: { _txt: string }; Returns: string }
      get_budget_vs_actual: {
        Args: { p_end_date: string; p_start_date: string }
        Returns: {
          despesa_meta: number
          despesa_prevista: number
          despesa_realizada: number
          month: string
          receita_meta: number
          receita_prevista: number
          receita_realizada: number
        }[]
      }
      get_initial_balance_from_extrato: {
        Args: { p_cutoff_date: string }
        Returns: number
      }
      get_lancamentos_vencidos: {
        Args: never
        Returns: {
          data_competencia: string
          descricao: string
          empresa_id: string
          empresa_nome: string
          id: string
          status: string
          valor: number
        }[]
      }
      get_monthly_cash_flow: {
        Args: { p_end_date: string; p_start_date: string }
        Returns: {
          month: string
          total_despesas: number
          total_receitas: number
        }[]
      }
      get_notas_fiscais_mes: {
        Args: never
        Returns: {
          created_at: string
          email: string
          id: string
          nome: string
          periodo_referencia: string
          user_id: string
          valor: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_first_access: { Args: never; Returns: boolean }
      populate_cash_flow_tables: {
        Args: { p_year?: number }
        Returns: {
          expenses_count: number
          expenses_deleted: number
          revenues_count: number
          revenues_deleted: number
        }[]
      }
      reclassificar_pendentes: {
        Args: { p_empresa_id?: string; p_mes?: string }
        Returns: {
          classificados: number
          total: number
        }[]
      }
      run_security_selfcheck: {
        Args: never
        Returns: {
          critical_count: number
          high_count: number
          info_count: number
          scan_timestamp: string
          total_findings: number
          warn_count: number
        }[]
      }
      setup_primeiro_admin: {
        Args: { p_email: string; p_nome?: string; p_user_id: string }
        Returns: boolean
      }
      update_cron_schedule: {
        Args: { p_job_name: string; p_schedule: string }
        Returns: boolean
      }
      validar_colaborador_signup: { Args: { p_email: string }; Returns: Json }
      vincular_user_colaborador: {
        Args: { p_colaborador_email: string; p_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "user"
        | "finance"
        | "finance_viewer"
        | "admin_viewer"
        | "approver_notas"
        | "approver_reembolsos"
        | "approver_devolucoes"
        | "approver_materiais"
      goal_type: "sales_volume" | "sales_value" | "net_margin_percentage"
      period_status: "open" | "closed"
      tax_regime: "simples_nacional" | "lucro_presumido" | "lucro_real"
      transaction_type: "revenue" | "expense" | "tax"
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
      app_role: [
        "admin",
        "user",
        "finance",
        "finance_viewer",
        "admin_viewer",
        "approver_notas",
        "approver_reembolsos",
        "approver_devolucoes",
        "approver_materiais",
      ],
      goal_type: ["sales_volume", "sales_value", "net_margin_percentage"],
      period_status: ["open", "closed"],
      tax_regime: ["simples_nacional", "lucro_presumido", "lucro_real"],
      transaction_type: ["revenue", "expense", "tax"],
    },
  },
} as const
