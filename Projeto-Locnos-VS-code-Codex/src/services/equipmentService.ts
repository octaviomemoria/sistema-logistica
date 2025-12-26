import type {
  Equipment,
  EquipmentFilters,
  EquipmentStatus
} from "../types/domain";
import { getSupabaseClient } from "./supabaseClient";
import { parseCsv } from "../utils/csv";

export interface UpsertEquipmentPayload
  extends Partial<Omit<Equipment, "id">> {
  id?: string;
  organization_id: string;
}

export const fetchEquipment = async (
  organizationId: string,
  filters: EquipmentFilters
) => {
  const supabase = getSupabaseClient();
  let query = supabase
    .from("equipamentos")
    .select("*")
    .eq("organization_id", organizationId);

  if (filters.search) {
    query = query.ilike("nome", `%${filters.search}%`);
  }

  if (filters.status && filters.status !== "Todos") {
    query = query.eq("status", filters.status as EquipmentStatus);
  }

  if (filters.categoria) {
    query = query.ilike("categoria", `%${filters.categoria}%`);
  }

  if (filters.orderBy) {
    query = query.order(filters.orderBy, {
      ascending: filters.order === "asc"
    });
  } else {
    query = query.order("criado_em", { ascending: false });
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data as Equipment[];
};

export const saveEquipment = async (payload: UpsertEquipmentPayload) => {
  const supabase = getSupabaseClient();
  const mutation = payload.id ? "update" : "insert";
  const query = supabase.from("equipamentos")[mutation]({
    ...payload,
    periodos_locacao: payload.periodos_locacao ?? []
  });

  const finalQuery = payload.id
    ? query.eq("id", payload.id).select().single()
    : query.select().single();

  const { data, error } = await finalQuery;
  if (error) throw new Error(error.message);
  return data as Equipment;
};

export const deleteEquipment = async (id: string) => {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("equipamentos").delete().eq("id", id);
  if (error) throw new Error(error.message);
};

export const deleteEquipmentBatch = async (ids: string[]) => {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("equipamentos")
    .delete()
    .in("id", ids);
  if (error) throw new Error(error.message);
};

export const hasRentalHistory = async (equipmentId: string) => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("locacao_itens")
    .select("id", { count: "exact", head: true })
    .eq("equipamento_id", equipmentId);
  if (error) throw new Error(error.message);
  return (data?.length ?? 0) > 0;
};

export const importEquipmentsFromCsv = async (
  file: File,
  organizationId: string
) => {
  const parsed = await parseCsv<Record<string, string | number>>(file);
  const supabase = getSupabaseClient();
  const payload = parsed.rows.map((row) => ({
    organization_id: organizationId,
    nome: String(row.nome ?? row.Nome ?? ""),
    categoria: row.categoria ?? row.Categoria ?? null,
    sub_categoria: row.sub_categoria ?? row["Sub Categoria"] ?? null,
    marca: row.marca ?? row.Marca ?? null,
    valor_compra: row.valor_compra ?? row["Valor Compra"] ?? null,
    quantidade_total: Number(row.quantidade_total ?? 1),
    quantidade_alugada: 0,
    status: (row.status ?? "Disponível") as EquipmentStatus,
    descricao: row.descricao ?? null
  }));

  const { data, error } = await supabase
    .from("equipamentos")
    .insert(payload)
    .select();

  if (error) throw new Error(error.message);
  return data;
};
