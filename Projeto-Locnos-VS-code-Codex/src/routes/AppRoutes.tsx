import { Navigate, Route, Routes } from "react-router-dom";
import { MainLayout } from "../components/layout/MainLayout";
import { ProtectedRoute } from "./ProtectedRoute";
import { LoginPage } from "../pages/auth/LoginPage";
import { RegisterPage } from "../pages/auth/RegisterPage";
import { DashboardPage } from "../pages/dashboard/DashboardPage";
import { EquipmentPage } from "../pages/equipment/EquipmentPage";
import { ClientsPage } from "../pages/clients/ClientsPage";
import { RentalsPage } from "../pages/rentals/RentalsPage";
import { FinancialDashboard } from "../pages/financial/FinancialDashboard";
import { ReportsPage } from "../pages/reports/ReportsPage";
import { OccurrencesPage } from "../pages/occurrences/OccurrencesPage";
import { TasksPage } from "../pages/tasks/TasksPage";
import { DriversPage } from "../pages/drivers/DriversPage";
import { ContractsPage } from "../pages/contracts/ContractsPage";
import { AccountPage } from "../pages/account/AccountPage";
import { useAuth } from "../hooks/useAuth";

export const AppRoutes = () => {
  const { configError } = useAuth();

  if (configError) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">
          Configuração pendente
        </h1>
        <p className="mt-2 max-w-xl text-slate-600">{configError}</p>
        <p className="mt-4 text-sm text-slate-500">
          Crie um arquivo <code>.env</code> com as variáveis necessárias antes de
          utilizar o Locnos.
        </p>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/equipamentos" element={<EquipmentPage />} />
          <Route path="/clientes" element={<ClientsPage />} />
          <Route path="/locacoes" element={<RentalsPage />} />
          <Route path="/financeiro" element={<FinancialDashboard />} />
          <Route path="/relatorios" element={<ReportsPage />} />
          <Route path="/ocorrencias" element={<OccurrencesPage />} />
          <Route path="/tarefas" element={<TasksPage />} />
          <Route path="/motoristas" element={<DriversPage />} />
          <Route path="/contratos" element={<ContractsPage />} />
          <Route path="/conta" element={<AccountPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
