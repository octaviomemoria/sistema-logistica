import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../hooks/useAuth";
import { TextField } from "../../components/ui/TextField";

interface RegisterForm {
  fullName: string;
  email: string;
  password: string;
  organizationName: string;
}

export const RegisterPage = () => {
  const { user, register: registerAccount } = useAuth();
  const { register, handleSubmit, formState } = useForm<RegisterForm>({
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      organizationName: ""
    }
  });
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  const onSubmit = async (values: RegisterForm) => {
    try {
      await registerAccount({
        email: values.email,
        password: values.password,
        fullName: values.fullName,
        organizationName: values.organizationName
      });
      toast.success("Conta criada com sucesso! Verifique seu e-mail.");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível concluir o cadastro."
      );
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 py-10">
      <div className="w-full max-w-2xl rounded-3xl border border-slate-100 bg-white p-10 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
          Crie a sua instância Locnos
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Cada cadastro gera automaticamente uma organização isolada com RLS no
          Supabase.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 grid gap-4 md:grid-cols-2">
          <TextField
            label="Nome completo"
            {...register("fullName", { required: "Informe o seu nome" })}
            error={formState.errors.fullName?.message}
          />
          <TextField
            label="Nome da locadora"
            {...register("organizationName", {
              required: "Informe o nome da locadora"
            })}
            error={formState.errors.organizationName?.message}
          />
          <TextField
            label="E-mail corporativo"
            type="email"
            {...register("email", { required: "Informe o e-mail" })}
            error={formState.errors.email?.message}
          />
          <TextField
            label="Senha"
            type="password"
            {...register("password", {
              required: "Informe uma senha",
              minLength: { value: 8, message: "Min. 8 caracteres" }
            })}
            error={formState.errors.password?.message}
          />
          <div className="md:col-span-2">
            <button
              type="submit"
              className="w-full rounded-xl bg-brand-600 px-4 py-3 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
              disabled={formState.isSubmitting}
            >
              {formState.isSubmitting ? "Criando..." : "Criar conta"}
            </button>
          </div>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          Já possui uma conta?{" "}
          <Link to="/login" className="font-semibold text-brand-600">
            Fazer login
          </Link>
        </p>
      </div>
    </div>
  );
};
