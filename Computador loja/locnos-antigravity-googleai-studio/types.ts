
export interface Organization {
  id: string;
  name: string;
  created_at: string;
}

export enum UserRole {
  ADMIN = 'Admin',
  GERENTE = 'Gerente',
  ATENDENTE = 'Atendente',
  TECNICO = 'Tecnico',
  FRETEIRO = 'Freteiro',
  FINANCEIRO = 'Financeiro',
}

export interface Profile {
  id: string; // Corresponds to auth.users.id
  organization_id: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string | null;
}

export interface PeriodoLocacao {
  id: string;
  descricao: string;
  dias: number;
  preco: number;
}

export enum StatusEquipamento {
  DISPONIVEL = 'Disponível',
  ALUGADO = 'Alugado',
  MANUTENCAO = 'Em Manutenção',
  RESERVADO = 'Reservado',
}

export interface Equipamento {
  id: string;
  organization_id: string;
  nome: string;
  categoria: string;
  sub_categoria: string;
  marca: string;
  valor_compra: number;
  valor_venda?: number;
  caucao_sugerida?: number;
  periodos_locacao: PeriodoLocacao[];
  status: StatusEquipamento;
  url_imagem: string;
  quantidade_total: number;
  quantidade_alugada: number;
  modelo_contrato_id?: string;
  descricao?: string;
  especificacoes?: { chave: string; valor: string; }[];
  links_externos?: string[];
  criado_em?: string;
}

export enum TipoCliente {
  PESSOA_FISICA = 'Pessoa Física',
  PESSOA_JURIDICA = 'Pessoa Jurídica',
}

export interface ReferenciaContato {
  id: string;
  nome: string;
  telefone: string;
  parentesco: string;
}

export interface DocumentoCliente {
  id: string;
  nome: string;
  url: string; 
}

export interface Endereco {
  cep: string;
  rua: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
}

export interface Cliente {
  id: string;
  organization_id: string;
  tipo: TipoCliente;
  email: string;
  telefone: string;
  inadimplente: boolean;
  cliente_desde: string;
  endereco?: Endereco;
  nome_completo?: string; 
  razao_social?: string;
  nome_fantasia?: string;
  documento: string; // CPF ou CNPJ
  referencias: ReferenciaContato[];
  documentos: DocumentoCliente[];
  total_locacoes?: number; // Campo calculado no frontend
}

export enum StatusLocacao {
  AGENDADO = 'Agendado',
  ATIVO = 'Ativo',
  CONCLUIDO = 'Concluido',
  ATRASADO = 'Atrasado',
}

export enum StatusPagamento {
  PAGO = 'Pago',
  PAGO_PARCIALMENTE = 'Pago Parcialmente',
  PENDENTE = 'Pendente',
  ATRASADO = 'Atrasado',
}

export enum MetodoPagamento {
  BOLETO = 'Boleto',
  CARTAO = 'Cartão de Crédito',
  PIX = 'PIX',
  DINHEIRO = 'Dinheiro',
}

export interface LocacaoItem {
    id: string;
    locacao_id: string;
    equipamento_id: string;
    quantidade: number;
    valor_unitario: number;
    valor_total: number;
}

export interface Pagamento {
    id: string;
    organization_id?: string;
    locacao_id: string;
    data_pagamento: string;
    valor_pago: number;
    metodo_pagamento: MetodoPagamento;
    locacoes: {
        id: string;
        clientes: {
            id: string;
            nome_completo: string | null;
            nome_fantasia: string | null;
        } | null
    } | null;
}

export interface Locacao {
  id: string;
  organization_id: string;
  cliente_id: string;
  // equipamento_id removido pois está na tabela locacao_itens
  data_inicio: string;
  data_fim: string;
  duracao_dias: number;
  status: StatusLocacao;
  status_pagamento: StatusPagamento;
  valor_total: number;
  valor_frete_entrega?: number;
  valor_frete_devolucao?: number;
  responsavel_entrega_id?: string | null;
  responsavel_devolucao_id?: string | null;
  
  // Campos populados via JOIN ou calculados no frontend
  equipamentos?: { id: string; nome: string; categoria?: string; } | null; // Representa o equipamento principal
  clientes?: { id?: string; nome_completo?: string; nome_fantasia?: string; tipo: TipoCliente; endereco?: Endereco; } | null;
  
  // Campos auxiliares
  itens?: LocacaoItem[];
  pagamentos?: Pagamento[];
  valor_caucao?: number;
  observacoes?: string;
  endereco_uso?: Endereco;
  criado_em?: string;
}


export enum StatusOcorrencia {
  ABERTO = 'Aberto',
  EM_ANALISE = 'Em Análise',
  RESOLVIDO = 'Resolvido',
}

export interface Ocorrencia {
  id: string;
  organization_id: string;
  locacao_id: string;
  data_relato: string;
  descricao: string;
  status: StatusOcorrencia;
  custo_reparo?: number;
  // Campos para UI
  nome_equipamento?: string;
  nome_cliente?: string;
}

export enum StatusTarefa {
    PENDENTE = 'Pendente',
    EM_ANDAMENTO = 'Em Andamento',
    CONCLUIDA = 'Concluída',
}

export interface Tarefa {
  id: string;
  organization_id: string;
  titulo: string;
  descricao: string;
  responsavel?: string;
  data_vencimento: string;
  status: StatusTarefa;
}

export interface ModeloContrato {
    id: string;
    organization_id: string;
    nome: string;
    conteudo: string; 
}

// Tipos que não estavam no arquivo original mas são necessários
export interface Motorista {
    id: string;
    nome: string;
    vehicle: string | null;
}

export interface LogisticsEvent {
    id: string;
    type: 'Entrega' | 'Coleta';
    rentalId: string;
    clientName: string;
    address: string;
    scheduledTime: string;
    driver: Motorista;
    status: 'Agendado' | 'Em Rota' | 'Concluído';
    coordinates?: { lat: number; lng: number };
}

export interface MaintenanceOrder {
    id: string;
    equipmentName: string;
    equipmentId: string;
    type: 'Corretiva' | 'Preventiva';
    status: 'Aberta' | 'Em Andamento' | 'Concluída';
    reportedAt: string;
    priority: 'Alta' | 'Média' | 'Baixa';
}

export interface RevenueByCategory {
    category: string;
    revenue: number;
}

export interface UtilizationOverTime {
    month: string;
    rate: number;
}


export type View = 'dashboard' | 'equipments' | 'rentals' | 'operations' | 'clients' | 'financial' | 'reports' | 'account' | 'incidents' | 'tasks' | 'contracts';
