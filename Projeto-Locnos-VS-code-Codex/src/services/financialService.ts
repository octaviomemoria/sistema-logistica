import type {
  Client,
  DashboardKpis,
  FinancialSnapshot,
  PaymentMethod,
  PaymentStatus,
  RentalStatus
} from "../types/domain";
import { getSupabaseClient } from "./supabaseClient";
import { format, parseISO } from "date-fns";

const monthKey = (date: string) => format(parseISO(date), "yyyy-MM");

export const fetchDashboardKpis = async (
  organizationId: string
): Promise<DashboardKpis> => {
  const supabase = getSupabaseClient();

  const [{ data: rentals, error: rentalsError }, { data: payments, error }] =
    await Promise.all([
      supabase
        .from("locacoes")
        .select("status, valor_total, created_at, data_inicio, data_fim"),
      supabase
        .from("pagamentos")
        .select("valor_pago, data_pagamento")
        .eq("organization_id", organizationId)
    ]);

  if (rentalsError) throw new Error(rentalsError.message);
  if (error) throw new Error(error.message);

  const now = new Date();
  const currentMonthKey = format(now, "yyyy-MM");
  const faturamentoMes = (payments ?? [])
    .filter((payment) => monthKey(payment.data_pagamento) === currentMonthKey)
    .reduce((acc, curr) => acc + curr.valor_pago, 0);

  const statusLocacoes = (rentals ?? []).reduce<
    { status: RentalStatus; total: number }[]
  >((acc, curr) => {
    const bucket = acc.find((item) => item.status === curr.status);
    if (bucket) {
      bucket.total += 1;
    } else {
      acc.push({ status: curr.status as RentalStatus, total: 1 });
    }
    return acc;
  }, []);

  const receitaMensalMap = new Map<string, number>();
  (payments ?? []).forEach((payment) => {
    const key = monthKey(payment.data_pagamento);
    receitaMensalMap.set(
      key,
      (receitaMensalMap.get(key) ?? 0) + payment.valor_pago
    );
  });

  const receitaMensal = Array.from(receitaMensalMap.entries())
    .sort(([a], [b]) => (a > b ? 1 : -1))
    .map(([mes, valor]) => ({ mes, valor }));

  return {
    faturamentoMes,
    equipamentosAlugados: 0,
    locacoesAtivas: (rentals ?? []).filter((r) => r.status === "Ativo").length,
    clientesAtivos: 0,
    receitaMensal,
    statusLocacoes
  };
};

export const fetchFinancialSnapshot = async (
  organizationId: string
): Promise<FinancialSnapshot> => {
  const supabase = getSupabaseClient();
  const [{ data: rentals, error: rentalError }, { data: payments, error }] =
    await Promise.all([
      supabase
        .from("locacoes")
        .select(
          "id, cliente_id, valor_total, status_pagamento, status, data_inicio, data_fim, cliente:clientes(nome_completo, razao_social)"
        )
        .eq("organization_id", organizationId),
      supabase
        .from("pagamentos")
        .select("*")
        .eq("organization_id", organizationId)
        .order("data_pagamento", { ascending: false })
    ]);

  if (rentalError) throw new Error(rentalError.message);
  if (error) throw new Error(error.message);

  const now = new Date();
  const currentMonth = format(now, "yyyy-MM");

  const faturamentoMes = (payments ?? [])
    .filter((payment) => monthKey(payment.data_pagamento) === currentMonth)
    .reduce((acc, curr) => acc + curr.valor_pago, 0);

  const faturamentoAno = (payments ?? []).reduce(
    (acc, curr) =>
      format(parseISO(curr.data_pagamento), "yyyy") === format(now, "yyyy")
        ? acc + curr.valor_pago
        : acc,
    0
  );

  type RentalRow = {
    id: string;
    cliente_id: string;
    valor_total: number;
    status_pagamento: PaymentStatus;
    status: RentalStatus;
    data_inicio: string;
    data_fim: string;
    cliente?: { nome_completo?: string; razao_social?: string };
  };

  const rentalsData = (rentals ?? []) as RentalRow[];

  const contasReceber = rentalsData
    .filter((rental) =>
      ["Pendente", "Pago Parcialmente", "Atrasado"].includes(
        rental.status_pagamento
      )
    )
    .reduce((acc, curr) => acc + curr.valor_total, 0);

  const totalAtraso = rentalsData
    .filter((rental) => rental.status === "Atrasado")
    .reduce((acc, curr) => acc + curr.valor_total, 0);

  const inadimplentes = rentalsData
    .filter((rental) => rental.status_pagamento === "Atrasado")
    .map((rental) => {
      const cliente: Client = {
        id: rental.cliente_id,
        organization_id: organizationId,
        tipo: "Pessoa Física",
        email: "",
        telefone: "",
        documento: "",
        nome_completo:
          rental.cliente?.nome_completo ?? rental.cliente?.razao_social ?? "-",
        cliente_desde: rental.data_inicio,
        inadimplente: true
      };
      return {
        cliente,
        valor: rental.valor_total,
        diasAtraso: Math.max(
          0,
          Math.ceil(
            (Date.now() - new Date(rental.data_fim).getTime()) / 86_400_000
          )
        )
      };
    });

  const pagamentoPorMetodo = new Map<PaymentMethod, number>();
  (payments ?? []).forEach((payment) => {
    const total = (pagamentoPorMetodo.get(payment.metodo_pagamento) ?? 0) +
      payment.valor_pago;
    pagamentoPorMetodo.set(payment.metodo_pagamento, total);
  });
  const totalPago = Array.from(pagamentoPorMetodo.values()).reduce(
    (acc, total) => acc + total,
    0
  );

  const historicoMap = new Map<string, number>();
  (payments ?? []).forEach((payment) => {
    const key = monthKey(payment.data_pagamento);
    historicoMap.set(key, (historicoMap.get(key) ?? 0) + payment.valor_pago);
  });

  return {
    faturamentoMes,
    faturamentoAno,
    contasReceber,
    totalAtraso,
    crescimentoMensal: 0,
    faturamentoHistorico: Array.from(historicoMap.entries()).map(
      ([mes, valor]) => ({ mes, valor })
    ),
    metodosPagamentoDistribuicao: Array.from(
      pagamentoPorMetodo.entries(),
      ([metodo, valor]) => ({
        metodo,
        percentual: totalPago ? Math.round((valor / totalPago) * 100) : 0
      })
    ),
    inadimplentes,
    ultimasTransacoes: (payments ?? []).slice(0, 5).map((payment) => ({
      id: payment.id,
      cliente: "-",
      data: payment.data_pagamento,
      valor: payment.valor_pago
    }))
  };
};

