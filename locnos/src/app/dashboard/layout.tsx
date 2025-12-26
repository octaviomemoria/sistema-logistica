'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Package, FileText, Settings, LogOut, Wrench, BarChart3, Truck, Home, Archive, X, User, Menu, Bell, ListTodo, DollarSign } from 'lucide-react'
import { useState } from 'react'
import { signOut } from 'next-auth/react'
import Header from '@/components/layout/Header'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const [sidebarOpen, setSidebarOpen] = useState(false)

    const navItems = [
        { href: '/dashboard', label: 'Dashboard', icon: Home },
        { href: '/dashboard/tasks', label: 'Tarefas', icon: ListTodo },
        { href: '/dashboard/routes', label: 'Rotas', icon: Truck },
        { href: '/dashboard/contracts', label: 'Contratos / Locações', icon: FileText },
        { href: '/dashboard/inventory', label: 'Inventário', icon: Archive },
        { href: '/dashboard/maintenance', label: 'Manutenção', icon: Wrench },
        { href: '/dashboard/financial', label: 'Financeiro', icon: DollarSign },
        { href: '/dashboard/persons', label: 'Pessoas', icon: Users },
        { href: '/dashboard/reports', label: 'Relatórios', icon: BarChart3 },
        { section: 'Configurações' },
        { href: '/dashboard/settings/users', label: 'Usuários', icon: User },
        { href: '/dashboard/settings/roles', label: 'Perfis de Acesso', icon: Settings },
    ]

    const isActive = (href: string) => pathname === href

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar - Clean Dark Blue */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                {/* ... Sidebar Content ... */}
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
                        <Link href="/dashboard" className="flex items-center gap-3" onClick={() => setSidebarOpen(false)}>
                            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-lg">L</span>
                            </div>
                            <span className="text-white font-bold text-xl">Locnos</span>
                        </Link>
                        <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                        {navItems.map((item, index) => {
                            // Section header
                            if ('section' in item) {
                                return (
                                    <div key={`section-${index}`} className="pt-4 pb-2 px-4">
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            {item.section}
                                        </p>
                                    </div>
                                )
                            }

                            // Regular nav item
                            const Icon = item.icon
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium ${isActive(item.href)
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-300 hover:bg-slate-800 hover:text-white'
                                        }`}
                                >
                                    <Icon size={20} strokeWidth={2} />
                                    <span>{item.label}</span>
                                </Link>
                            )
                        })}
                    </nav>

                    {/* User Info & Logout */}
                    <div className="px-4 py-4 border-t border-slate-800">
                        <div className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer group">
                            <div className="w-9 h-9 bg-slate-700 rounded-full flex items-center justify-center flex-shrink-0">
                                <User size={18} className="text-gray-300" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-white text-sm font-medium truncate">Octavio de Costa</p>
                                <p className="text-gray-400 text-xs truncate">Administrador</p>
                            </div>
                            <button
                                onClick={() => signOut({ callbackUrl: '/login' })}
                                className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-white transition-opacity"
                                title="Sair"
                            >
                                <LogOut size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col lg:ml-64">
                <Header onMenuClick={() => setSidebarOpen(true)} />

                {/* Page Content */}
                <main className="flex-1 overflow-auto">
                    {children}
                </main>
            </div>

            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </div>
    )
}
