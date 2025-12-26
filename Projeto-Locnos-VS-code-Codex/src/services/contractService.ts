import type { ContractTemplate, Rental } from "../types/domain";
import { getSupabaseClient } from "./supabaseClient";

const PLACEHOLDERS = [
  "NOME_CLIENTE",
  "DOCUMENTO_CLIENTE",
  "DATA_INICIO",
  "DATA_FIM",
  "VALOR_TOTAL",
  "LISTA_EQUIPAMENTOS"
];

export const fetchContractTemplates = async (organizationId: string) => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("modelos_contrato")
    .select("*")
    .eq("organization_id", organizationId)
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data as ContractTemplate[];
};

export const saveContractTemplate = async (
  payload: Partial<ContractTemplate> & { organization_id: string }
) => {
  const supabase = getSupabaseClient();
  const mutation = payload.id ? "update" : "insert";
  let query = supabase.from("modelos_contrato")[mutation](payload);
  if (payload.id) query = query.eq("id", payload.id);
  const { data, error } = await query.select().single();
  if (error) throw new Error(error.message);
  return data as ContractTemplate;
};

export const deleteContractTemplate = async (id: string) => {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("modelos_contrato")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
};

export const generateContractPreview = (
  template: ContractTemplate,
  rental: Rental
) => {
  const equipmentList = (rental.itens ?? [])
    .map(
      (item) =>
        `${item.quantidade}x ${item.equipamento?.nome ?? ""} - ${item.valor_total.toLocaleString(
          "pt-BR",
          { style: "currency", currency: "BRL" }
        )}`
    )
    .join("<br />");

  const replacements: Record<string, string> = {
    NOME_CLIENTE:
      rental.cliente?.nome_completo ??
      rental.cliente?.razao_social ??
      "Cliente",
    DOCUMENTO_CLIENTE: rental.cliente?.documento ?? "-",
    DATA_INICIO: rental.data_inicio,
    DATA_FIM: rental.data_fim,
    VALOR_TOTAL: rental.valor_total.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    }),
    LISTA_EQUIPAMENTOS: equipmentList
  };

  return PLACEHOLDERS.reduce(
    (acc, placeholder) =>
      acc.replaceAll(`[${placeholder}]`, replacements[placeholder] ?? "-"),
    template.conteudo
  );
};
