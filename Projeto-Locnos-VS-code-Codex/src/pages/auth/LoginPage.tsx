import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../hooks/useAuth";
import { TextField } from "../../components/ui/TextField";

interface LoginForm {
  email: string;
  password: string;
}

export const LoginPage = () => {
  const { register, handleSubmit, formState } = useForm<LoginForm>({
    defaultValues: { email: "", password: "" }
  });
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  const onSubmit = async (values: LoginForm) => {
    try {
      await login(values.email, values.password);
      const redirectTo = (location.state as any)?.from?.pathname ?? "/dashboard";
      navigate(redirectTo, { replace: true });
      toast.success("Bem-vindo de volta!");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Falha na autenticação."
      );
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 py-10">
      <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-500">
            Locnos
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
            Acesse sua locadora
          </h1>
          <p className="text-sm text-slate-500">
            Utilize suas credenciais do Supabase para entrar
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
          <TextField
            label="E-mail"
            type="email"
            {...register("email", { required: "Informe o e-mail" })}
            error={formState.errors.email?.message}
          />
          <TextField
            label="Senha"
            type="password"
            {...register("password", { required: "Informe a senha" })}
            error={formState.errors.password?.message}
          />
          <button
            type="submit"
            className="w-full rounded-xl bg-brand-600 px-4 py-2 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
            disabled={formState.isSubmitting}
          >
            {formState.isSubmitting ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          Ainda não possui conta?{" "}
          <Link to="/register" className="font-semibold text-brand-600">
            Criar locadora
          </Link>
        </p>
      </div>
    </div>
  );
};
