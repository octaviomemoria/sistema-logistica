import type { Occurrence, OccurrenceStatus } from "../types/domain";
import { getSupabaseClient } from "./supabaseClient";

export const fetchOccurrences = async (
  organizationId: string,
  status?: OccurrenceStatus | "Todos"
) => {
  const supabase = getSupabaseClient();
  let query = supabase
    .from("ocorrencias")
    .select(
      "*, locacao:locacoes(status, cliente:clientes(nome_completo, razao_social))"
    )
    .eq("organization_id", organizationId)
    .order("data_relato", { ascending: false });

  if (status && status !== "Todos") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data as Occurrence[];
};

export const saveOccurrence = async (
  payload: Partial<Occurrence> & { organization_id: string }
) => {
  const supabase = getSupabaseClient();
  const mutation = payload.id ? "update" : "insert";
  let query = supabase.from("ocorrencias")[mutation](payload);
  if (payload.id) query = query.eq("id", payload.id);
  const { data, error } = await query.select().single();
  if (error) throw new Error(error.message);
  return data as Occurrence;
};
