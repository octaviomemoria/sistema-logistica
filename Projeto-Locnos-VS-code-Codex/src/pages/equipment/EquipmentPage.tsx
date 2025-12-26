import { useMemo, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Plus, Upload, Trash2 } from "lucide-react";
import type {
  Equipment,
  EquipmentFilters,
  EquipmentStatus
} from "../../types/domain";
import { useAuth } from "../../hooks/useAuth";
import {
  deleteEquipmentBatch,
  fetchEquipment,
  importEquipmentsFromCsv,
  saveEquipment
} from "../../services/equipmentService";
import { Modal } from "../../components/ui/Modal";
import { TextField } from "../../components/ui/TextField";
import { SelectField } from "../../components/ui/SelectField";
import { TextAreaField } from "../../components/ui/TextAreaField";
import { UploadDropzone } from "../../components/ui/UploadDropzone";
import { SectionCard } from "../../components/ui/SectionCard";
import { SortableHeader } from "../../components/ui/SortableHeader";
import { formatCurrency } from "../../utils/formatters";
import { STORAGE_BUCKETS } from "../../utils/constants";
import { uploadPublicFile } from "../../services/storageService";

interface EquipmentForm extends Omit<Equipment, "id" | "organization_id"> {
  id?: string;
  organization_id?: string;
}

const STATUSES: EquipmentStatus[] = [
  "Disponível",
  "Alugado",
  "Em Manutenção",
  "Reservado"
];

export const EquipmentPage = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const organizationId = profile?.organization_id ?? "";
  const [filters, setFilters] = useState<EquipmentFilters>({
    orderBy: "nome",
    order: "asc"
  });
  const [selected, setSelected] = useState<string[]>([]);
  const [openForm, setOpenForm] = useState(false);
  const [openImport, setOpenImport] = useState(false);
  const [editing, setEditing] = useState<Equipment | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["equipments", organizationId, filters],
    queryFn: () => fetchEquipment(organizationId, filters),
    enabled: Boolean(organizationId)
  });

  const { register, handleSubmit, reset, control, setValue } =
    useForm<EquipmentForm>({
      defaultValues: {
        nome: "",
        categoria: "",
        quantidade_total: 1,
      quantidade_alugada: 0,
      status: "Disponível",
      periodos_locacao: [{ descricao: "Diária", dias: 1, preco: 0 }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "periodos_locacao"
  });

  const mutation = useMutation({
    mutationFn: (payload: EquipmentForm) =>
      saveEquipment({
        ...payload,
        id: payload.id,
        organization_id: organizationId
      }),
    onSuccess: () => {
      toast.success("Equipamento salvo com sucesso.");
      queryClient.invalidateQueries({ queryKey: ["equipments"] });
      setOpenForm(false);
    },
    onError: (error: Error) => toast.error(error.message)
  });

  const importMutation = useMutation({
    mutationFn: (file: File) => importEquipmentsFromCsv(file, organizationId),
    onSuccess: () => {
      toast.success("Importação concluída.");
      queryClient.invalidateQueries({ queryKey: ["equipments"] });
      setOpenImport(false);
    },
    onError: (error: Error) => toast.error(error.message)
  });

  const deleteMutation = useMutation({
    mutationFn: (ids: string[]) => deleteEquipmentBatch(ids),
    onSuccess: () => {
      toast.success("Equipamentos removidos.");
      setSelected([]);
      queryClient.invalidateQueries({ queryKey: ["equipments"] });
    },
    onError: (error: Error) => toast.error(error.message)
  });

  const openCreateModal = (equipment?: Equipment) => {
    setEditing(equipment ?? null);
    setOpenForm(true);
    reset(
      equipment ?? {
        nome: "",
        categoria: "",
        sub_categoria: "",
        marca: "",
        valor_compra: undefined,
        quantidade_total: 1,
        quantidade_alugada: 0,
        status: "Disponível",
        descricao: "",
        periodos_locacao: [{ descricao: "Diária", dias: 1, preco: 0 }]
      }
    );
  };

  const onSubmit = handleSubmit(async (values) => {
    await mutation.mutateAsync(values);
  });

  const handleLogoUpload = async (file: File) => {
    try {
      const url = await uploadPublicFile(
        STORAGE_BUCKETS.equipment,
        file,
        organizationId
      );
      setValue("url_imagem", url);
      toast.success("Imagem enviada com sucesso.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Falha ao enviar imagem."
      );
    }
  };

  const hasSelection = selected.length > 0;

  const sortedData = useMemo(() => data ?? [], [data]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Buscar por nome"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={filters.search ?? ""}
            onChange={(event) =>
              setFilters((current) => ({ ...current, search: event.target.value }))
            }
          />
          <select
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={filters.status ?? "Todos"}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                status: event.target.value as EquipmentFilters["status"]
              }))
            }
          >
            <option value="Todos">Todos os status</option>
            {STATUSES.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-3">
          {hasSelection && (
            <button
              className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-4 py-2 text-rose-600 transition hover:bg-rose-50"
              onClick={() => deleteMutation.mutate(selected)}
            >
              <Trash2 size={18} />
              Excluir selecionados
            </button>
          )}
          <button
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-slate-700 transition hover:bg-slate-100"
            onClick={() => setOpenImport(true)}
          >
            <Upload size={18} />
            Importar CSV
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 font-semibold text-white transition hover:bg-brand-700"
            onClick={() => openCreateModal()}
          >
            <Plus size={18} />
            Novo equipamento
          </button>
        </div>
      </div>

      <SectionCard title="Acervo completo">
        {isLoading ? (
          <p className="text-sm text-slate-500">Carregando equipamentos...</p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-100">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={
                        selected.length > 0 &&
                        selected.length === sortedData.length
                      }
                      onChange={(event) =>
                        setSelected(
                          event.target.checked
                            ? sortedData.map((item) => item.id)
                            : []
                        )
                      }
                    />
                  </th>
                  <th className="px-4 py-3 text-left">
                    <SortableHeader
                      label="Nome"
                      active={filters.orderBy === "nome"}
                      direction={filters.order ?? "asc"}
                      onSort={() =>
                        setFilters((current) => ({
                          ...current,
                          orderBy: "nome",
                          order: current.order === "asc" ? "desc" : "asc"
                        }))
                      }
                    />
                  </th>
                  <th className="px-4 py-3 text-left">Categoria</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Estoque</th>
                  <th className="px-4 py-3 text-right">Valor aquisição</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {sortedData.map((equipment) => (
                  <tr key={equipment.id} className="transition hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.includes(equipment.id)}
                        onChange={(event) =>
                          setSelected((current) =>
                            event.target.checked
                              ? [...current, equipment.id]
                              : current.filter((id) => id !== equipment.id)
                          )
                        }
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {equipment.nome}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {equipment.categoria ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {equipment.status}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {equipment.quantidade_alugada}/{equipment.quantidade_total}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-500">
                      {formatCurrency(equipment.valor_compra ?? 0)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        className="text-sm font-semibold text-brand-600"
                        onClick={() => openCreateModal(equipment)}
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <Modal
        open={openForm}
        onClose={() => setOpenForm(false)}
        title={editing ? "Editar equipamento" : "Novo equipamento"}
        maxWidth="xl"
      >
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <TextField
              label="Nome"
              {...register("nome", { required: "Informe o nome" })}
            />
            <TextField label="Categoria" {...register("categoria")} />
            <TextField label="Subcategoria" {...register("sub_categoria")} />
            <TextField label="Marca" {...register("marca")} />
            <TextField
              label="Valor de compra"
              type="number"
              step="0.01"
              {...register("valor_compra", { valueAsNumber: true })}
            />
            <TextField
              label="Quantidade total"
              type="number"
              {...register("quantidade_total", { valueAsNumber: true })}
            />
            <SelectField label="Status" {...register("status")}>
              {STATUSES.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </SelectField>
          </div>

          <TextAreaField label="Descrição" rows={4} {...register("descricao")} />

          <div className="rounded-2xl border border-slate-100 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-600">
                Planos de locação
              </p>
              <button
                type="button"
                className="text-sm font-semibold text-brand-600"
                onClick={() =>
                  append({ descricao: "Novo plano", dias: 1, preco: 0 })
                }
              >
                Adicionar plano
              </button>
            </div>
            <div className="mt-4 grid gap-4">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid gap-3 rounded-xl border border-slate-100 p-4 md:grid-cols-3"
                >
                  <TextField
                    label="Descrição"
                    {...register(`periodos_locacao.${index}.descricao` as const)}
                  />
                  <TextField
                    label="Dias"
                    type="number"
                    {...register(`periodos_locacao.${index}.dias` as const, {
                      valueAsNumber: true
                    })}
                  />
                  <TextField
                    label="Preço"
                    type="number"
                    step="0.01"
                    {...register(`periodos_locacao.${index}.preco` as const, {
                      valueAsNumber: true
                    })}
                  />
                  <button
                    type="button"
                    className="text-left text-xs font-semibold text-rose-500"
                    onClick={() => remove(index)}
                  >
                    Remover
                  </button>
                </div>
              ))}
            </div>
          </div>

          <UploadDropzone
            label="Imagem do equipamento"
            onFileAccepted={handleLogoUpload}
            accept="image/*"
          />

          <div className="flex justify-end gap-3">
            <button
              type="button"
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm"
              onClick={() => setOpenForm(false)}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={openImport}
        onClose={() => setOpenImport(false)}
        title="Importar equipamentos via CSV"
      >
        <UploadDropzone
          label="Selecione o arquivo CSV"
          accept=".csv"
          onFileAccepted={(file) => importMutation.mutate(file)}
        />
        <p className="mt-4 text-sm text-slate-500">
          Utilize colunas como nome, categoria, quantidade_total, valor_compra e
          status para acelerar o cadastro em massa.
        </p>
      </Modal>
    </div>
  );
};
