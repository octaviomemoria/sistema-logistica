'use client'

import { useState } from 'react'
import { createVehicle } from '@/app/dashboard/vehicles/actions'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'

export default function VehicleForm() {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { showToast } = useToast()

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSubmitting(true)

        const formData = new FormData(e.currentTarget)

        try {
            await createVehicle(formData)
            // Redirect happens in the action
        } catch (error) {
            console.error('Error creating vehicle:', error)
            showToast('error', 'Falha ao criar veículo')
            setIsSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow space-y-4">
            <div>
                <label htmlFor="plate" className="block text-sm font-medium text-gray-700 mb-1">
                    Placa do Veículo *
                </label>
                <input
                    type="text"
                    id="plate"
                    name="plate"
                    required
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="ABC-1234"
                />
            </div>

            <div>
                <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-1">
                    Modelo do Veículo *
                </label>
                <input
                    type="text"
                    id="model"
                    name="model"
                    required
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ford Transit"
                />
            </div>

            <div>
                <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 mb-1">
                    Capacidade (kg) *
                </label>
                <input
                    type="number"
                    id="capacity"
                    name="capacity"
                    required
                    min="1"
                    step="0.1"
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="1500"
                />
            </div>

            <div>
                <label htmlFor="driverName" className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Motorista (Opcional)
                </label>
                <input
                    type="text"
                    id="driverName"
                    name="driverName"
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="João Silva"
                />
            </div>

            <div className="flex gap-3 pt-4">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`flex-1 py-2 px-4 rounded text-white font-medium ${isSubmitting
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                >
                    {isSubmitting ? 'Adicionando...' : 'Adicionar Veículo'}
                </button>
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                >
                    Cancelar
                </button>
            </div>
        </form>
    )
}
