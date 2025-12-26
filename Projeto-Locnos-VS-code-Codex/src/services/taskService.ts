import type { Task, TaskStatus } from "../types/domain";
import { getSupabaseClient } from "./supabaseClient";

export const fetchTasks = async (
  organizationId: string,
  status?: TaskStatus | "Todos"
) => {
  const supabase = getSupabaseClient();
  let query = supabase
    .from("tarefas")
    .select("*, responsavel:profiles(full_name)")
    .eq("organization_id", organizationId)
    .order("data_vencimento", { ascending: true });

  if (status && status !== "Todos") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data as Task[];
};

export const saveTask = async (
  payload: Partial<Task> & { organization_id: string }
) => {
  const supabase = getSupabaseClient();
  const mutation = payload.id ? "update" : "insert";
  let query = supabase.from("tarefas")[mutation](payload);
  if (payload.id) {
    query = query.eq("id", payload.id);
  }
  const { data, error } = await query.select().single();
  if (error) throw new Error(error.message);
  return data as Task;
};

export const deleteTask = async (taskId: string) => {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("tarefas").delete().eq("id", taskId);
  if (error) throw new Error(error.message);
};
