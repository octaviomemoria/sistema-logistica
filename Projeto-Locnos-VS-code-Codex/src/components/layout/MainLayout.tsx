import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export const MainLayout = () => (
  <div className="flex h-screen bg-slate-50 dark:bg-slate-950">
    <Sidebar />
    <div className="flex flex-1 flex-col overflow-hidden">
      <Header />
      <main className="flex-1 overflow-y-auto px-8 py-6">
        <Outlet />
      </main>
    </div>
  </div>
);
