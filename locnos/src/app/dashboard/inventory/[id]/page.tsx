'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit2, History, Package, DollarSign, Calendar } from 'lucide-react'
import { getEquipmentHistory } from './history-actions'

export default function InventoryDetailsPage() {
    const params = useParams()
    const router = useRouter()

    // State
    const [loading, setLoading] = useState(true)
    const [equipment, setEquipment] = useState<any>(null)
    const [history, setHistory] = useState<any[]>([])

    const id = params.id as string

    useEffect(() => {
        if (!id) return
        getEquipmentHistory(id).then(res => {
            if (res.success) {
                setEquipment(res.equipment)
                setHistory(res.history || [])
            }
            setLoading(false)
        })
    }, [id])

    if (loading) return <div className="p-8 text-center">Carregando detalhes...</div>
    if (!equipment) return <div className="p-8 text-center">Equipment not found</div>

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                    <ArrowLeft size={20} />
                </button>
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold">{equipment.name}</h1>
                        <span className="text-sm px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border">
                            {equipment.category}
                        </span>
                    </div>
                    <p className="text-gray-500 text-sm mt-1">{equipment.description || 'Sem descrição'}</p>
                </div>
                <Link href={`/dashboard/inventory/${id}/edit`} className="btn-secondary flex items-center gap-2">
                    <Edit2 size={16} /> Editar
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Specs / Info */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <h3 className="font-bold mb-4 flex items-center gap-2"><DollarSign size={18} /> Valores</h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Custo Compra</span>
                                <span className="font-medium">R$ {equipment.purchasePrice?.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Preço Aluguel</span>
                                <span className="font-medium text-green-600">R$ {equipment.salePrice?.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between border-t pt-2">
                                <span className="text-gray-500">Valor Reposição</span>
                                <span className="font-bold text-red-600">R$ {equipment.replacementValue?.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <h3 className="font-bold mb-4 flex items-center gap-2"><Package size={18} /> Estoque</h3>
                        <div className="grid grid-cols-2 gap-4 text-center">
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <div className="text-xs text-gray-500">Total</div>
                                <div className="text-xl font-bold">{equipment.totalQty}</div>
                            </div>
                            <div className="p-3 bg-blue-50 rounded-lg">
                                <div className="text-xs text-blue-600">Alugados</div>
                                <div className="text-xl font-bold text-blue-700">{equipment.rentedQty}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* History Table */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                        <div className="px-6 py-4 border-b flex items-center gap-2">
                            <History size={18} className="text-gray-400" />
                            <h3 className="font-bold">Histórico de Locações</h3>
                        </div>
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-6 py-3 font-semibold text-gray-500">Data</th>
                                    <th className="px-6 py-3 font-semibold text-gray-500">Cliente</th>
                                    <th className="px-6 py-3 font-semibold text-gray-500">Qtd</th>
                                    <th className="px-6 py-3 font-semibold text-gray-500 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y text-gray-700">
                                {history.map((item: any) => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            {new Date(item.rental.startDate).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            <Link href={`/dashboard/persons/${item.rental.personId}`} className="hover:underline hover:text-blue-600">
                                                {item.rental.person.name}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 font-mono">{item.quantity}</td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`px-2 py-1 rounded-full text-xs ${item.rental.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                                }`}>
                                                {item.rental.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {history.length === 0 && (
                                    <tr><td colSpan={4} className="p-8 text-center text-gray-400">Nenhum histórico encontrado</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
