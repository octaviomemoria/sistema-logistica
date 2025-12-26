import React, { useState, useEffect, useRef } from 'react';
import { View } from '../types';
import { ChartBarIcon, CogIcon, CurrencyDollarIcon, DocumentTextIcon, HomeIcon, TruckIcon, UploadIcon, UsersIcon, ClipboardListIcon, ExclamationTriangleIcon, CheckBadgeIcon, DocumentDuplicateIcon } from './Icons';

interface SidebarProps {
  currentView: View;
  setView: (view: View) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, isOpen = false, onClose }) => {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedLogo = localStorage.getItem('companyLogo');
    if (savedLogo) {
      setLogoUrl(savedLogo);
    }
  }, []);

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setLogoUrl(base64String);
        localStorage.setItem('companyLogo', base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <HomeIcon /> },
    { id: 'equipments', label: 'Equipamentos', icon: <TruckIcon /> },
    { id: 'rentals', label: 'Locações', icon: <DocumentTextIcon /> },
    { id: 'contracts', label: 'Contratos', icon: <DocumentDuplicateIcon /> },
    { id: 'operations', label: 'Operações', icon: <ClipboardListIcon /> },
    { id: 'clients', label: 'Clientes', icon: <UsersIcon /> },
    { id: 'incidents', label: 'Ocorrências', icon: <ExclamationTriangleIcon /> },
    { id: 'tasks', label: 'Tarefas', icon: <CheckBadgeIcon /> },
    { id: 'financial', label: 'Financeiro', icon: <CurrencyDollarIcon /> },
    { id: 'reports', label: 'Relatórios', icon: <ChartBarIcon /> },
  ];

  const NavLink: React.FC<{ item: typeof navItems[0] }> = ({ item }) => {
    const isActive = currentView === item.id;
    return (
      <li className="px-3">
        <button
          onClick={() => setView(item.id as View)}
          className={`flex items-center w-full p-3 my-1 rounded-lg transition-colors duration-200 ${isActive
              ? 'bg-primary text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800'
            }`}
        >
          <span className="w-6 h-6">{item.icon}</span>
          <span className="ml-4 font-medium">{item.label}</span>
        </button>
      </li>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="h-28 flex flex-col items-center justify-center border-b p-4 space-y-3">
          {logoUrl ? (
            <img src={logoUrl} alt="Logomarca da Empresa" className="max-h-12 object-contain" />
          ) : (
            <h1 className="text-2xl font-bold text-primary">Locnos</h1>
          )}
          <button
            onClick={triggerFileInput}
            className="flex items-center text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-md hover:bg-gray-200 transition-colors"
            aria-label="Carregar logomarca da empresa"
          >
            <UploadIcon className="w-3 h-3 mr-1.5" />
            Carregar Logomarca
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleLogoUpload}
            className="hidden"
            accept="image/png, image/jpeg, image/svg+xml"
          />
        </div>
        <nav className="flex-1 mt-6 overflow-y-auto">
          <ul>
            {navItems.map((item) => (
              <NavLink key={item.id} item={item} />
            ))}
          </ul>
        </nav>
        <div className="p-4 border-t">
          <button
            onClick={() => setView('account')}
            className={`flex items-center w-full p-3 my-1 rounded-lg transition-colors duration-200 ${currentView === 'account'
                ? 'bg-primary text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800'
              }`}
          >
            <span className="w-6 h-6"><CogIcon /></span>
            <span className="ml-4 font-medium">Conta & Usuários</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;