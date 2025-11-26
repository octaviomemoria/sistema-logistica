'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Package,
    PackageCheck,
    Route,
    Truck,
    Users,
    BarChart3,
    Settings,
    LogOut,
    Menu,
    X
} from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/lib/store';

const menuItems = [
    { nome: 'Dashboard', href: '/dashboard', icone: LayoutDashboard },
    { nome: 'Pedidos', href: '/pedidos', icone: Package },
    { nome: 'Separação', href: '/separacao', icone: PackageCheck },
    { nome: 'Roteirização', href: '/roteirizacao', icone: Route },
    { nome: 'Entregas', href: '/entregas', icone: Truck },
    { nome: 'Cadastros', href: '/cadastros', icone: Users },
    { nome: 'Relatórios', href: '/relatorios', icone: BarChart3 },
    { nome: 'Configurações', href: '/configuracoes', icone: Settings },
];

export default function Sidebar() {
    const pathname = usePathname();
    const [aberto, setAberto] = useState(true);
    const { usuario, logout } = useAuthStore();

    return (
        <>
            {/* Botão mobile */}
            <button
                onClick={() => setAberto(!aberto)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-lg"
            >
                {aberto ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Overlay mobile */}
            {aberto && (
                <div
                    className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
                    onClick={() => setAberto(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
          fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-40
          transition-transform duration-300 ease-in-out
          ${aberto ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 w-64
        `}
            >
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="px-6 py-5 border-b border-gray-200">
                        <h1 className="text-xl font-bold text-primary">
                            Logística <span className="text-gray-600">Inteligente</span>
                        </h1>
                        {usuario && (
                            <p className="text-sm text-gray-500 mt-1">{usuario.nome}</p>
                        )}
                    </div>

                    {/* Menu */}
                    <nav className="flex-1 px-3 py-4 overflow-y-auto">
                        {menuItems.map((item) => {
                            const Icone = item.icone;
                            const ativo = pathname === item.href || pathname?.startsWith(item.href + '/');

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setAberto(false)}
                                    className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1
                    transition-colors duration-150
                    ${ativo
                                            ? 'bg-primary text-white'
                                            : 'text-gray-700 hover:bg-gray-100'
                                        }
                  `}
                                >
                                    <Icone size={20} />
                                    <span className="font-medium">{item.nome}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Footer */}
                    <div className="px-3 py-4 border-t border-gray-200">
                        <button
                            onClick={() => {
                                logout();
                                window.location.href = '/login';
                            }}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                            <LogOut size={20} />
                            <span className="font-medium">Sair</span>
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}
