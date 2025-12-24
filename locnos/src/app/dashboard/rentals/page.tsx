'use client'

import Link from 'next/link'
import { Plus } from 'lucide-react'
import RentalList from '@/components/rentals/RentalList'

export default function RentalsListPage() {
    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                    Minhas Locações
                </h1>
                <Link href="/dashboard/rentals/new" className="btn-primary flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all">
                    <Plus size={18} /> Nova Locação
                </Link>
            </div>

            <RentalList />
        </div>
    )
}
