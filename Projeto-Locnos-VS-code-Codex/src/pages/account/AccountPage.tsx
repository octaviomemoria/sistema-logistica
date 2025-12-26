import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useAuth } from "../../hooks/useAuth";
import {
  deactivateUser,
  inviteUser,
  listOrganizationUsers,
  updatePassword,
  updateProfile
} from "../../services/authService";
import { SectionCard } from "../../components/ui/SectionCard";
import { TextField } from "../../components/ui/TextField";
import { SelectField } from "../../components/ui/SelectField";

export const AccountPage = () => {
  const { profile, organization, refreshProfile } = useAuth();
  const organizationId = profile?.organization_id ?? "";
  const queryClient = useQueryClient();

  const profileForm = useForm({
    defaultValues: {
      full_name: profile?.full_name ?? ""
    }
  });

  useEffect(() => {
    profileForm.reset({ full_name: profile?.full_name ?? "" });
  }, [profile?.full_name, profileForm]);

  const passwordForm = useForm({
    defaultValues: { password: "", confirmation: "" }
  });

  const inviteForm = useForm({
    defaultValues: { email: "", fullName: "", role: "atendente" }
  });

  const usersQuery = useQuery({
    queryKey: ["organization-users", organizationId],
    queryFn: () => listOrganizationUsers(organizationId),
    enabled: Boolean(organizationId)
  });

  const profileMutation = useMutation({
    mutationFn: (values: any) =>
      updateProfile({ ...profile, full_name: values.full_name }),
    onSuccess: () => {
      toast.success("Perfil atualizado.");
      refreshProfile();
    }
  });

  const inviteMutation = useMutation({
    mutationFn: inviteUser,
    onSuccess: () => {
      toast.success("Convite enviado (ver console do Supabase).");
      queryClient.invalidateQueries({ queryKey: ["organization-users"] });
      inviteForm.reset();
    }
  });

  const deactivateMutation = useMutation({
    mutationFn: deactivateUser,
    onSuccess: () => {
      toast.success("Usuário desativado.");
      queryClient.invalidateQueries({ queryKey: ["organization-users"] });
    }
  });

  const passwordMutation = useMutation({
    mutationFn: (payload: { password: string }) => updatePassword(payload.password),
    onSuccess: () => {
      toast.success("Senha atualizada.");
      passwordForm.reset();
    }
  });

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <SectionCard title="Minha conta">
        <form
          className="space-y-4"
          onSubmit={profileForm.handleSubmit((values) => profileMutation.mutate(values))}
        >
          <TextField
            label="Nome completo"
            {...profileForm.register("full_name", { required: true })}
          />
          <TextField label="Organização" value={organization?.name ?? ""} disabled />
          <button
            type="submit"
            className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Atualizar perfil
          </button>
        </form>
      </SectionCard>

      <SectionCard title="Alterar senha">
        <form
          className="space-y-4"
          onSubmit={passwordForm.handleSubmit((values) => {
            if (values.password !== values.confirmation) {
              toast.error("As senhas não coincidem.");
              return;
            }
            passwordMutation.mutate({ password: values.password });
          })}
        >
          <TextField
            label="Nova senha"
            type="password"
            {...passwordForm.register("password", { required: true })}
          />
          <TextField
            label="Confirme a senha"
            type="password"
            {...passwordForm.register("confirmation", { required: true })}
          />
          <button
            type="submit"
            className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Atualizar senha
          </button>
        </form>
      </SectionCard>

      <SectionCard title="Usuários da organização">
        <div className="space-y-3">
          {(usersQuery.data ?? []).map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between rounded-2xl border border-slate-100 p-4"
            >
              <div>
                <p className="font-semibold text-slate-900">{user.full_name}</p>
                <p className="text-sm text-slate-500">{user.role}</p>
              </div>
              <button
                className="text-xs font-semibold text-rose-500"
                onClick={() => deactivateMutation.mutate(user.id)}
              >
                Desativar
              </button>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Convidar novo usuário">
        <form
          className="space-y-4"
          onSubmit={inviteForm.handleSubmit((values) =>
            inviteMutation.mutate({
              email: values.email,
              fullName: values.fullName,
              role: values.role as any
            })
          )}
        >
          <TextField label="E-mail" {...inviteForm.register("email", { required: true })} />
          <TextField
            label="Nome completo"
            {...inviteForm.register("fullName", { required: true })}
          />
          <SelectField label="Função" {...inviteForm.register("role")}>
            <option value="admin">Admin</option>
            <option value="gerente">Gerente</option>
            <option value="atendente">Atendente</option>
            <option value="tecnico">Técnico</option>
          </SelectField>
          <button
            type="submit"
            className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Enviar convite
          </button>
        </form>
      </SectionCard>
    </div>
  );
};
