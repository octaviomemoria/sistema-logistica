'use client'

import EquipmentForm from '@/components/inventory/EquipmentForm'

export default function NewEquipmentPage() {
    return (
        <div className="p-6 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Novo Equipamento</h1>
            <p className="text-gray-600 mb-8">Cadastre um novo item no inventário.</p>
            <EquipmentForm />
        </div>
    )
}
