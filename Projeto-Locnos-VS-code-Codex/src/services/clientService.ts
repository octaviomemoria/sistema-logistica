import type { Client, ClientType } from "../types/domain";
import { getSupabaseClient } from "./supabaseClient";
import { parseCsv } from "../utils/csv";

export interface ClientFilters {
  search?: string;
  inadimplente?: boolean;
  orderBy?: keyof Pick<Client, "nome_completo" | "razao_social" | "cliente_desde">;
  order?: "asc" | "desc";
}

export const fetchClients = async (
  organizationId: string,
  filters: ClientFilters
) => {
  const supabase = getSupabaseClient();
  let query = supabase
    .from("clientes")
    .select("*")
    .eq("organization_id", organizationId);

  if (filters.search) {
    query = query.or(
      `nome_completo.ilike.%${filters.search}%,razao_social.ilike.%${filters.search}%,documento.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
    );
  }

  if (typeof filters.inadimplente === "boolean") {
    query = query.eq("inadimplente", filters.inadimplente);
  }

  if (filters.orderBy) {
    query = query.order(filters.orderBy, {
      ascending: filters.order === "asc"
    });
  } else {
    query = query.order("cliente_desde", { ascending: false });
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data as Client[];
};

export const saveClient = async (
  payload: Partial<Client> & { organization_id: string }
) => {
  const supabase = getSupabaseClient();
  const mutation = payload.id ? "update" : "insert";
  let query = supabase.from("clientes")[mutation](payload);
  if (payload.id) {
    query = query.eq("id", payload.id);
  }
  const { data, error } = await query.select().single();
  if (error) throw new Error(error.message);
  return data as Client;
};

export const deleteClient = async (id: string) => {
  const supabase = getSupabaseClient();
  const linkedRentals = await supabase
    .from("locacoes")
    .select("id", { count: "exact", head: true })
    .eq("cliente_id", id);

  if (linkedRentals.error) throw new Error(linkedRentals.error.message);
  if ((linkedRentals.count ?? 0) > 0) {
    throw new Error(
      "Não é possível excluir um cliente com histórico de locações."
    );
  }

  const { error } = await supabase.from("clientes").delete().eq("id", id);
  if (error) throw new Error(error.message);
};

export const importClientsFromCsv = async (
  file: File,
  organizationId: string
) => {
  const parsed = await parseCsv<Record<string, string>>(file);
  const supabase = getSupabaseClient();
  const payload = parsed.rows.map((row) => ({
    organization_id: organizationId,
    tipo: (row.tipo ?? "Pessoa Física") as ClientType,
    nome_completo: row.nome_completo ?? row["Nome Completo"] ?? null,
    razao_social: row.razao_social ?? null,
    nome_fantasia: row.nome_fantasia ?? null,
    documento: row.documento ?? "",
    email: row.email ?? "",
    telefone: row.telefone ?? "",
    endereco: row.endereco ? JSON.parse(row.endereco) : null
  }));

  const { data, error } = await supabase
    .from("clientes")
    .insert(payload)
    .select();

  if (error) throw new Error(error.message);
  return data as Client[];
};

export const fetchClientRentals = async (clientId: string) => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("locacoes")
    .select("*, itens:locacao_itens(*), pagamentos(*)")
    .eq("cliente_id", clientId)
    .order("data_inicio", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
};
