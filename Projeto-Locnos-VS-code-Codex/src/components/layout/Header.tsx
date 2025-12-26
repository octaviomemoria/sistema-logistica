import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, UserCircle } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { ThemeToggle } from "./ThemeToggle";

const TITLES: Record<string, string> = {
  "/dashboard": "Visão Geral",
  "/equipamentos": "Gestão de Equipamentos",
  "/clientes": "Gestão de Clientes",
  "/locacoes": "Gestão de Locações",
  "/financeiro": "Dashboard Financeiro",
  "/relatorios": "Relatórios e IA",
  "/ocorrencias": "Ocorrências",
  "/tarefas": "Tarefas Internas",
  "/motoristas": "Motoristas",
  "/contratos": "Modelos de Contrato",
  "/conta": "Conta & Usuários"
};

export const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const title = TITLES[location.pathname] ?? "Locnos";

  return (
    <header className="flex flex-col gap-4 border-b border-slate-100 bg-white/70 px-8 py-5 backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="rounded-full border border-slate-200 p-2 text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">
              Locnos
            </p>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
              {title}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button className="rounded-full border border-slate-200 p-2 text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">
            <Bell size={18} />
          </button>
          <div className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 dark:border-slate-700">
            <UserCircle size={32} className="text-brand-500" />
            <div className="text-sm">
              <p className="font-semibold text-slate-900 dark:text-white">
                {profile?.full_name ?? "Usuário"}
              </p>
              <p className="text-slate-500">{profile?.role}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
