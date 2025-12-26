
import { createClient } from '@supabase/supabase-js';
import { TipoCliente, PeriodoLocacao, StatusEquipamento, StatusLocacao, StatusPagamento, StatusOcorrencia, StatusTarefa, UserRole, Endereco, ReferenciaContato, DocumentoCliente } from './types';

// Interface para o schema do banco de dados
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          name: string;
        };
        Update: {
          name?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          organization_id: string;
          full_name: string;
          role: UserRole;
        };
        Insert: {
          id: string;
          organization_id: string;
          full_name: string;
          role: UserRole;
        };
        Update: {
          full_name?: string;
          role?: UserRole;
        };
      };
      clientes: {
        Row: {
          id: string;
          organization_id: string;
          tipo: TipoCliente;
          email: string;
          telefone: string;
          inadimplente: boolean;
          cliente_desde: string;
          endereco: Endereco | null;
          nome_completo: string | null;
          razao_social: string | null;
          nome_fantasia: string | null;
          documento: string;
          referencias: ReferenciaContato[];
          documentos: DocumentoCliente[];
        };
        Insert: {
          organization_id: string;
          tipo: TipoCliente;
          email: string;
          telefone: string;
          inadimplente: boolean;
          endereco?: Endereco | null;
          nome_completo?: string | null;
          razao_social?: string | null;
          nome_fantasia?: string | null;
          documento: string;
          referencias: ReferenciaContato[];
          documentos: DocumentoCliente[];
        };
        Update: {
          tipo?: TipoCliente;
          email?: string;
          telefone?: string;
          inadimplente?: boolean;
          endereco?: Endereco | null;
          nome_completo?: string | null;
          razao_social?: string | null;
          nome_fantasia?: string | null;
          documento?: string;
          referencias?: ReferenciaContato[];
          documentos?: DocumentoCliente[];
        };
      };
      equipamentos: {
        Row: {
          id: string;
          organization_id: string;
          nome: string;
          categoria: string;
          sub_categoria: string;
          marca: string;
          valor_compra: number;
          valor_venda: number | null;
          caucao_sugerida: number | null;
          periodos_locacao: PeriodoLocacao[];
          status: StatusEquipamento;
          url_imagem: string;
          quantidade_total: number;
          quantidade_alugada: number;
          modelo_contrato_id: string | null;
          descricao: string | null;
          especificacoes: { chave: string; valor: string; }[] | null;
          links_externos: string[] | null;
          criado_em: string | null;
        };
        Insert: {
          organization_id: string;
          nome: string;
          categoria: string;
          sub_categoria: string;
          marca: string;
          valor_compra: number;
          valor_venda?: number | null;
          caucao_sugerida?: number | null;
          periodos_locacao: PeriodoLocacao[];
          status: StatusEquipamento;
          url_imagem: string;
          quantidade_total: number;
          modelo_contrato_id?: string | null;
          descricao?: string | null;
          especificacoes?: { chave: string; valor: string; }[] | null;
          links_externos?: string[] | null;
        };
        Update: {
          nome?: string;
          categoria?: string;
          sub_categoria?: string;
          marca?: string;
          valor_compra?: number;
          valor_venda?: number | null;
          caucao_sugerida?: number | null;
          periodos_locacao?: PeriodoLocacao[];
          status?: StatusEquipamento;
          url_imagem?: string;
          quantidade_total?: number;
          modelo_contrato_id?: string | null;
          descricao?: string | null;
          especificacoes?: { chave: string; valor: string; }[] | null;
          links_externos?: string[] | null;
        };
      };
      locacoes: {
        Row: {
          id: string;
          organization_id: string;
          cliente_id: string;
          // REMOVIDO: equipamento_id (não existe no schema fornecido)
          data_inicio: string;
          data_fim: string;
          duracao_dias: number;
          status: StatusLocacao;
          status_pagamento: StatusPagamento;
          valor_total: number;
          valor_frete_entrega: number | null;
          valor_frete_devolucao: number | null;
          valor_caucao: number | null;
          observacoes: string | null;
          endereco_uso: Endereco | null;
          criado_em: string | null;
          responsavel_entrega_id: string | null;
          responsavel_devolucao_id: string | null;
        };
        Insert: {
          organization_id: string;
          cliente_id: string;
          // REMOVIDO: equipamento_id
          data_inicio: string;
          data_fim: string;
          duracao_dias: number;
          status: StatusLocacao;
          status_pagamento: StatusPagamento;
          valor_total: number;
          valor_frete_entrega?: number | null;
          valor_frete_devolucao?: number | null;
          valor_caucao?: number | null;
          observacoes?: string | null;
          endereco_uso?: Endereco | null;
          responsavel_entrega_id?: string | null;
          responsavel_devolucao_id?: string | null;
        };
        Update: {
          cliente_id?: string;
          // REMOVIDO: equipamento_id
          data_inicio?: string;
          data_fim?: string;
          duracao_dias?: number;
          status?: StatusLocacao;
          status_pagamento?: StatusPagamento;
          valor_total?: number;
          valor_frete_entrega?: number | null;
          valor_frete_devolucao?: number | null;
          valor_caucao?: number | null;
          observacoes?: string | null;
          endereco_uso?: Endereco | null;
          responsavel_entrega_id?: string | null;
          responsavel_devolucao_id?: string | null;
        };
      };
      locacao_itens: {
        Row: {
          id: string;
          organization_id: string;
          locacao_id: string;
          equipamento_id: string;
          quantidade: number;
          valor_unitario: number;
          valor_total: number;
          criado_em: string;
        };
        Insert: {
          organization_id: string;
          locacao_id: string;
          equipamento_id: string;
          quantidade: number;
          valor_unitario: number;
          valor_total: number;
        };
        Update: {
          equipamento_id?: string;
          quantidade?: number;
          valor_unitario?: number;
          valor_total?: number;
        }
      };
      motoristas: {
        Row: {
          id: string;
          nome: string;
          vehicle: string | null;
          criado_em: string;
          organization_id: string;
        };
        Insert: {
          organization_id: string;
          nome: string;
          vehicle?: string | null;
        };
        Update: {
          nome?: string;
          vehicle?: string | null;
        };
      };
      ocorrencias: {
        Row: {
          id: string;
          organization_id: string;
          locacao_id: string;
          data_relato: string;
          descricao: string;
          status: StatusOcorrencia;
          custo_reparo: number | null;
        };
        Insert: {
          organization_id: string;
          locacao_id: string;
          descricao: string;
          status: StatusOcorrencia;
          custo_reparo?: number | null;
        };
        Update: {
          locacao_id?: string;
          descricao?: string;
          status?: StatusOcorrencia;
          custo_reparo?: number | null;
        };
      };
      tarefas: {
        Row: {
          id: string;
          organization_id: string;
          titulo: string;
          descricao: string;
          responsavel: string | null;
          data_vencimento: string;
          status: StatusTarefa;
        };
        Insert: {
          organization_id: string;
          titulo: string;
          descricao: string;
          responsavel?: string | null;
          data_vencimento: string;
          status: StatusTarefa;
        };
        Update: {
          titulo?: string;
          descricao?: string;
          responsavel?: string | null;
          data_vencimento?: string;
          status?: StatusTarefa;
        };
      };
      modelos_contrato: {
        Row: {
          id: string;
          organization_id: string;
          nome: string;
          conteudo: string;
        };
        Insert: {
          organization_id: string;
          nome: string;
          conteudo: string;
        };
        Update: {
          nome?: string;
          conteudo?: string;
        };
      };
      pagamentos: {
        Row: {
          id: string;
          locacao_id: string;
          data_pagamento: string;
          valor_pago: number;
          metodo_pagamento: string; // USER-DEFINED no schema
          observacao: string | null;
          criado_em: string;
          organization_id: string;
        };
        Insert: {
          locacao_id: string;
          data_pagamento: string;
          valor_pago: number;
          metodo_pagamento: string;
          observacao?: string | null;
          organization_id: string;
        };
        Update: {
          valor_pago?: number;
          metodo_pagamento?: string;
          observacao?: string | null;
        };
      };
    };
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
  }
}

// ATENÇÃO: Substitua pelos dados do seu projeto no Supabase.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'As credenciais do Supabase não foram encontradas. Verifique se o arquivo .env está configurado corretamente.'
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
