import { useQuery } from "@tanstack/react-query";
import { Pie, PieChart, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { useAuth } from "../../hooks/useAuth";
import { fetchFinancialSnapshot } from "../../services/financialService";
import { StatCard } from "../../components/ui/StatCard";
import { SectionCard } from "../../components/ui/SectionCard";
import { RevenueChart } from "../../components/charts/RevenueChart";
import { formatCurrency, formatDate } from "../../utils/formatters";

const COLORS = ["#2563eb", "#0ea5e9", "#22c55e", "#f97316"];

export const FinancialDashboard = () => {
  const { profile } = useAuth();
  const organizationId = profile?.organization_id ?? "";

  const { data, isLoading } = useQuery({
    queryKey: ["financial-snapshot", organizationId],
    queryFn: () => fetchFinancialSnapshot(organizationId),
    enabled: Boolean(organizationId)
  });

  if (isLoading || !data) {
    return <p className="text-sm text-slate-500">Carregando dados financeiros...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Faturamento mês" value={formatCurrency(data.faturamentoMes)} />
        <StatCard title="Faturamento YTD" value={formatCurrency(data.faturamentoAno)} />
        <StatCard title="Contas a receber" value={formatCurrency(data.contasReceber)} />
        <StatCard title="Total em atraso" value={formatCurrency(data.totalAtraso)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <SectionCard title="Faturamento histórico">
          <RevenueChart data={data.faturamentoHistorico} />
        </SectionCard>

        <SectionCard title="Métodos de pagamento">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={data.metodosPagamentoDistribuicao}
                dataKey="percentual"
                nameKey="metodo"
                innerRadius={70}
                outerRadius={110}
              >
                {data.metodosPagamentoDistribuicao.map((entry, index) => (
                  <Cell key={entry.metodo} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => `${value}%`} />
            </PieChart>
          </ResponsiveContainer>
        </SectionCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Clientes inadimplentes">
          <div className="space-y-3">
            {data.inadimplentes.length === 0 ? (
              <p className="text-sm text-slate-500">Sem inadimplência no momento.</p>
            ) : (
              data.inadimplentes.map((item) => (
                <div key={item.cliente.id} className="flex items-center justify-between rounded-2xl border border-slate-100 px-4 py-3">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {item.cliente.nome_completo}
                    </p>
                    <p className="text-xs text-slate-500">
                      {item.diasAtraso} dias em atraso
                    </p>
                  </div>
                  <p className="font-semibold text-rose-500">
                    {formatCurrency(item.valor)}
                  </p>
                </div>
              ))
            )}
          </div>
        </SectionCard>

        <SectionCard title="Últimas transações">
          <div className="space-y-3">
            {data.ultimasTransacoes.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between rounded-2xl border border-slate-100 px-4 py-3">
                <div>
                  <p className="font-semibold text-slate-900">
                    {formatCurrency(transaction.valor)}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatDate(transaction.data)}
                  </p>
                </div>
                <p className="text-sm text-slate-500">{transaction.cliente}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
};
