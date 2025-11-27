'use client'

import { useState } from 'react'
import { createRoute } from '@/app/dashboard/routing/actions'
import OrderList from './OrderList'

type Vehicle = {
    id: string
    plate: string
    model: string
    capacity: number
    status: string
}

type Order = {
    id: string
    customer: string
    address: string
    city: string
    weight: number
    status: string
}

interface RoutePlannerProps {
    initialOrders: Order[]
    vehicles: Vehicle[]
}

export default function RoutePlanner({ initialOrders, vehicles }: RoutePlannerProps) {
    const [orders, setOrders] = useState(initialOrders)
    const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([])
    const [selectedVehicleId, setSelectedVehicleId] = useState<string>('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSelectOrder = (orderId: string) => {
        setSelectedOrderIds(prev =>
            prev.includes(orderId)
                ? prev.filter(id => id !== orderId)
                : [...prev, orderId]
        )
    }

    const handleCreateRoute = async () => {
        if (!selectedVehicleId || selectedOrderIds.length === 0) return

        setIsSubmitting(true)
        try {
            const result = await createRoute({
                date: new Date(),
                vehicleId: selectedVehicleId,
                orderIds: selectedOrderIds
            })

            if (result.success) {
                alert('Route created successfully!')
                // Optimistically update UI or wait for revalidation
                setOrders(prev => prev.filter(o => !selectedOrderIds.includes(o.id)))
                setSelectedOrderIds([])
                setSelectedVehicleId('')
            } else {
                alert('Failed to create route')
            }
        } catch (error) {
            console.error(error)
            alert('An error occurred')
        } finally {
            setIsSubmitting(false)
        }
    }

    const selectedOrdersWeight = orders
        .filter(o => selectedOrderIds.includes(o.id))
        .reduce((sum, o) => sum + o.weight, 0)

    const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId)

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <OrderList
                orders={orders}
                onSelectOrder={handleSelectOrder}
                selectedOrderIds={selectedOrderIds}
            />

            <div className="bg-white p-4 rounded shadow">
                <h2 className="text-xl font-bold mb-4">Route Details</h2>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Vehicle</label>
                    <select
                        className="w-full border rounded p-2"
                        value={selectedVehicleId}
                        onChange={(e) => setSelectedVehicleId(e.target.value)}
                    >
                        <option value="">-- Select Vehicle --</option>
                        {vehicles.map(vehicle => (
                            <option key={vehicle.id} value={vehicle.id}>
                                {vehicle.plate} - {vehicle.model} ({vehicle.capacity} kg)
                            </option>
                        ))}
                    </select>
                </div>

                <div className="mb-6 p-4 bg-gray-50 rounded">
                    <h3 className="font-semibold mb-2">Summary</h3>
                    <p>Selected Orders: {selectedOrderIds.length}</p>
                    <p>Total Weight: {selectedOrdersWeight} kg</p>
                    {selectedVehicle && (
                        <p className={`text-sm ${selectedOrdersWeight > selectedVehicle.capacity ? 'text-red-500 font-bold' : 'text-green-600'}`}>
                            Capacity: {selectedVehicle.capacity} kg
                        </p>
                    )}
                </div>

                <button
                    className={`w-full py-2 px-4 rounded text-white font-bold ${!selectedVehicleId || selectedOrderIds.length === 0 || isSubmitting
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                    onClick={handleCreateRoute}
                    disabled={!selectedVehicleId || selectedOrderIds.length === 0 || isSubmitting}
                >
                    {isSubmitting ? 'Creating Route...' : 'Create Route'}
                </button>
            </div>
        </div>
    )
}
