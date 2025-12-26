import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Download, Sparkles } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { fetchFinancialSnapshot } from "../../services/financialService";
import { askGeminiQuestion, canUseGemini } from "../../services/reportService";
import { SectionCard } from "../../components/ui/SectionCard";
import { TextAreaField } from "../../components/ui/TextAreaField";
import { formatCurrency } from "../../utils/formatters";
import type { ReportQuestion } from "../../types/domain";

export const ReportsPage = () => {
  const { profile } = useAuth();
  const organizationId = profile?.organization_id ?? "";
  const [question, setQuestion] = useState("");
  const [answers, setAnswers] = useState<ReportQuestion[]>([]);

  const snapshotQuery = useQuery({
    queryKey: ["reports-snapshot", organizationId],
    queryFn: () => fetchFinancialSnapshot(organizationId),
    enabled: Boolean(organizationId)
  });

  const aiMutation = useMutation({
    mutationFn: (prompt: string) =>
      askGeminiQuestion(prompt, snapshotQuery.data!),
    onSuccess: (response) => {
      setAnswers((current) => [response, ...current]);
      setQuestion("");
    }
  });

  const exportInadimplentes = () => {
    if (!snapshotQuery.data) return;
    const csv =
      "nome,valor,dias_atraso\n" +
      snapshotQuery.data.inadimplentes
        .map(
          (item) =>
            `${item.cliente.nome_completo},${item.valor},${item.diasAtraso}`
        )
        .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "inadimplentes.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const taxaUtilizacao =
    snapshotQuery.data && snapshotQuery.data.faturamentoAno
      ? Math.min(100, Math.round((snapshotQuery.data.faturamentoMes / (snapshotQuery.data.faturamentoAno || 1)) * 100))
      : 0;

  return (
    <div className="space-y-6">
      <SectionCard
        title="KPIs avançados"
        action={
          <button
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm"
            onClick={exportInadimplentes}
          >
            <Download size={16} />
            Exportar inadimplentes
          </button>
        }
      >
        {snapshotQuery.isLoading ? (
          <p className="text-sm text-slate-500">Calculando KPIs...</p>
        ) : snapshotQuery.data ? (
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-100 p-4">
              <p className="text-xs uppercase text-slate-500">Taxa de utilização</p>
              <p className="text-3xl font-semibold text-slate-900">
                {taxaUtilizacao}%
              </p>
              <p className="text-xs text-slate-500">
                Estimativa com base nos valores faturados
              </p>
            </div>
            <div className="rounded-2xl border border-slate-100 p-4">
              <p className="text-xs uppercase text-slate-500">Retorno sobre ativos</p>
              <p className="text-3xl font-semibold text-slate-900">
                {formatCurrency(snapshotQuery.data.faturamentoAno)}
              </p>
              <p className="text-xs text-slate-500">Comparado ao parque de equipamentos</p>
            </div>
            <div className="rounded-2xl border border-slate-100 p-4">
              <p className="text-xs uppercase text-slate-500">
                Inadimplência média
              </p>
              <p className="text-3xl font-semibold text-slate-900">
                {snapshotQuery.data.inadimplentes.length} clientes
              </p>
              <p className="text-xs text-slate-500">Necessitam ação da equipe</p>
            </div>
          </div>
        ) : null}
      </SectionCard>

      <SectionCard
        title="Análise com IA (Gemini)"
        action={
          canUseGemini ? (
            <span className="inline-flex items-center gap-2 text-xs text-emerald-600">
              <Sparkles size={14} />
              Integração ativa
            </span>
          ) : (
            <span className="text-xs text-amber-600">
              Configure VITE_GEMINI_API_KEY
            </span>
          )
        }
      >
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (!question || !snapshotQuery.data) return;
            aiMutation.mutate(question);
          }}
        >
          <TextAreaField
            label="Pergunta em linguagem natural"
            rows={3}
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Ex: Qual categoria gerou maior lucro este ano?"
          />
          <button
            type="submit"
            className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
            disabled={!canUseGemini || aiMutation.isPending}
          >
            {aiMutation.isPending ? "Consultando IA..." : "Perguntar ao Gemini"}
          </button>
        </form>

        <div className="mt-6 space-y-4">
          {answers.map((answer) => (
            <div key={answer.id} className="rounded-2xl border border-slate-100 p-4">
              <p className="text-xs uppercase text-slate-500">
                {new Date(answer.criado_em).toLocaleString("pt-BR")}
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                Pergunta: {answer.pergunta}
              </p>
              <p className="mt-2 text-sm text-slate-600 whitespace-pre-line">
                {answer.resposta}
              </p>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
};
