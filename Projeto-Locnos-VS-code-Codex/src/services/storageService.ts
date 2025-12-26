import { getSupabaseClient } from "./supabaseClient";

const makePath = (organizationId: string, filename: string) =>
  `${organizationId}/${crypto.randomUUID?.() ?? Date.now()}-${filename}`;

export const uploadPublicFile = async (
  bucket: string,
  file: File,
  organizationId: string
) => {
  const supabase = getSupabaseClient();
  const path = makePath(organizationId, file.name);
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: true,
    cacheControl: "3600"
  });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};

export const uploadPrivateFile = async (
  bucket: string,
  file: File,
  organizationId: string
) => {
  const supabase = getSupabaseClient();
  const path = makePath(organizationId, file.name);
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: true
  });
  if (error) throw new Error(error.message);
  return path;
};
