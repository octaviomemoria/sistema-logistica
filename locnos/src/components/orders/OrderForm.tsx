'use client'

import { useState } from 'react'
import { createOrder } from '@/app/dashboard/orders/actions'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'

export default function OrderForm() {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { showToast } = useToast()

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSubmitting(true)

        const formData = new FormData(e.currentTarget)

        try {
            await createOrder(formData)
            // Redirect happens in the action
        } catch (error) {
            console.error('Error creating order:', error)
            showToast('error', 'Falha ao criar pedido')
            setIsSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow space-y-4">
            <div>
                <label htmlFor="customer" className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Cliente *
                </label>
                <input
                    type="text"
                    id="customer"
                    name="customer"
                    required
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Digite o nome do cliente"
                />
            </div>

            <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                    Endereço de Entrega *
                </label>
                <input
                    type="text"
                    id="address"
                    name="address"
                    required
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Digite o endereço de entrega"
                />
            </div>

            <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                    Cidade *
                </label>
                <input
                    type="text"
                    id="city"
                    name="city"
                    required
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Digite a cidade"
                />
            </div>

            <div>
                <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-1">
                    Peso (kg) *
                </label>
                <input
                    type="number"
                    id="weight"
                    name="weight"
                    required
                    min="0.1"
                    step="0.1"
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Digite o peso em kg"
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
                    {isSubmitting ? 'Criando...' : 'Criar Pedido'}
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
