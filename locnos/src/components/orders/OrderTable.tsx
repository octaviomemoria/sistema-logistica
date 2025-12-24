'use client'

import { useState } from 'react'
import { deleteOrder, updateOrderStatus } from '@/app/dashboard/orders/actions'
import { useToast } from '@/hooks/use-toast'

type Order = {
    id: string
    customer: string
    address: string
    city: string
    weight: number
    status: string
    createdAt: Date
}

interface OrderTableProps {
    orders: Order[]
}

const statusColors = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    ASSIGNED: 'bg-blue-100 text-blue-800',
    DELIVERED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800'
}

const statusLabels = {
    PENDING: 'PENDENTE',
    ASSIGNED: 'ATRIBUÍDO',
    DELIVERED: 'ENTREGUE',
    CANCELLED: 'CANCELADO'
}

export default function OrderTable({ orders: initialOrders }: OrderTableProps) {
    const [orders, setOrders] = useState(initialOrders)
    const [filter, setFilter] = useState('ALL')
    const { showToast } = useToast()

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este pedido?')) return

        const result = await deleteOrder(id)
        if (result.success) {
            setOrders(prev => prev.filter(o => o.id !== id))
            showToast('success', 'Pedido excluído com sucesso!')
        } else {
            showToast('error', 'Falha ao excluir pedido')
        }
    }

    const handleStatusChange = async (id: string, newStatus: string) => {
        const result = await updateOrderStatus(id, newStatus)
        if (result.success) {
            setOrders(prev => prev.map(o =>
                o.id === id ? { ...o, status: newStatus } : o
            ))
            showToast('success', 'Status atualizado com sucesso!')
        } else {
            showToast('error', 'Falha ao atualizar status')
        }
    }

    const filteredOrders = filter === 'ALL'
        ? orders
        : orders.filter(o => o.status === filter)

    return (
        <div className="bg-white rounded shadow">
            <div className="p-4 border-b">
                <div className="flex gap-2">
                    <button
                        onClick={() => setFilter('ALL')}
                        className={`px-3 py-1 rounded ${filter === 'ALL' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                    >
                        Todos ({orders.length})
                    </button>
                    <button
                        onClick={() => setFilter('PENDING')}
                        className={`px-3 py-1 rounded ${filter === 'PENDING' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                    >
                        Pendentes ({orders.filter(o => o.status === 'PENDING').length})
                    </button>
                    <button
                        onClick={() => setFilter('ASSIGNED')}
                        className={`px-3 py-1 rounded ${filter === 'ASSIGNED' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                    >
                        Atribuídos ({orders.filter(o => o.status === 'ASSIGNED').length})
                    </button>
                    <button
                        onClick={() => setFilter('DELIVERED')}
                        className={`px-3 py-1 rounded ${filter === 'DELIVERED' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                    >
                        Entregues ({orders.filter(o => o.status === 'DELIVERED').length})
                    </button>
                </div>
            </div>

            {/* Table wrapper with horizontal scroll on mobile */}
            <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="inline-block min-w-full align-middle">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">Cliente</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">Endereço</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">Cidade</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">Peso</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">Status</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                                        Nenhum pedido encontrado
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map((order) => (
                                    <tr key={order.id} className="border-b hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm">{order.customer}</td>
                                        <td className="px-4 py-3 text-sm">{order.address}</td>
                                        <td className="px-4 py-3 text-sm">{order.city}</td>
                                        <td className="px-4 py-3 text-sm">{order.weight} kg</td>
                                        <td className="px-4 py-3">
                                            <select
                                                value={order.status}
                                                onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                                className={`px-2 py-1 rounded text-xs font-medium ${statusColors[order.status as keyof typeof statusColors]}`}
                                            >
                                                <option value="PENDING">{statusLabels.PENDING}</option>
                                                <option value="ASSIGNED">{statusLabels.ASSIGNED}</option>
                                                <option value="DELIVERED">{statusLabels.DELIVERED}</option>
                                                <option value="CANCELLED">{statusLabels.CANCELLED}</option>
                                            </select>
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => handleDelete(order.id)}
                                                className="text-red-600 hover:text-red-800 text-sm font-medium"
                                            >
                                                Excluir
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
