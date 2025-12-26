import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, CreditCard, ShoppingBag, Users as UsersIcon } from "lucide-react";
import { StatCard } from "../../components/ui/StatCard";
import { RevenueChart } from "../../components/charts/RevenueChart";
import { RentalStatusChart } from "../../components/charts/RentalStatusChart";
import { SectionCard } from "../../components/ui/SectionCard";
import { useAuth } from "../../hooks/useAuth";
import { fetchDashboardKpis } from "../../services/financialService";
import { formatCurrency } from "../../utils/formatters";
import { RENTAL_STATUS_COLORS } from "../../utils/constants";

export const DashboardPage = () => {
  const { profile } = useAuth();
  const organizationId = profile?.organization_id ?? "";

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-kpis", organizationId],
    queryFn: () => fetchDashboardKpis(organizationId),
    enabled: Boolean(organizationId)
  });

  const roleHighlights = useMemo(() => {
    switch (profile?.role) {
      case "admin":
      case "gerente":
        return ["Monitorar KPIs financeiros", "Acompanhar inadimplentes"];
      case "atendente":
        return ["Acompanhar locações ativas", "Registrar novos clientes"];
      case "tecnico":
        return ["Checar equipamentos em manutenção", "Revisar ocorrências abertas"];
      default:
        return [];
    }
  }, [profile?.role]);

  if (isLoading) {
    return <p className="text-sm text-slate-500">Carregando indicadores...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Faturamento do mês"
          value={formatCurrency(data?.faturamentoMes ?? 0)}
          icon={<CreditCard size={20} />}
        />
        <StatCard
          title="Locações ativas"
          value={String(data?.locacoesAtivas ?? 0)}
          icon={<Activity size={20} />}
        />
        <StatCard
          title="Equipamentos alugados"
          value={String(data?.equipamentosAlugados ?? 0)}
          icon={<ShoppingBag size={20} />}
        />
        <StatCard
          title="Clientes ativos"
          value={String(data?.clientesAtivos ?? 0)}
          icon={<UsersIcon size={20} />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <SectionCard title="Receita mensal" action={<span className="text-xs text-slate-400">Últimos meses</span>}>
          <RevenueChart data={data?.receitaMensal ?? []} />
        </SectionCard>

        <SectionCard title="Status das locações" action={<span className="text-xs text-slate-400">Atualizado em tempo real</span>}>
          <RentalStatusChart data={data?.statusLocacoes ?? []} />
          <div className="mt-4 space-y-2">
            {(data?.statusLocacoes ?? []).map((item) => (
              <div key={item.status} className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">
                  {item.status}
                </span>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${RENTAL_STATUS_COLORS[item.status]}`}>
                  {item.total} contratos
                </span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard
          title="Painel personalizado"
          action={<span className="text-xs text-slate-400">Perfil: {profile?.role}</span>}
        >
          <ul className="space-y-3 text-sm text-slate-600">
            {roleHighlights.map((highlight) => (
              <li key={highlight} className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-brand-500" />
                {highlight}
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="Acesso rápido">
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { label: "Nova locação", link: "/locacoes" },
              { label: "Novo cliente", link: "/clientes" },
              { label: "Cadastrar equipamento", link: "/equipamentos" },
              { label: "Registrar ocorrência", link: "/ocorrencias" }
            ].map((action) => (
              <a
                key={action.label}
                href={action.link}
                className="rounded-2xl border border-slate-100 p-4 text-sm font-semibold text-slate-600 transition hover:border-brand-200 hover:text-brand-600 dark:border-slate-700"
              >
                {action.label}
              </a>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
};
