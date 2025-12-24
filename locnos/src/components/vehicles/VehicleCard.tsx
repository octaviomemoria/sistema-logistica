'use client'

import { useState } from 'react'
import { deleteVehicle, updateVehicleStatus } from '@/app/dashboard/vehicles/actions'
import { Truck, User, Weight } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

type Vehicle = {
    id: string
    plate: string
    model: string
    capacity: number
    driverName: string | null
    status: string
}

interface VehicleCardProps {
    vehicle: Vehicle
}

const statusColors = {
    AVAILABLE: 'bg-green-100 text-green-800 border-green-300',
    IN_TRANSIT: 'bg-blue-100 text-blue-800 border-blue-300',
    MAINTENANCE: 'bg-red-100 text-red-800 border-red-300'
}

const statusLabels = {
    AVAILABLE: 'Disponível',
    IN_TRANSIT: 'Em Trânsito',
    MAINTENANCE: 'Manutenção'
}

export default function VehicleCard({ vehicle: initialVehicle }: VehicleCardProps) {
    const [vehicle, setVehicle] = useState(initialVehicle)
    const [isDeleted, setIsDeleted] = useState(false)
    const { showToast } = useToast()

    const handleDelete = async () => {
        if (!confirm(`Tem certeza que deseja excluir o veículo ${vehicle.plate}?`)) return

        const result = await deleteVehicle(vehicle.id)
        if (result.success) {
            setIsDeleted(true)
            showToast('success', 'Veículo excluído com sucesso!')
        } else {
            showToast('error', 'Falha ao excluir veículo')
        }
    }

    const handleStatusChange = async (newStatus: string) => {
        const result = await updateVehicleStatus(vehicle.id, newStatus)
        if (result.success) {
            setVehicle(prev => ({ ...prev, status: newStatus }))
            showToast('success', 'Status atualizado com sucesso!')
        } else {
            showToast('error', 'Falha ao atualizar status')
        }
    }

    if (isDeleted) return null

    return (
        <div className="bg-white rounded shadow p-6 border-l-4 border-blue-500">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-xl font-bold text-gray-800">{vehicle.plate}</h3>
                    <p className="text-gray-600">{vehicle.model}</p>
                </div>
                <div className={`px-3 py-1 rounded text-xs font-semibold border ${statusColors[vehicle.status as keyof typeof statusColors]}`}>
                    {statusLabels[vehicle.status as keyof typeof statusLabels]}
                </div>
            </div>

            <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Weight size={16} />
                    <span>Capacidade: {vehicle.capacity} kg</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User size={16} />
                    <span>Motorista: {vehicle.driverName || 'Não atribuído'}</span>
                </div>
            </div>

            <div className="border-t pt-4 space-y-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                    Alterar Status
                </label>
                <select
                    value={vehicle.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="w-full border rounded px-2 py-1 text-sm"
                >
                    <option value="AVAILABLE">{statusLabels.AVAILABLE}</option>
                    <option value="IN_TRANSIT">{statusLabels.IN_TRANSIT}</option>
                    <option value="MAINTENANCE">{statusLabels.MAINTENANCE}</option>
                </select>

                <button
                    onClick={handleDelete}
                    className="w-full mt-2 text-red-600 hover:text-red-800 text-sm font-medium py-1"
                >
                    Excluir Veículo
                </button>
            </div>
        </div>
    )
}
