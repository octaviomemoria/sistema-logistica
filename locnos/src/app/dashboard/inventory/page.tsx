'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Search, Edit2, AlertTriangle, Trash2, Filter, Upload, FileUp } from 'lucide-react'
import { getEquipments, deleteEquipment, InventoryFilter, bulkImportEquipments, EquipmentInput } from './actions'
import { useToast } from '@/hooks/use-toast'

export default function InventoryPage() {
    const [equipments, setEquipments] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [filter, setFilter] = useState<InventoryFilter>('ALL')
    const [isImportModalOpen, setImportModalOpen] = useState(false)
    const { showToast } = useToast()

    const loadData = async () => {
        setLoading(true)
        const result = await getEquipments(filter, search)
        if (result.success) {
            setEquipments(result.equipments)
        } else {
            showToast('error', 'Erro ao carregar inventário')
        }
        setLoading(false)
    }

    useEffect(() => {
        const timeout = setTimeout(loadData, 300)
        return () => clearTimeout(timeout)
    }, [search, filter])

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este equipamento?')) return
        const result = await deleteEquipment(id)
        if (result.success) {
            showToast('success', 'Equipamento excluído')
            loadData()
        } else {
            showToast('error', 'Erro ao excluir')
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = async (event) => {
            const text = event.target?.result as string
            const lines = text.split('\n')
            const headers = lines[0].split(',') // Simple CSV split, assumes standard CSV

            // Basic parsing logic (improve with papaparse for production)
            const items: EquipmentInput[] = []

            for (let i = 1; i < lines.length; i++) {
                if (!lines[i].trim()) continue
                const values = lines[i].split(',')

                // Very basic implementation assuming correct order: Name, Category, Price, Qty
                if (values.length < 4) continue

                items.push({
                    name: values[0].trim(),
                    category: values[1].trim(),
                    purchasePrice: parseFloat(values[2]) || 0,
                    totalQty: parseInt(values[3]) || 1,
                    rentedQty: 0,
                    rentalPeriods: [{ description: 'Diária', days: 1, price: parseFloat(values[2]) * 0.05 }], // Auto-calc dummy
                    specifications: [],
                    externalLinks: []
                })
            }

            if (items.length > 0) {
                const result = await bulkImportEquipments(items)
                if (result.success) {
                    showToast('success', `${result.count} equipamentos importados!`)
                    setImportModalOpen(false)
                    loadData()
                } else {
                    showToast('error', 'Erro na importação')
                }
            } else {
                showToast('error', 'Nenhum item válido encontrado no CSV')
            }
        }
        reader.readAsText(file)
    }

    return (
        <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Inventário</h1>
                    <p className="text-gray-600">Gerencie equipamentos, preços e estoque.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setImportModalOpen(true)}
                        className="btn-secondary flex items-center gap-2"
                    >
                        <Upload size={18} /> Importar CSV
                    </button>
                    <Link href="/dashboard/inventory/new" className="btn-primary flex items-center gap-2">
                        <Plus size={18} /> Novo Equipamento
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <div className="card p-4 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="flex gap-2">
                    {['ALL', 'AVAILABLE', 'RENTED'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f as InventoryFilter)}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === f ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                            {f === 'ALL' ? 'Todos' : f === 'AVAILABLE' ? 'Disponíveis' : 'Alugados'}
                        </button>
                    ))}
                </div>
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        className="input pl-10"
                        placeholder="Buscar equipamento..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="card overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-700 uppercase text-xs border-b">
                        <tr>
                            <th className="px-6 py-4">Equipamento</th>
                            <th className="px-6 py-4">Categoria</th>
                            <th className="px-6 py-4 text-center">Estoque</th>
                            <th className="px-6 py-4">Preço (Min)</th>
                            <th className="px-6 py-4 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={5} className="p-8 text-center text-gray-500">Carregando...</td></tr>
                        ) : equipments.length === 0 ? (
                            <tr><td colSpan={5} className="p-8 text-center text-gray-500">Nenhum item encontrado.</td></tr>
                        ) : (
                            equipments.map(item => {
                                const available = item.totalQty - item.rentedQty
                                const isCritical = available <= 2
                                const minPrice = item.rentalPeriods?.[0]?.price || 0

                                return (
                                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0 border border-gray-200">
                                                    {item.imageUrl ? (
                                                        <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <FileUp size={20} className="text-gray-400" />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-gray-900">{item.name}</div>
                                                    <div className="text-xs text-gray-500">{item.brand || 'Sem marca'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600 font-medium">
                                                {item.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex flex-col items-center">
                                                <div className={`font-bold flex items-center gap-1 ${isCritical ? 'text-red-600' : 'text-gray-900'}`}>
                                                    {available}
                                                    {isCritical && (
                                                        <div className="relative group">
                                                            <AlertTriangle size={14} className="animate-pulse" />
                                                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                                                Estoque Crítico
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="text-xs text-gray-400">de {item.totalQty}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">
                                                R$ {minPrice.toFixed(2)}
                                            </div>
                                            <div className="text-xs text-gray-500">{item.rentalPeriods?.[0]?.description}</div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Link href={`/dashboard/inventory/${item.id}/edit`} className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                                                    <Edit2 size={18} />
                                                </Link>
                                                <button onClick={() => handleDelete(item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Import Modal */}
            {isImportModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold">Importação em Massa</h3>
                            <button onClick={() => setImportModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <Trash2 size={24} className="rotate-45" /> {/* Using Trash as X icon surrogate or similar */}
                            </button>
                        </div>

                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center text-center hover:border-blue-500 transition-colors cursor-pointer relative bg-gray-50">
                            <FileUp size={48} className="text-blue-500 mb-4" />
                            <p className="font-medium text-gray-900 mb-1">Clique para selecionar o arquivo CSV</p>
                            <p className="text-sm text-gray-500">Ou arraste e solte aqui</p>
                            <input
                                type="file"
                                accept=".csv"
                                onChange={handleFileUpload}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                        </div>

                        <div className="mt-6 bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
                            <strong>Formato esperado (CSV):</strong><br />
                            Nome, Categoria, Preço Compra, Qtd Total<br />
                            <span className="opacity-75 text-xs">Ex: Betoneira, Construção, 2500.00, 5</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
