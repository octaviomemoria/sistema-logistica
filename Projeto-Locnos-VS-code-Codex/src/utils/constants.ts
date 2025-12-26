import type {
  PaymentMethod,
  PaymentStatus,
  RentalStatus,
  TaskStatus,
  UserRole
} from "../types/domain";

export const ROUTE_PERMISSIONS: Record<string, UserRole[]> = {
  "/dashboard": ["admin", "gerente", "atendente", "tecnico"],
  "/equipamentos": ["admin", "gerente", "atendente", "tecnico"],
  "/clientes": ["admin", "gerente", "atendente"],
  "/locacoes": ["admin", "gerente", "atendente"],
  "/financeiro": ["admin", "gerente"],
  "/relatorios": ["admin", "gerente"],
  "/ocorrencias": ["admin", "gerente", "tecnico"],
  "/tarefas": ["admin", "gerente"],
  "/motoristas": ["admin", "gerente"],
  "/contratos": ["admin", "gerente"],
  "/conta": ["admin", "gerente", "atendente", "tecnico"]
};

export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  Pago: "bg-green-100 text-green-700",
  "Pago Parcialmente": "bg-amber-100 text-amber-700",
  Pendente: "bg-slate-100 text-slate-600",
  Atrasado: "bg-red-100 text-red-700"
};

export const RENTAL_STATUS_COLORS: Record<RentalStatus, string> = {
  Agendado: "bg-sky-100 text-sky-700",
  Ativo: "bg-brand-100 text-brand-700",
  Concluido: "bg-emerald-100 text-emerald-700",
  Atrasado: "bg-rose-100 text-rose-700"
};

export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  Pendente: "bg-amber-100 text-amber-700",
  "Em Andamento": "bg-brand-100 text-brand-700",
  Concluída: "bg-emerald-100 text-emerald-700"
};

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  Boleto: "Boleto",
  "Cartão de Crédito": "Cartão",
  PIX: "PIX",
  Dinheiro: "Dinheiro"
};

export const STORAGE_BUCKETS = {
  equipment: "imagens-equipamentos",
  clientDocuments: "documentos-clientes",
  contracts: "contratos-gerados"
};
