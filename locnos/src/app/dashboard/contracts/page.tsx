'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FileText, Plus, List } from 'lucide-react'
import RentalList from '@/components/rentals/RentalList'

export default function ContractsDashboard() {
    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-8">Contratos & Locações</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {/* Module 1: Templates */}
                <Link href="/dashboard/contracts/templates" className="card p-6 hover:border-blue-500 transition-colors group">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <FileText size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">Modelos de Contrato</h3>
                            <p className="text-sm text-gray-500">Crie e edite seus modelos</p>
                        </div>
                    </div>
                </Link>

                {/* Module 2: New Rental */}
                <Link href="/dashboard/rentals/new" className="card p-6 hover:border-green-500 transition-colors group">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors">
                            <Plus size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">Nova Locação</h3>
                            <p className="text-sm text-gray-500">Inicie um novo aluguel</p>
                        </div>
                    </div>
                </Link>

                {/* Module 3: List Rentals Link (Optional, but kept for explicit route) */}
                <Link href="/dashboard/rentals" className="card p-6 hover:border-purple-500 transition-colors group">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                            <List size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">Minhas Locações</h3>
                            <p className="text-sm text-gray-500">Gerencie contratos ativos</p>
                        </div>
                    </div>
                </Link>
            </div>

            {/* List Section */}
            <div className="mt-8">
                <RentalList />
            </div>
        </div>
    )
}
