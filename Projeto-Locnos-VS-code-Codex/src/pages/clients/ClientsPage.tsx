import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Plus, Upload } from "lucide-react";
import type { Client } from "../../types/domain";
import { useAuth } from "../../hooks/useAuth";
import {
  deleteClient,
  fetchClientRentals,
  fetchClients,
  importClientsFromCsv,
  saveClient
} from "../../services/clientService";
import { Modal } from "../../components/ui/Modal";
import { TextField } from "../../components/ui/TextField";
import { SelectField } from "../../components/ui/SelectField";
import { SectionCard } from "../../components/ui/SectionCard";
import { formatCurrency, formatDate } from "../../utils/formatters";
import { UploadDropzone } from "../../components/ui/UploadDropzone";

export const ClientsPage = () => {
  const { profile } = useAuth();
  const organizationId = profile?.organization_id ?? "";
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState<Client | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["clients", organizationId, search],
    queryFn: () => fetchClients(organizationId, { search }),
    enabled: Boolean(organizationId)
  });

  const historyQuery = useQuery({
    queryKey: ["client-history", historyOpen?.id],
    queryFn: () => fetchClientRentals(historyOpen!.id),
    enabled: Boolean(historyOpen?.id)
  });

  const { register, handleSubmit, reset } = useForm<Client>({
    defaultValues: {
      tipo: "Pessoa Física",
      nome_completo: ""
    } as Client
  });

  const mutation = useMutation({
    mutationFn: (payload: Client) =>
      saveClient({ ...payload, organization_id: organizationId }),
    onSuccess: () => {
      toast.success("Cliente salvo.");
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      setModalOpen(false);
    },
    onError: (error: Error) => toast.error(error.message)
  });

  const removeMutation = useMutation({
    mutationFn: deleteClient,
    onSuccess: () => {
      toast.success("Cliente removido.");
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
    onError: (error: Error) => toast.error(error.message)
  });

  const importMutation = useMutation({
    mutationFn: (file: File) => importClientsFromCsv(file, organizationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Clientes importados.");
      setImportOpen(false);
    }
  });

  const openForm = (client?: Client) => {
    reset(client ?? ({ tipo: "Pessoa Física" } as Client));
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <input
          type="search"
          placeholder="Buscar nome, documento ou e-mail"
          className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm md:w-96"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <div className="flex gap-3">
          <button
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-slate-600 hover:bg-slate-100"
            onClick={() => setImportOpen(true)}
          >
            <Upload size={16} />
            Importar CSV
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 font-semibold text-white"
            onClick={() => openForm()}
          >
            <Plus size={16} />
            Novo cliente
          </button>
        </div>
      </div>

      <SectionCard title="Clientes cadastrados">
        {isLoading ? (
          <p className="text-sm text-slate-500">Carregando...</p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-100">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">Nome/Razão</th>
                  <th className="px-4 py-3 text-left">Documento</th>
                  <th className="px-4 py-3 text-left">Contato</th>
                  <th className="px-4 py-3 text-left">Cliente desde</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {(data ?? []).map((client) => (
                  <tr key={client.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {client.nome_completo ?? client.razao_social}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {client.documento}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {client.email} • {client.telefone}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {formatDate(client.cliente_desde)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-4 text-xs font-semibold">
                        <button
                          className="text-brand-600"
                          onClick={() => setHistoryOpen(client)}
                        >
                          Histórico
                        </button>
                        <button
                          className="text-slate-500"
                          onClick={() => openForm(client)}
                        >
                          Editar
                        </button>
                        <button
                          className="text-rose-500"
                          onClick={() => removeMutation.mutate(client.id)}
                        >
                          Remover
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Cadastro de cliente"
        maxWidth="lg"
      >
        <form
          className="grid gap-4 md:grid-cols-2"
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
        >
          <SelectField label="Tipo" {...register("tipo")}>
            <option value="Pessoa Física">Pessoa Física</option>
            <option value="Pessoa Jurídica">Pessoa Jurídica</option>
          </SelectField>
          <TextField label="Nome completo" {...register("nome_completo")} />
          <TextField label="Razão Social" {...register("razao_social")} />
          <TextField label="Nome Fantasia" {...register("nome_fantasia")} />
          <TextField label="Documento (CPF/CNPJ)" {...register("documento")} />
          <TextField label="E-mail" type="email" {...register("email")} />
          <TextField label="Telefone" {...register("telefone")} />
          <TextField label="CEP" {...register("endereco.cep" as const)} />
          <TextField
            label="Cidade"
            {...register("endereco.cidade" as const)}
          />

          <div className="md:col-span-2 flex justify-end gap-3">
            <button
              type="button"
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm"
              onClick={() => setModalOpen(false)}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white"
              disabled={mutation.isPending}
            >
              Salvar
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(historyOpen)}
        onClose={() => setHistoryOpen(null)}
        title={`Histórico de ${historyOpen?.nome_completo ?? historyOpen?.razao_social}`}
      >
        {historyQuery.isLoading ? (
          <p className="text-sm text-slate-500">Carregando histórico...</p>
        ) : (
          <div className="space-y-4 text-sm">
            {(historyQuery.data ?? []).map((rental) => (
              <div
                key={rental.id}
                className="rounded-2xl border border-slate-100 p-4"
              >
                <p className="font-semibold text-slate-900">
                  {formatDate(rental.data_inicio)} — {formatDate(rental.data_fim)}
                </p>
                <p className="text-slate-500">{rental.status}</p>
                <p className="text-slate-500">
                  Valor total: {formatCurrency(rental.valor_total)}
                </p>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <Modal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        title="Importar clientes"
      >
        <UploadDropzone
          label="Arquivo CSV"
          accept=".csv"
          onFileAccepted={(file) => importMutation.mutate(file)}
        />
        <p className="mt-4 text-sm text-slate-500">
          Utilize colunas como nome_completo, documento, email e telefone.
        </p>
      </Modal>
    </div>
  );
};
