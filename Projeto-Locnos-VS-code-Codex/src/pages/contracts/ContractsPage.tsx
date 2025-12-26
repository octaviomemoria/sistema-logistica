import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useAuth } from "../../hooks/useAuth";
import {
  deleteContractTemplate,
  fetchContractTemplates,
  generateContractPreview,
  saveContractTemplate
} from "../../services/contractService";
import { SectionCard } from "../../components/ui/SectionCard";
import { Modal } from "../../components/ui/Modal";
import { TextField } from "../../components/ui/TextField";
import { TextAreaField } from "../../components/ui/TextAreaField";

export const ContractsPage = () => {
  const { profile } = useAuth();
  const organizationId = profile?.organization_id ?? "";
  const queryClient = useQueryClient();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null
  );
  const [openModal, setOpenModal] = useState(false);
  const [previewForm, setPreviewForm] = useState({
    cliente: "Cliente Exemplo",
    documento: "00.000.000/0000-00",
    data_inicio: new Date().toISOString().slice(0, 10),
    data_fim: new Date().toISOString().slice(0, 10),
    valor_total: 1000
  });

  const templatesQuery = useQuery({
    queryKey: ["contracts", organizationId],
    queryFn: () => fetchContractTemplates(organizationId),
    enabled: Boolean(organizationId)
  });

  const { register, handleSubmit, reset } = useForm({
    defaultValues: { nome: "", conteudo: "" }
  });

  const mutation = useMutation({
    mutationFn: (payload: any) =>
      saveContractTemplate({ ...payload, organization_id: organizationId }),
    onSuccess: () => {
      toast.success("Modelo salvo.");
      setOpenModal(false);
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteContractTemplate,
    onSuccess: () => {
      toast.success("Modelo excluído.");
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
    }
  });

  const selectedTemplate = templatesQuery.data?.find(
    (template) => template.id === selectedTemplateId
  );

  const previewHtml =
    selectedTemplate && templatesQuery.data
      ? generateContractPreview(selectedTemplate, {
          id: "preview",
          organization_id: organizationId,
          cliente_id: "cliente",
          cliente: {
            id: "cliente",
            organization_id: organizationId,
            tipo: "Pessoa Juridica",
            email: "",
            telefone: "",
            documento: previewForm.documento,
            nome_completo: previewForm.cliente
          } as any,
          data_inicio: previewForm.data_inicio,
          data_fim: previewForm.data_fim,
          duracao_dias: 1,
          status: "Agendado",
          status_pagamento: "Pendente",
          valor_total: previewForm.valor_total,
          itens: [],
          pagamentos: []
        } as any)
      : "";

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <SectionCard
        title="Modelos"
        action={
          <button
            className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white"
            onClick={() => {
              reset({ nome: "", conteudo: "" });
              setOpenModal(true);
            }}
          >
            Novo modelo
          </button>
        }
      >
        <div className="space-y-3">
          {(templatesQuery.data ?? []).map((template) => (
            <div
              key={template.id}
              className={`rounded-2xl border p-4 ${
                selectedTemplateId === template.id
                  ? "border-brand-500"
                  : "border-slate-100"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900">{template.nome}</p>
                  <p className="text-xs text-slate-500">
                    Atualizado em {template.updated_at?.slice(0, 10)}
                  </p>
                </div>
                <div className="flex gap-3 text-xs font-semibold">
                  <button
                    className="text-brand-600"
                    onClick={() => {
                      setSelectedTemplateId(template.id);
                    }}
                  >
                    Visualizar
                  </button>
                  <button
                    className="text-rose-500"
                    onClick={() => deleteMutation.mutate(template.id)}
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Prévia do contrato">
        {selectedTemplate ? (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <TextField
                label="Cliente"
                value={previewForm.cliente}
                onChange={(event) =>
                  setPreviewForm((current) => ({
                    ...current,
                    cliente: event.target.value
                  }))
                }
              />
              <TextField
                label="Documento"
                value={previewForm.documento}
                onChange={(event) =>
                  setPreviewForm((current) => ({
                    ...current,
                    documento: event.target.value
                  }))
                }
              />
              <TextField
                type="date"
                label="Início"
                value={previewForm.data_inicio}
                onChange={(event) =>
                  setPreviewForm((current) => ({
                    ...current,
                    data_inicio: event.target.value
                  }))
                }
              />
              <TextField
                type="date"
                label="Fim"
                value={previewForm.data_fim}
                onChange={(event) =>
                  setPreviewForm((current) => ({
                    ...current,
                    data_fim: event.target.value
                  }))
                }
              />
              <TextField
                label="Valor total"
                type="number"
                value={previewForm.valor_total}
                onChange={(event) =>
                  setPreviewForm((current) => ({
                    ...current,
                    valor_total: Number(event.target.value)
                  }))
                }
              />
            </div>
            <div
              className="prose prose-sm max-w-none rounded-2xl border border-slate-100 bg-white p-4"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            Seleciona um modelo à esquerda para visualizar.
          </p>
        )}
      </SectionCard>

      <Modal
        open={openModal}
        onClose={() => setOpenModal(false)}
        title="Modelo de contrato"
      >
        <form
          className="space-y-4"
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
        >
          <TextField label="Nome do modelo" {...register("nome")} />
          <TextAreaField
            label="Conteúdo (markdown ou HTML)"
            rows={10}
            {...register("conteudo")}
          />
          <p className="text-xs text-slate-500">
            Utilize placeholders como [NOME_CLIENTE], [VALOR_TOTAL], [DATA_INICIO].
          </p>
          <button
            type="submit"
            className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Salvar modelo
          </button>
        </form>
      </Modal>
    </div>
  );
};
