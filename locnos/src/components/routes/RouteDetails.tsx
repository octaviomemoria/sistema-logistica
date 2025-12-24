'use client'

import { useState } from 'react'
import Link from 'next/link'
import { updateRouteStatus } from '@/app/dashboard/routes/actions'
import { Calendar, Truck, Package, MapPin, ArrowLeft } from 'lucide-react'

type RouteWithDetails = {
    id: string
    date: Date
    status: string
    vehicle: {
        id: string
        plate: string
        model: string
        capacity: number
    }
    stops: Array<{
        id: string
        sequence: number
        order: {
            id: string
            customer: string
            address: string
            city: string
            weight: number
            status: string
        }
    }>
}

interface RouteDetailsProps {
    route: RouteWithDetails
}

const statusColors = {
    DRAFT: 'bg-gray-100 text-gray-800',
    CONFIRMED: 'bg-blue-100 text-blue-800',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
    COMPLETED: 'bg-green-100 text-green-800'
}

const statusLabels = {
    DRAFT: 'Rascunho',
    CONFIRMED: 'Confirmado',
    IN_PROGRESS: 'Em Andamento',
    COMPLETED: 'Concluído'
}

export default function RouteDetails({ route: initialRoute }: RouteDetailsProps) {
    const [route, setRoute] = useState(initialRoute)

    const handleStatusChange = async (newStatus: string) => {
        const result = await updateRouteStatus(route.id, newStatus)
        if (result.success) {
            setRoute(prev => ({ ...prev, status: newStatus }))
            alert('Status atualizado com sucesso!')
        } else {
            alert('Falha ao atualizar status')
        }
    }

    const totalWeight = route.stops.reduce((sum, stop) => sum + stop.order.weight, 0)
    const formattedDate = new Date(route.date).toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })

    return (
        <div>
            <Link
                href="/dashboard/routes"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6"
            >
                <ArrowLeft size={20} />
                Voltar para Rotas
            </Link>

            <div className="bg-white rounded shadow p-6 mb-6">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">
                            Rota #{route.id.slice(0, 8)}
                        </h1>
                        <p className="text-gray-600 flex items-center gap-2">
                            <Calendar size={18} />
                            {formattedDate}
                        </p>
                    </div>
                    <div className={`px-4 py-2 rounded text-sm font-semibold ${statusColors[route.status as keyof typeof statusColors]}`}>
                        {statusLabels[route.status as keyof typeof statusLabels]}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded">
                        <div className="flex items-center gap-2 text-blue-600 mb-2">
                            <Truck size={20} />
                            <span className="font-semibold">Veículo</span>
                        </div>
                        <p className="text-gray-800 font-medium">{route.vehicle.plate}</p>
                        <p className="text-sm text-gray-600">{route.vehicle.model}</p>
                        <p className="text-sm text-gray-600">Capacidade: {route.vehicle.capacity} kg</p>
                    </div>

                    <div className="bg-purple-50 p-4 rounded">
                        <div className="flex items-center gap-2 text-purple-600 mb-2">
                            <MapPin size={20} />
                            <span className="font-semibold">Paradas</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-800">{route.stops.length}</p>
                        <p className="text-sm text-gray-600">entregas programadas</p>
                    </div>

                    <div className="bg-green-50 p-4 rounded">
                        <div className="flex items-center gap-2 text-green-600 mb-2">
                            <Package size={20} />
                            <span className="font-semibold">Carga Total</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-800">{totalWeight.toFixed(1)} kg</p>
                        <p className="text-sm text-gray-600">
                            {((totalWeight / route.vehicle.capacity) * 100).toFixed(0)}% da capacidade
                        </p>
                    </div>
                </div>

                <div className="border-t pt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Alterar Status da Rota
                    </label>
                    <div className="flex gap-2">
                        <select
                            value={route.status}
                            onChange={(e) => handleStatusChange(e.target.value)}
                            className="flex-1 border rounded px-3 py-2"
                            disabled={route.status === 'COMPLETED'}
                        >
                            <option value="DRAFT">Rascunho</option>
                            <option value="CONFIRMED">Confirmado</option>
                            <option value="IN_PROGRESS">Em Andamento</option>
                            <option value="COMPLETED">Concluído</option>
                        </select>
                    </div>
                    {route.status === 'COMPLETED' && (
                        <p className="text-sm text-gray-500 mt-2">
                            ✓ Rota concluída. Todos os pedidos foram marcados como entregues.
                        </p>
                    )}
                </div>
            </div>

            <div className="bg-white rounded shadow p-6">
                <h2 className="text-xl font-bold mb-4">Sequência de Entregas</h2>
                <div className="space-y-3">
                    {route.stops.map((stop, index) => (
                        <div
                            key={stop.id}
                            className="flex items-start gap-4 p-4 border rounded hover:bg-gray-50"
                        >
                            <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                                {stop.sequence}
                            </div>
                            <div className="flex-grow">
                                <h3 className="font-semibold text-gray-800">{stop.order.customer}</h3>
                                <p className="text-sm text-gray-600">{stop.order.address}</p>
                                <p className="text-sm text-gray-600">{stop.order.city}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-medium text-gray-800">{stop.order.weight} kg</p>
                                <p className="text-xs text-gray-500">Pedido #{stop.order.id.slice(0, 8)}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
