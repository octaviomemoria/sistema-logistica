export type UserRole = "admin" | "gerente" | "atendente" | "tecnico";

export const USER_ROLES: UserRole[] = [
  "admin",
  "gerente",
  "atendente",
  "tecnico"
];

export type EquipmentStatus =
  | "Disponível"
  | "Alugado"
  | "Em Manutenção"
  | "Reservado";

export type ClientType = "Pessoa Física" | "Pessoa Jurídica";

export type RentalStatus = "Agendado" | "Ativo" | "Concluido" | "Atrasado";

export type PaymentStatus =
  | "Pago"
  | "Pago Parcialmente"
  | "Pendente"
  | "Atrasado";

export type PaymentMethod =
  | "Boleto"
  | "Cartão de Crédito"
  | "PIX"
  | "Dinheiro";

export type OccurrenceStatus = "Aberto" | "Em Análise" | "Resolvido";

export type TaskStatus = "Pendente" | "Em Andamento" | "Concluída";

export interface Organization {
  id: string;
  name: string;
  logo_url?: string | null;
  created_at?: string;
}

export interface Profile {
  id: string;
  organization_id: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string | null;
  created_at?: string;
  active?: boolean;
}

export interface EquipmentPeriod {
  descricao: string;
  dias: number;
  preco: number;
}

export interface Equipment {
  id: string;
  organization_id: string;
  nome: string;
  categoria?: string | null;
  sub_categoria?: string | null;
  marca?: string | null;
  valor_compra?: number | null;
  valor_revenda?: number | null;
  periodos_locacao?: EquipmentPeriod[];
  url_imagem?: string | null;
  quantidade_total: number;
  quantidade_alugada: number;
  status: EquipmentStatus;
  descricao?: string | null;
  modelo_contrato_id?: string | null;
  criado_em?: string;
}

export interface EquipmentFilters {
  search?: string;
  status?: EquipmentStatus | "Todos";
  categoria?: string;
  orderBy?: keyof Pick<
    Equipment,
    "nome" | "categoria" | "status" | "quantidade_total"
  >;
  order?: "asc" | "desc";
}

export interface Address {
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
}

export interface ClientReference {
  nome: string;
  telefone: string;
}

export interface ClientDocument {
  nome: string;
  url: string;
}

export interface Client {
  id: string;
  organization_id: string;
  tipo: ClientType;
  email: string;
  telefone: string;
  documento: string;
  nome_completo?: string | null;
  razao_social?: string | null;
  nome_fantasia?: string | null;
  inadimplente?: boolean;
  endereco?: Address;
  referencias?: ClientReference[];
  documentos?: ClientDocument[];
  cliente_desde?: string;
}

export interface RentalItem {
  id: string;
  locacao_id: string;
  equipamento_id: string;
  organization_id: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  equipamento?: Equipment;
}

export interface Payment {
  id: string;
  organization_id: string;
  locacao_id: string;
  data_pagamento: string;
  valor_pago: number;
  metodo_pagamento: PaymentMethod;
}

export interface Rental {
  id: string;
  organization_id: string;
  cliente_id: string;
  cliente?: Client;
  data_inicio: string;
  data_fim: string;
  duracao_dias: number;
  status: RentalStatus;
  status_pagamento: PaymentStatus;
  valor_total: number;
  valor_frete_entrega?: number | null;
  responsavel_entrega_id?: string | null;
  valor_frete_devolucao?: number | null;
  responsavel_devolucao_id?: string | null;
  criado_em?: string;
  itens?: RentalItem[];
  pagamentos?: Payment[];
  ocorrencias?: Occurrence[];
  observacoes?: string | null;
}

export interface Driver {
  id: string;
  organization_id: string;
  nome: string;
  telefone?: string | null;
  observacoes?: string | null;
  disponivel?: boolean;
}

export interface Occurrence {
  id: string;
  organization_id: string;
  locacao_id: string;
  descricao: string;
  data_relato: string;
  status: OccurrenceStatus;
  custo_reparo?: number | null;
  responsavel_tecnico_id?: string | null;
}

export interface Task {
  id: string;
  organization_id: string;
  titulo: string;
  descricao?: string;
  responsavel_id?: string | null;
  data_vencimento?: string | null;
  status: TaskStatus;
  contexto?: {
    tipo: "locacao" | "equipamento" | "ocorrencia" | "livre";
    referencia_id?: string;
  };
}

export interface ContractTemplate {
  id: string;
  organization_id: string;
  nome: string;
  conteudo: string;
  updated_at?: string;
}

export interface DashboardKpis {
  faturamentoMes: number;
  equipamentosAlugados: number;
  locacoesAtivas: number;
  clientesAtivos: number;
  receitaMensal: { mes: string; valor: number }[];
  statusLocacoes: { status: RentalStatus; total: number }[];
}

export interface FinancialSnapshot {
  faturamentoMes: number;
  faturamentoAno: number;
  contasReceber: number;
  totalAtraso: number;
  crescimentoMensal: number;
  faturamentoHistorico: { mes: string; valor: number }[];
  metodosPagamentoDistribuicao: { metodo: PaymentMethod; percentual: number }[];
  inadimplentes: { cliente: Client; valor: number; diasAtraso: number }[];
  ultimasTransacoes: {
    id: string;
    cliente: string;
    data: string;
    valor: number;
  }[];
}

export interface ReportQuestion {
  id: string;
  pergunta: string;
  resposta?: string;
  criado_em: string;
}

export interface CsvMapping {
  column: string;
  field: string;
}
