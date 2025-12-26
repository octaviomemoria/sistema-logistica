import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Plus } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { fetchOccurrences, saveOccurrence } from "../../services/occurrenceService";
import { SectionCard } from "../../components/ui/SectionCard";
import { Modal } from "../../components/ui/Modal";
import { TextAreaField } from "../../components/ui/TextAreaField";
import { TextField } from "../../components/ui/TextField";
import { SelectField } from "../../components/ui/SelectField";
import { formatDate } from "../../utils/formatters";

export const OccurrencesPage = () => {
  const { profile } = useAuth();
  const organizationId = profile?.organization_id ?? "";
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [openModal, setOpenModal] = useState(false);

  const occurrencesQuery = useQuery({
    queryKey: ["occurrences", organizationId, statusFilter],
    queryFn: () =>
      fetchOccurrences(organizationId, statusFilter as any),
    enabled: Boolean(organizationId)
  });

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      locacao_id: "",
      descricao: "",
      status: "Aberto",
      custo_reparo: 0
    }
  });

  const mutation = useMutation({
    mutationFn: (payload: any) =>
      saveOccurrence({ ...payload, organization_id: organizationId }),
    onSuccess: () => {
      toast.success("Ocorrência registrada.");
      setOpenModal(false);
      queryClient.invalidateQueries({ queryKey: ["occurrences"] });
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <select
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="Todos">Todos os status</option>
          {["Aberto", "Em Análise", "Resolvido"].map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>
        <button
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white"
          onClick={() => {
            reset({
              locacao_id: "",
              descricao: "",
              status: "Aberto",
              custo_reparo: 0
            });
            setOpenModal(true);
          }}
        >
          <Plus size={16} />
          Registrar ocorrência
        </button>
      </div>

      <SectionCard title="Ocorrências">
        {occurrencesQuery.isLoading ? (
          <p className="text-sm text-slate-500">Buscando registros...</p>
        ) : (
          <div className="space-y-3">
            {(occurrencesQuery.data ?? []).map((occurrence) => (
              <div
                key={occurrence.id}
                className="rounded-2xl border border-slate-100 p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Locação {occurrence.locacao_id}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatDate(occurrence.data_relato)}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-brand-600">
                    {occurrence.status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  {occurrence.descricao}
                </p>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <Modal
        open={openModal}
        onClose={() => setOpenModal(false)}
        title="Nova ocorrência"
      >
        <form
          className="space-y-4"
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
        >
          <TextField
            label="ID da locação"
            {...register("locacao_id", { required: true })}
          />
          <TextAreaField
            label="Descrição detalhada"
            rows={4}
            {...register("descricao", { required: true })}
          />
          <SelectField label="Status" {...register("status")}>
            <option>Aberto</option>
            <option>Em Análise</option>
            <option>Resolvido</option>
          </SelectField>
          <TextField
            label="Custo de reparo"
            type="number"
            step="0.01"
            {...register("custo_reparo", { valueAsNumber: true })}
          />
          <button
            type="submit"
            className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Salvar
          </button>
        </form>
      </Modal>
    </div>
  );
};
