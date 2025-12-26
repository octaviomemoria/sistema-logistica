
import React from 'react';
import { View, Profile } from '../types';
import { BellIcon, SearchIcon, ArrowLeftIcon } from './Icons';

interface HeaderProps {
  view: View;
  onBack: () => void;
  historyLength: number;
  profile: Profile | null;
  onToggleSidebar?: () => void;
}

const Header: React.FC<HeaderProps> = ({ view, onBack, historyLength, profile, onToggleSidebar }) => {
  const getTitle = (view: View) => {
    const titles: { [key in View]: string } = {
      dashboard: 'Dashboard',
      equipments: 'Gerenciamento de Equipamentos',
      rentals: 'Controle de Locações',
      operations: 'Fluxo de Operações (Quote-to-Cash)',
      clients: 'Cadastro de Clientes',
      incidents: 'Gestão de Ocorrências',
      tasks: 'Lista de Tarefas',
      financial: 'Gestão Financeira',
      reports: 'Relatórios e Análises',
      contracts: 'Gestão de Contratos',
      account: 'Conta & Usuários',
    };
    return titles[view];
  };

  const getRoleDisplayName = (role: string) => {
    if (role === 'Admin') return 'Administrador';
    return role;
  }

  const avatarSrc = profile?.avatar_url || `https://i.pravatar.cc/150?u=${profile?.id}`;

  return (
    <header className="flex items-center justify-between p-4 bg-white border-b shadow-sm">
      <div className="flex items-center gap-4">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 text-gray-500 rounded hover:bg-gray-100"
          >
            {/* We need to import MenuIcon at the top, or just inline it if problematic, but trying to use imported */}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
        )}
        {historyLength > 1 && (
          <button
            onClick={onBack}
            className="p-2 text-gray-500 rounded-full hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            aria-label="Voltar para a tela anterior"
          >
            <ArrowLeftIcon className="w-6 h-6" />
          </button>
        )}
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">{getTitle(view)}</h2>
      </div>
      <div className="flex items-center space-x-4">
        <div className="relative hidden md:block">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <SearchIcon />
          </span>
          <input
            type="text"
            placeholder="Pesquisar..."
            className="w-full pl-10 pr-4 py-2 border rounded-full bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <button className="relative p-2 text-gray-500 rounded-full hover:bg-gray-100 hover:text-gray-600 focus:outline-none">
          <BellIcon />
          <span className="absolute top-0 right-0 h-3 w-3 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        <div className="flex items-center space-x-3">
          <img
            src={avatarSrc}
            alt="User Avatar"
            className="w-10 h-10 rounded-full object-cover border border-gray-200"
          />
          <div className="hidden sm:block">
            <div className="font-semibold text-gray-700">{profile?.full_name || 'Usuário'}</div>
            <div className="text-sm text-gray-500 capitalize">{profile ? getRoleDisplayName(profile.role) : 'Cargo'}</div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
