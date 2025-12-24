'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Home, Package, Truck, Map, Route } from 'lucide-react'

export default function MobileNav() {
    const [isOpen, setIsOpen] = useState(false)
    const pathname = usePathname()

    const links = [
        { href: '/dashboard', label: 'Início', icon: Home },
        { href: '/dashboard/orders', label: 'Pedidos', icon: Package },
        { href: '/dashboard/vehicles', label: 'Veículos', icon: Truck },
        { href: '/dashboard/routes', label: 'Rotas', icon: Route },
        { href: '/dashboard/routing', label: 'Roteirização', icon: Map },
    ]

    const isActive = (href: string) => pathname === href

    return (
        <>
            {/* Hamburger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="md:hidden p-2 rounded hover:bg-gray-100"
                aria-label="Menu"
            >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div
                className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out md:hidden ${isOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold text-blue-600">Locnos</h2>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 rounded hover:bg-gray-100"
                    >
                        <X size={20} />
                    </button>
                </div>

                <nav className="p-4">
                    <ul className="space-y-2">
                        {links.map((link) => {
                            const Icon = link.icon
                            return (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        onClick={() => setIsOpen(false)}
                                        className={`flex items-center gap-3 px-4 py-3 rounded transition-colors ${isActive(link.href)
                                                ? 'bg-blue-50 text-blue-600 font-semibold'
                                                : 'text-gray-700 hover:bg-gray-100'
                                            }`}
                                    >
                                        <Icon size={20} />
                                        {link.label}
                                    </Link>
                                </li>
                            )
                        })}
                    </ul>
                </nav>
            </div>
        </>
    )
}
