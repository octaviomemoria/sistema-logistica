import { NavLink } from "react-router-dom";
import { Home, Boxes, Users, CalendarClock, Wallet, PieChart, AlertTriangle, ClipboardList, Truck, FileText, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { ROUTE_PERMISSIONS } from "../../utils/constants";
import { useAuth } from "../../hooks/useAuth";

const STORAGE_KEY = "locnos:logo";

const navItems = [
  { label: "Dashboard", path: "/dashboard", icon: Home },
  { label: "Equipamentos", path: "/equipamentos", icon: Boxes },
  { label: "Clientes", path: "/clientes", icon: Users },
  { label: "Locações", path: "/locacoes", icon: CalendarClock },
  { label: "Financeiro", path: "/financeiro", icon: Wallet },
  { label: "Relatórios", path: "/relatorios", icon: PieChart },
  { label: "Ocorrências", path: "/ocorrencias", icon: AlertTriangle },
  { label: "Tarefas", path: "/tarefas", icon: ClipboardList },
  { label: "Motoristas", path: "/motoristas", icon: Truck },
  { label: "Contratos", path: "/contratos", icon: FileText },
  { label: "Conta & Usuários", path: "/conta", icon: Settings }
];

export const Sidebar = () => {
  const { profile } = useAuth();
  const [logo, setLogo] = useState<string | null>(() =>
    localStorage.getItem(STORAGE_KEY)
  );

  useEffect(() => {
    if (!logo) {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [logo]);

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result?.toString() ?? null;
      if (base64) {
        localStorage.setItem(STORAGE_KEY, base64);
        setLogo(base64);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <aside className="flex h-full w-72 flex-col border-r border-slate-100 bg-white/80 px-6 py-8 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
      <div className="flex flex-col items-center text-center">
        {logo ? (
          <img
            src={logo}
            alt="Logo"
            className="h-16 w-16 rounded-2xl object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-2xl font-bold text-brand-600">
            L
          </div>
        )}
        <p className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
          {profile?.full_name ?? "Locnos"}
        </p>
        <p className="text-sm text-slate-500">{profile?.role}</p>
        <label className="mt-4 cursor-pointer text-xs font-medium text-brand-600">
          Alterar logomarca
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleLogoUpload}
          />
        </label>
      </div>

      <nav className="mt-8 flex flex-1 flex-col gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const roles = ROUTE_PERMISSIONS[item.path];
          if (roles && profile && !roles.includes(profile.role)) {
            return null;
          }
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-brand-50 text-brand-600"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800"
                }`
              }
            >
              <Icon size={18} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};
