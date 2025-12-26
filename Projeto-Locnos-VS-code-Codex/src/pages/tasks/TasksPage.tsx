import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Plus } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { fetchTasks, saveTask, deleteTask } from "../../services/taskService";
import { SectionCard } from "../../components/ui/SectionCard";
import { Modal } from "../../components/ui/Modal";
import { TextField } from "../../components/ui/TextField";
import { SelectField } from "../../components/ui/SelectField";
import { TextAreaField } from "../../components/ui/TextAreaField";
import { TASK_STATUS_COLORS } from "../../utils/constants";

export const TasksPage = () => {
  const { profile } = useAuth();
  const organizationId = profile?.organization_id ?? "";
  const queryClient = useQueryClient();
  const [status, setStatus] = useState("Todos");
  const [openModal, setOpenModal] = useState(false);

  const tasksQuery = useQuery({
    queryKey: ["tasks", organizationId, status],
    queryFn: () => fetchTasks(organizationId, status as any),
    enabled: Boolean(organizationId)
  });

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      titulo: "",
      descricao: "",
      status: "Pendente",
      data_vencimento: ""
    }
  });

  const mutation = useMutation({
    mutationFn: (payload: any) =>
      saveTask({ ...payload, organization_id: organizationId }),
    onSuccess: () => {
      toast.success("Tarefa salva.");
      setOpenModal(false);
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      toast.success("Tarefa removida.");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <select
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="Todos">Todos</option>
          <option value="Pendente">Pendentes</option>
          <option value="Em Andamento">Em andamento</option>
          <option value="Concluída">Concluídas</option>
        </select>
        <button
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white"
          onClick={() => {
            reset({
              titulo: "",
              descricao: "",
              status: "Pendente",
              data_vencimento: ""
            });
            setOpenModal(true);
          }}
        >
          <Plus size={16} />
          Nova tarefa
        </button>
      </div>

      <SectionCard title="Atividades">
        {tasksQuery.isLoading ? (
          <p className="text-sm text-slate-500">Carregando tarefas...</p>
        ) : (
          <div className="space-y-3">
            {(tasksQuery.data ?? []).map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between rounded-2xl border border-slate-100 p-4"
              >
                <div>
                  <p className="font-semibold text-slate-900">{task.titulo}</p>
                  <p className="text-sm text-slate-500">{task.descricao}</p>
                  {task.data_vencimento && (
                    <p className="text-xs text-slate-400">
                      Vencimento: {task.data_vencimento}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${TASK_STATUS_COLORS[task.status]}`}
                  >
                    {task.status}
                  </span>
                  <div className="mt-2 flex gap-3 text-xs font-semibold">
                  <button
                    className="text-brand-600"
                    onClick={() => {
                        reset({
                          titulo: task.titulo,
                          descricao: task.descricao ?? "",
                          status: task.status,
                          data_vencimento: task.data_vencimento ?? ""
                        });
                        setOpenModal(true);
                      }}
                  >
                      Editar
                    </button>
                    <button
                      className="text-rose-500"
                      onClick={() => deleteMutation.mutate(task.id)}
                    >
                      Remover
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <Modal
        open={openModal}
        onClose={() => setOpenModal(false)}
        title="Cadastro de tarefa"
      >
        <form
          className="space-y-4"
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
        >
          <TextField label="Título" {...register("titulo", { required: true })} />
          <TextAreaField label="Descrição" rows={4} {...register("descricao")} />
          <SelectField label="Status" {...register("status")}>
            <option>Pendente</option>
            <option>Em Andamento</option>
            <option>Concluída</option>
          </SelectField>
          <TextField type="date" label="Data de vencimento" {...register("data_vencimento")} />
          <button
            type="submit"
            className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Salvar tarefa
          </button>
        </form>
      </Modal>
    </div>
  );
};
