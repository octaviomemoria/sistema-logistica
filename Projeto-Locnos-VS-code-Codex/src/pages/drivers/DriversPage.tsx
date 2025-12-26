import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Plus } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { fetchDrivers, saveDriver, deleteDriver } from "../../services/driverService";
import { SectionCard } from "../../components/ui/SectionCard";
import { Modal } from "../../components/ui/Modal";
import { TextField } from "../../components/ui/TextField";

export const DriversPage = () => {
  const { profile } = useAuth();
  const organizationId = profile?.organization_id ?? "";
  const queryClient = useQueryClient();
  const [openModal, setOpenModal] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["drivers", organizationId],
    queryFn: () => fetchDrivers(organizationId),
    enabled: Boolean(organizationId)
  });

  const { register, handleSubmit, reset } = useForm({
    defaultValues: { nome: "", telefone: "", observacoes: "" }
  });

  const mutation = useMutation({
    mutationFn: (payload: any) =>
      saveDriver({ ...payload, organization_id: organizationId }),
    onSuccess: () => {
      toast.success("Motorista salvo.");
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      setOpenModal(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDriver,
    onSuccess: () => {
      toast.success("Motorista removido.");
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white"
          onClick={() => {
            reset({ nome: "", telefone: "", observacoes: "" });
            setOpenModal(true);
          }}
        >
          <Plus size={16} />
          Novo motorista
        </button>
      </div>

      <SectionCard title="Motoristas cadastrados">
        {isLoading ? (
          <p className="text-sm text-slate-500">Carregando...</p>
        ) : (
          <div className="space-y-3">
            {(data ?? []).map((driver) => (
              <div
                key={driver.id}
                className="flex items-center justify-between rounded-2xl border border-slate-100 p-4"
              >
                <div>
                  <p className="font-semibold text-slate-900">{driver.nome}</p>
                  <p className="text-sm text-slate-500">{driver.telefone}</p>
                  {driver.observacoes && (
                    <p className="text-xs text-slate-400">{driver.observacoes}</p>
                  )}
                </div>
                <div className="flex gap-3 text-xs font-semibold">
                  <button
                    className="text-brand-600"
                    onClick={() => {
                      reset({
                        nome: driver.nome,
                        telefone: driver.telefone ?? "",
                        observacoes: driver.observacoes ?? ""
                      });
                      setOpenModal(true);
                    }}
                  >
                    Editar
                  </button>
                  <button
                    className="text-rose-500"
                    onClick={() => deleteMutation.mutate(driver.id)}
                  >
                    Remover
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <Modal
        open={openModal}
        onClose={() => setOpenModal(false)}
        title="Cadastro de motorista"
      >
        <form
          className="space-y-4"
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
        >
          <TextField label="Nome" {...register("nome", { required: true })} />
          <TextField label="Telefone" {...register("telefone")} />
          <TextField label="Observações" {...register("observacoes")} />
          <button
            type="submit"
            className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Salvar motorista
          </button>
        </form>
      </Modal>
    </div>
  );
};
