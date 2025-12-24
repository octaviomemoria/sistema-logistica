'use client'

import { useState } from 'react'

type Order = {
    id: string
    customer: string
    address: string
    city: string
    weight: number
    status: string
}

interface OrderListProps {
    orders: Order[]
    onSelectOrder: (orderId: string) => void
    selectedOrderIds: string[]
}

export default function OrderList({ orders, onSelectOrder, selectedOrderIds }: OrderListProps) {
    return (
        <div className="bg-white p-4 rounded shadow">
            <h2 className="text-xl font-bold mb-4">Pedidos Disponíveis</h2>
            <div className="space-y-2">
                {orders.length === 0 ? (
                    <p className="text-gray-500">Nenhum pedido pendente.</p>
                ) : (
                    orders.map((order) => (
                        <div
                            key={order.id}
                            className={`p-3 border rounded cursor-pointer flex justify-between items-center ${selectedOrderIds.includes(order.id) ? 'bg-blue-50 border-blue-500' : 'hover:bg-gray-50'
                                }`}
                            onClick={() => onSelectOrder(order.id)}
                        >
                            <div>
                                <p className="font-semibold">{order.customer}</p>
                                <p className="text-sm text-gray-600">{order.address}, {order.city}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-medium">{order.weight} kg</p>
                                <input
                                    type="checkbox"
                                    checked={selectedOrderIds.includes(order.id)}
                                    readOnly
                                    className="mt-1"
                                />
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
