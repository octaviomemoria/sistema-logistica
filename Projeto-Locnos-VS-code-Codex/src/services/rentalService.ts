import type {
  Payment,
  PaymentStatus,
  Rental,
  RentalStatus
} from "../types/domain";
import { getSupabaseClient } from "./supabaseClient";

export interface RentalFilters {
  search?: string;
  status?: RentalStatus | "Todos";
  paymentStatus?: PaymentStatus | "Todos";
  period?: { start: string; end: string };
}

export interface RentalItemInput {
  equipamento_id: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
}

export interface SaveRentalPayload
  extends Partial<Omit<Rental, "itens" | "pagamentos">> {
  id?: string;
  organization_id: string;
  itens: RentalItemInput[];
}

const ACTIVE_STATUSES: RentalStatus[] = ["Agendado", "Ativo"];

const syncEquipmentStock = async (equipmentId: string) => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("locacao_itens")
    .select("quantidade, locacoes!inner(status)")
    .eq("equipamento_id", equipmentId);

  if (error) throw new Error(error.message);
  const total = (data ?? [])
    .filter((item) =>
      ACTIVE_STATUSES.includes((item as any).locacoes.status as RentalStatus)
    )
    .reduce((acc, curr) => acc + curr.quantidade, 0);

  const { error: updateError } = await supabase
    .from("equipamentos")
    .update({ quantidade_alugada: total })
    .eq("id", equipmentId);

  if (updateError) throw new Error(updateError.message);
};

const syncRentalPaymentStatus = async (rentalId: string) => {
  const supabase = getSupabaseClient();
  const [{ data: rental, error: rentalError }, { data: payments, error }] =
    await Promise.all([
      supabase.from("locacoes").select("valor_total").eq("id", rentalId).single(),
      supabase.from("pagamentos").select("*").eq("locacao_id", rentalId)
    ]);

  if (rentalError) throw new Error(rentalError.message);
  if (error) throw new Error(error.message);

  const totalPaid = (payments ?? []).reduce(
    (acc, curr) => acc + curr.valor_pago,
    0
  );

  const status: PaymentStatus =
    totalPaid === 0
      ? "Pendente"
      : totalPaid >= (rental?.valor_total ?? 0)
        ? "Pago"
        : "Pago Parcialmente";

  const { error: updateError } = await supabase
    .from("locacoes")
    .update({ status_pagamento: status })
    .eq("id", rentalId);

  if (updateError) throw new Error(updateError.message);
};

export const fetchRentals = async (
  organizationId: string,
  filters: RentalFilters
) => {
  const supabase = getSupabaseClient();
  let query = supabase
    .from("locacoes")
    .select(
      "*, cliente:clientes(nome_completo, razao_social, nome_fantasia), itens:locacao_itens(*, equipamento:equipamentos(nome, url_imagem)), pagamentos(*)"
    )
    .eq("organization_id", organizationId);

  if (filters.search) {
    query = query.ilike("cliente.nome_completo", `%${filters.search}%`);
  }

  if (filters.status && filters.status !== "Todos") {
    query = query.eq("status", filters.status);
  }

  if (filters.paymentStatus && filters.paymentStatus !== "Todos") {
    query = query.eq("status_pagamento", filters.paymentStatus);
  }

  if (filters.period) {
    query = query
      .gte("data_inicio", filters.period.start)
      .lte("data_fim", filters.period.end);
  }

  query = query.order("data_inicio", { ascending: false });

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data as Rental[];
};

export const saveRental = async (payload: SaveRentalPayload) => {
  const supabase = getSupabaseClient();
  const { itens, id, organization_id, ...locacao } = payload;

  const mutation = id ? "update" : "insert";
  let query = supabase.from("locacoes")[mutation]({
    ...locacao,
    organization_id
  });

  if (id) {
    query = query.eq("id", id);
  }

  const { data: rental, error } = await query.select().single();
  if (error) throw new Error(error.message);

  const rentalId = rental.id as string;

  await supabase.from("locacao_itens").delete().eq("locacao_id", rentalId);

  if (itens.length) {
    const itensPayload = itens.map((item) => ({
      ...item,
      locacao_id: rentalId,
      organization_id
    }));
    const { error: itemError } = await supabase
      .from("locacao_itens")
      .insert(itensPayload);
    if (itemError) throw new Error(itemError.message);

    await Promise.all(
      itens.map(async (item) => {
        await syncEquipmentStock(item.equipamento_id);
      })
    );
  }

  return rental as Rental;
};

export const addPayment = async (
  rentalId: string,
  payload: Omit<Payment, "id" | "organization_id" | "locacao_id"> & {
    organization_id: string;
  }
) => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("pagamentos")
    .insert({
      ...payload,
      locacao_id: rentalId
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  await syncRentalPaymentStatus(rentalId);
  return data as Payment;
};

export const deletePayment = async (payment: Payment) => {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("pagamentos")
    .delete()
    .eq("id", payment.id);
  if (error) throw new Error(error.message);
  await syncRentalPaymentStatus(payment.locacao_id);
};

export const deleteRental = async (rental: Rental) => {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("locacoes").delete().eq("id", rental.id);
  if (error) throw new Error(error.message);
  if (rental.itens) {
    for (const item of rental.itens) {
      await syncEquipmentStock(item.equipamento_id);
    }
  }
};

export const finishRental = async (rentalId: string, late = false) => {
  const supabase = getSupabaseClient();
  const status: RentalStatus = late ? "Atrasado" : "Concluido";
  const { data, error } = await supabase
    .from("locacoes")
    .update({ status })
    .eq("id", rentalId)
    .select("*, itens:locacao_itens(equipamento_id)")
    .single();
  if (error) throw new Error(error.message);
  for (const item of data.itens ?? []) {
    await syncEquipmentStock(item.equipamento_id);
  }
  return data as Rental;
};

export interface CalendarRental {
  id: string;
  data_inicio: string;
  data_fim: string;
  status: RentalStatus;
  cliente: { nome_completo?: string | null; razao_social?: string | null } | null;
}

export const fetchCalendarRentals = async (
  organizationId: string
): Promise<CalendarRental[]> => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("locacoes")
    .select("id, data_inicio, data_fim, status, cliente:clientes(nome_completo)")
    .eq("organization_id", organizationId);
  if (error) throw new Error(error.message);
  return (data ?? []) as CalendarRental[];
};
