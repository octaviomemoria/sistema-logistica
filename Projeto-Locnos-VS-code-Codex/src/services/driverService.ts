import type { Driver } from "../types/domain";
import { getSupabaseClient } from "./supabaseClient";

export const fetchDrivers = async (organizationId: string) => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("motoristas")
    .select("*")
    .eq("organization_id", organizationId)
    .order("nome");
  if (error) throw new Error(error.message);
  return data as Driver[];
};

export const saveDriver = async (
  payload: Partial<Driver> & { organization_id: string }
) => {
  const supabase = getSupabaseClient();
  const mutation = payload.id ? "update" : "insert";
  let query = supabase.from("motoristas")[mutation](payload);
  if (payload.id) query = query.eq("id", payload.id);
  const { data, error } = await query.select().single();
  if (error) throw new Error(error.message);
  return data as Driver;
};

export const deleteDriver = async (id: string) => {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("motoristas").delete().eq("id", id);
  if (error) throw new Error(error.message);
};
