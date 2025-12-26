import { getSupabaseClient } from "./supabaseClient";

export const runSupabase = async <T>(
  callback: (client: ReturnType<typeof getSupabaseClient>) => Promise<T>
): Promise<T> => {
  const client = getSupabaseClient();
  return callback(client);
};
