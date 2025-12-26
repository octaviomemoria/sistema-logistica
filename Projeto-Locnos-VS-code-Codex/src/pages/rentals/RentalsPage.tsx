import { useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { CalendarDays, ListChecks, Plus } from "lucide-react";
import type { Payment, Rental, RentalStatus, PaymentStatus } from "../../types/domain";
import { useAuth } from "../../hooks/useAuth";
import { SectionCard } from "../../components/ui/SectionCard";
import { Modal } from "../../components/ui/Modal";
import { TextField } from "../../components/ui/TextField";
import { SelectField } from "../../components/ui/SelectField";
import { TextAreaField } from "../../components/ui/TextAreaField";
import { RentalsCalendar } from "../../components/calendar/RentalsCalendar";
import {
  addPayment,
  deletePayment,
  deleteRental,
  fetchCalendarRentals,
  fetchRentals,
  finishRental,
  saveRental
} from "../../services/rentalService";
import { fetchClients } from "../../services/clientService";
import { fetchEquipment } from "../../services/equipmentService";
import { formatCurrency, formatDate } from "../../utils/formatters";
import { StatusChip } from "../../components/ui/StatusChip";
import { PAYMENT_STATUS_COLORS, RENTAL_STATUS_COLORS } from "../../utils/constants";

interface RentalFilters {
  status?: RentalStatus | "Todos";
  paymentStatus?: PaymentStatus | "Todos";
  search?: string;
}

export const RentalsPage = () => {
  const { profile } = useAuth();
  const organizationId = profile?.organization_id ?? "";
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<RentalFilters>({});
  const [view, setView] = useState<"lista" | "calendario">("lista");
  const [formOpen, setFormOpen] = useState(false);
  const [detail, setDetail] = useState<Rental | null>(null);

  const rentalsQuery = useQuery({
    queryKey: ["rentals", organizationId, filters],
    queryFn: () => fetchRentals(organizationId, filters),
    enabled: Boolean(organizationId)
  });

  const calendarQuery = useQuery({
    queryKey: ["rentals-calendar", organizationId],
    queryFn: () => fetchCalendarRentals(organizationId),
    enabled: Boolean(organizationId)
  });

  const clientsQuery = useQuery({
    queryKey: ["clients-select", organizationId],
    queryFn: () => fetchClients(organizationId, { search: "" }),
    enabled: Boolean(organizationId)
  });

  const equipmentQuery = useQuery({
    queryKey: ["equipments-select", organizationId],
    queryFn: () =>
      fetchEquipment(organizationId, { orderBy: "nome", order: "asc" }),
    enabled: Boolean(organizationId)
  });

  const form = useForm<Partial<Rental> & { itens: any[] }>({
    defaultValues: {
      cliente_id: "",
      status: "Agendado",
      status_pagamento: "Pendente",
      data_inicio: new Date().toISOString().slice(0, 10),
      data_fim: new Date().toISOString().slice(0, 10),
      itens: []
    }
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "itens" });

  const rentalMutation = useMutation({
    mutationFn: (payload: any) =>
      saveRental({
        ...payload,
        organization_id: organizationId,
        itens:
          payload.itens?.map((item: any) => ({
            equipamento_id: item.equipamento_id,
            quantidade: Number(item.quantidade),
            valor_unitario: Number(item.valor_unitario),
            valor_total: Number(item.valor_unitario) * Number(item.quantidade)
          })) ?? []
      }),
    onSuccess: () => {
      toast.success("Locação salva.");
      setFormOpen(false);
      queryClient.invalidateQueries({ queryKey: ["rentals"] });
    },
    onError: (error: Error) => toast.error(error.message)
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRental,
    onSuccess: () => {
      toast.success("Locação excluída.");
      setDetail(null);
      queryClient.invalidateQueries({ queryKey: ["rentals"] });
    }
  });

  const finishMutation = useMutation({
    mutationFn: ({ rentalId, late }: { rentalId: string; late: boolean }) =>
      finishRental(rentalId, late),
    onSuccess: () => {
      toast.success("Locação encerrada.");
      queryClient.invalidateQueries({ queryKey: ["rentals"] });
    }
  });

  const paymentMutation = useMutation({
    mutationFn: (payload: {
      rentalId: string;
      payment: Omit<Payment, "id" | "locacao_id" | "organization_id">;
    }) =>
      addPayment(payload.rentalId, {
        ...payload.payment,
        organization_id: organizationId
      }),
    onSuccess: () => {
      toast.success("Pagamento registrado.");
      queryClient.invalidateQueries({ queryKey: ["rentals"] });
    }
  });

  const paymentDeleteMutation = useMutation({
    mutationFn: deletePayment,
    onSuccess: () => {
      toast.success("Pagamento removido.");
      queryClient.invalidateQueries({ queryKey: ["rentals"] });
    }
  });

  const openForm = (rental?: Rental) => {
    if (rental) {
      form.reset({
        ...rental,
        itens: rental.itens ?? []
      });
    } else {
      form.reset({
        cliente_id: "",
        status: "Agendado",
        status_pagamento: "Pendente",
        data_inicio: new Date().toISOString().slice(0, 10),
        data_fim: new Date().toISOString().slice(0, 10),
        itens: []
      });
    }
    setFormOpen(true);
  };

  const rentals = useMemo(() => rentalsQuery.data ?? [], [rentalsQuery.data]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-3">
          <input
            type="search"
            placeholder="Buscar cliente"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={filters.search ?? ""}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                search: event.target.value
              }))
            }
          />
          <select
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={filters.status ?? "Todos"}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                status: event.target.value as RentalFilters["status"]
              }))
            }
          >
            <option value="Todos">Todos os status</option>
            {["Agendado", "Ativo", "Concluido", "Atrasado"].map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setView("lista")}
            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm ${
              view === "lista"
                ? "border-brand-200 bg-brand-50 text-brand-600"
                : "border-slate-200 text-slate-600"
            }`}
          >
            <ListChecks size={16} />
            Lista
          </button>
          <button
            onClick={() => setView("calendario")}
            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm ${
              view === "calendario"
                ? "border-brand-200 bg-brand-50 text-brand-600"
                : "border-slate-200 text-slate-600"
            }`}
          >
            <CalendarDays size={16} />
            Calendário
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white"
            onClick={() => openForm()}
          >
            <Plus size={16} />
            Nova locação
          </button>
        </div>
      </div>

      {view === "lista" ? (
        <SectionCard title="Locações registradas">
          {rentalsQuery.isLoading ? (
            <p className="text-sm text-slate-500">Carregando locações...</p>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-100">
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-left">Cliente</th>
                    <th className="px-4 py-3 text-left">Período</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Pagamento</th>
                    <th className="px-4 py-3 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {rentals.map((rental) => (
                    <tr
                      key={rental.id}
                      className="cursor-pointer hover:bg-slate-50"
                      onClick={() => setDetail(rental)}
                    >
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {rental.cliente?.nome_completo ??
                          rental.cliente?.razao_social ??
                          "-"}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {formatDate(rental.data_inicio)} —{" "}
                        {formatDate(rental.data_fim)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusChip
                          label={rental.status}
                          className={RENTAL_STATUS_COLORS[rental.status]}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <StatusChip
                          label={rental.status_pagamento}
                          className={PAYMENT_STATUS_COLORS[rental.status_pagamento]}
                        />
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900">
                        {formatCurrency(rental.valor_total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      ) : (
        <SectionCard title="Visão mensal">
          <RentalsCalendar rentals={calendarQuery.data ?? []} />
        </SectionCard>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title="Cadastro de locação"
        maxWidth="xl"
      >
        <form className="space-y-4" onSubmit={form.handleSubmit((values) => rentalMutation.mutate(values))}>
          <div className="grid gap-4 md:grid-cols-2">
            <SelectField label="Cliente" {...form.register("cliente_id", { required: true })}>
              <option value="">Selecione</option>
              {(clientsQuery.data ?? []).map((client) => (
                <option key={client.id} value={client.id}>
                  {client.nome_completo ?? client.razao_social}
                </option>
              ))}
            </SelectField>
            <SelectField label="Status" {...form.register("status")}>
              {["Agendado", "Ativo", "Concluido", "Atrasado"].map((status) => (
                <option key={status}>{status}</option>
              ))}
            </SelectField>
            <TextField type="date" label="Data início" {...form.register("data_inicio")} />
            <TextField type="date" label="Data fim" {...form.register("data_fim")} />
            <TextField
              label="Valor total"
              type="number"
              step="0.01"
              {...form.register("valor_total", { valueAsNumber: true })}
            />
            <TextField
              label="Valor frete"
              type="number"
              step="0.01"
              {...form.register("valor_frete_entrega", { valueAsNumber: true })}
            />
          </div>

          <div className="rounded-2xl border border-slate-100 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-600">
                Itens da locação
              </p>
              <button
                type="button"
                className="text-sm font-semibold text-brand-600"
                onClick={() =>
                  append({
                    equipamento_id: "",
                    quantidade: 1,
                    valor_unitario: 0
                  })
                }
              >
                Adicionar item
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid gap-3 rounded-xl border border-slate-100 p-4 md:grid-cols-4"
                >
                  <SelectField
                    label="Equipamento"
                    {...form.register(`itens.${index}.equipamento_id` as const)}
                  >
                    <option value="">Selecione</option>
                    {(equipmentQuery.data ?? []).map((equipment) => (
                      <option key={equipment.id} value={equipment.id}>
                        {equipment.nome}
                      </option>
                    ))}
                  </SelectField>
                  <TextField
                    label="Quantidade"
                    type="number"
                    {...form.register(`itens.${index}.quantidade` as const, {
                      valueAsNumber: true
                    })}
                  />
                  <TextField
                    label="Valor unitário"
                    type="number"
                    step="0.01"
                    {...form.register(
                      `itens.${index}.valor_unitario` as const,
                      { valueAsNumber: true }
                    )}
                  />
                  <button
                    type="button"
                    className="self-end rounded-xl border border-rose-200 px-3 py-2 text-sm text-rose-600"
                    onClick={() => remove(index)}
                  >
                    Remover
                  </button>
                </div>
              ))}
            </div>
          </div>

          <TextAreaField label="Observações" rows={3} {...form.register("observacoes")} />

          <div className="flex justify-end gap-3">
            <button
              type="button"
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm"
              onClick={() => setFormOpen(false)}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white"
              disabled={rentalMutation.isPending}
            >
              Salvar
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title="Detalhes da locação"
        maxWidth="xl"
      >
        {detail && (
          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold text-slate-900">
                  {detail.cliente?.nome_completo ?? detail.cliente?.razao_social}
                </p>
                <p className="text-slate-500">
                  {formatDate(detail.data_inicio)} — {formatDate(detail.data_fim)}
                </p>
              </div>
              <div className="flex gap-2">
                <StatusChip
                  label={detail.status}
                  className={RENTAL_STATUS_COLORS[detail.status]}
                />
                <StatusChip
                  label={detail.status_pagamento}
                  className={PAYMENT_STATUS_COLORS[detail.status_pagamento]}
                />
              </div>
            </div>

            <SectionCard title="Itens alugados">
              <div className="space-y-2">
                {(detail.itens ?? []).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-2"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">
                        {item.equipamento?.nome}
                      </p>
                      <p className="text-slate-500">
                        {item.quantidade} unidade(s)
                      </p>
                    </div>
                    <p className="font-semibold text-slate-900">
                      {formatCurrency(item.valor_total)}
                    </p>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard
              title="Pagamentos"
              action={
                <button
                  className="text-sm font-semibold text-brand-600"
                  onClick={() =>
                    paymentMutation.mutate({
                      rentalId: detail.id,
                      payment: {
                        valor_pago: detail.valor_total,
                        data_pagamento: new Date().toISOString().slice(0, 10),
                        metodo_pagamento: "PIX"
                      }
                    })
                  }
                >
                  Registrar pagamento rápido
                </button>
              }
            >
              <div className="space-y-2">
                {(detail.pagamentos ?? []).map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-2"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">
                        {formatCurrency(payment.valor_pago)}
                      </p>
                      <p className="text-slate-500">
                        {formatDate(payment.data_pagamento)} •{" "}
                        {payment.metodo_pagamento}
                      </p>
                    </div>
                    <button
                      className="text-xs font-semibold text-rose-500"
                      onClick={() => paymentDeleteMutation.mutate(payment)}
                    >
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            </SectionCard>

            <div className="flex justify-between gap-3">
              <button
                className="rounded-xl border border-rose-200 px-4 py-2 text-sm text-rose-600"
                onClick={() => deleteMutation.mutate(detail)}
              >
                Excluir locação
              </button>
              <div className="flex gap-3">
                <button
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm"
                  onClick={() =>
                    finishMutation.mutate({ rentalId: detail.id, late: true })
                  }
                >
                  Encerrar atrasada
                </button>
                <button
                  className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white"
                  onClick={() =>
                    finishMutation.mutate({ rentalId: detail.id, late: false })
                  }
                >
                  Finalizar
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
