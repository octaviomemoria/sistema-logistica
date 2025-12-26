import type { User } from "@supabase/supabase-js";
import type { Organization, Profile, UserRole } from "../types/domain";
import { getSupabaseClient } from "./supabaseClient";

export interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
  organizationName: string;
}

export interface InviteUserPayload {
  email: string;
  role: UserRole;
  fullName: string;
}

export const login = async (email: string, password: string) => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    throw new Error(error.message);
  }

  return data.user;
};

export const logout = async () => {
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
};

export const registerUser = async ({
  email,
  password,
  fullName,
  organizationName
}: RegisterPayload): Promise<{
  user: User;
  organization: Organization;
  profile: Profile;
}> => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName
      }
    }
  });

  if (error || !data.user) {
    throw new Error(error?.message ?? "Não foi possível criar o usuário.");
  }

  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .insert({ name: organizationName })
    .select()
    .single();

  if (orgError || !org) {
    throw new Error(
      orgError?.message ?? "Não foi possível criar a organização."
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .upsert(
      {
        id: data.user.id,
        organization_id: org.id,
        full_name: fullName,
        role: "admin"
      },
      { onConflict: "id" }
    )
    .select()
    .single();

  if (profileError || !profile) {
    throw new Error(profileError?.message ?? "Erro ao criar o perfil.");
  }

  return { user: data.user, organization: org, profile };
};

export const fetchCurrentProfile = async (): Promise<Profile | null> => {
  const supabase = getSupabaseClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const fetchOrganization = async (
  organizationId: string
): Promise<Organization | null> => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", organizationId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
};

export const updateProfile = async (payload: Partial<Profile>) => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({
      full_name: payload.full_name,
      role: payload.role,
      avatar_url: payload.avatar_url
    })
    .eq("id", payload.id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};

export const listOrganizationUsers = async (organizationId: string) => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("organization_id", organizationId)
    .order("full_name");
  if (error) throw new Error(error.message);
  return data;
};

export const inviteUser = async (payload: InviteUserPayload) => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.functions.invoke("invite-user", {
    body: payload
  });

  if (error) {
    throw new Error(
      error.message ??
        "Falha ao enviar convite. Configure a Function invite-user no Supabase."
    );
  }

  return data;
};

export const deactivateUser = async (userId: string) => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({ active: false })
    .eq("id", userId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};

export const resetPassword = async (email: string) => {
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw new Error(error.message);
};

export const updatePassword = async (password: string) => {
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw new Error(error.message);
};
