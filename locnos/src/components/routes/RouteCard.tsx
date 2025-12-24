'use client'

import { useState } from 'react'
import Link from 'next/link'
import { deleteRoute, updateRouteStatus } from '@/app/dashboard/routes/actions'
import { Calendar, Truck, Package, MapPin } from 'lucide-react'

type RouteWithDetails = {
    id: string
    date: Date
    status: string
    vehicle: {
        plate: string
        model: string
    }
    stops: Array<{
        id: string
        sequence: number
        order: {
            customer: string
            address: string
            city: string
            weight: number
        }
    }>
}

interface RouteCardProps {
    route: RouteWithDetails
}

const statusColors = {
    DRAFT: 'bg-gray-100 text-gray-800 border-gray-300',
    CONFIRMED: 'bg-blue-100 text-blue-800 border-blue-300',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    COMPLETED: 'bg-green-100 text-green-800 border-green-300'
}

const statusLabels = {
    DRAFT: 'Rascunho',
    CONFIRMED: 'Confirmado',
    IN_PROGRESS: 'Em Andamento',
    COMPLETED: 'Concluído'
}

export default function RouteCard({ route: initialRoute }: RouteCardProps) {
    const [route, setRoute] = useState(initialRoute)
    const [isDeleted, setIsDeleted] = useState(false)

    const handleDelete = async () => {
        if (!confirm(`Tem certeza que deseja excluir esta rota?`)) return

        const result = await deleteRoute(route.id)
        if (result.success) {
            setIsDeleted(true)
        } else {
            alert('Falha ao excluir rota')
        }
    }

    const handleStatusChange = async (newStatus: string) => {
        const result = await updateRouteStatus(route.id, newStatus)
        if (result.success) {
            setRoute(prev => ({ ...prev, status: newStatus }))
        } else {
            alert('Falha ao atualizar status')
        }
    }

    if (isDeleted) return null

    const totalWeight = route.stops.reduce((sum, stop) => sum + stop.order.weight, 0)
    const formattedDate = new Date(route.date).toLocaleDateString('pt-BR')

    return (
        <div className="bg-white rounded shadow p-6 border-l-4 border-purple-500">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-800">Rota #{route.id.slice(0, 8)}</h3>
                    <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                        <Calendar size={14} />
                        {formattedDate}
                    </p>
                </div>
                <div className={`px-3 py-1 rounded text-xs font-semibold border ${statusColors[route.status as keyof typeof statusColors]}`}>
                    {statusLabels[route.status as keyof typeof statusLabels]}
                </div>
            </div>

            <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Truck size={16} />
                    <span>{route.vehicle.plate} - {route.vehicle.model}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin size={16} />
                    <span>{route.stops.length} paradas</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Package size={16} />
                    <span>Peso total: {totalWeight.toFixed(1)} kg</span>
                </div>
            </div>

            <div className="border-t pt-4 space-y-2">
                <Link
                    href={`/dashboard/routes/${route.id}`}
                    className="block w-full text-center bg-blue-50 hover:bg-blue-100 text-blue-600 py-2 rounded font-medium text-sm"
                >
                    Ver Detalhes
                </Link>

                <select
                    value={route.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="w-full border rounded px-2 py-1 text-sm"
                    disabled={route.status === 'COMPLETED'}
                >
                    <option value="DRAFT">Rascunho</option>
                    <option value="CONFIRMED">Confirmado</option>
                    <option value="IN_PROGRESS">Em Andamento</option>
                    <option value="COMPLETED">Concluído</option>
                </select>

                <button
                    onClick={handleDelete}
                    className="w-full text-red-600 hover:text-red-800 text-sm font-medium py-1"
                >
                    Excluir Rota
                </button>
            </div>
        </div>
    )
}
