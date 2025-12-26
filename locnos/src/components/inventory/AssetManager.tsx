'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Plus, QrCode, Trash2, Pencil } from 'lucide-react'
import { getAssets, createAsset, updateAsset, deleteAsset } from './asset-actions'
import QRCode from 'qrcode.react'

interface Asset {
    id: string
    code: string
    serialNumber?: string
    status: string
    condition?: string
    notes?: string
    createdAt: Date
}

export default function AssetManager({ equipmentId }: { equipmentId: string }) {
    const { data: session } = useSession()
    const [assets, setAssets] = useState<Asset[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [formData, setFormData] = useState({
        code: '',
        serialNumber: '',
        condition: 'Novo',
        notes: ''
    })
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
    const [showQRCode, setShowQRCode] = useState<string | null>(null)

    useEffect(() => {
        loadAssets()
    }, [equipmentId])

    const loadAssets = async () => {
        setLoading(true)
        const result = await getAssets(equipmentId, session?.user?.tenantId || '')
        if (result.success && result.assets) {
            setAssets(result.assets as any)
        }
        setLoading(false)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        const result = selectedAsset
            ? await updateAsset(selectedAsset.id, formData)
            : await createAsset({
                equipmentId,
                tenantId: session?.user?.tenantId || '',
                ...formData
            })

        if (result.success) {
            await loadAssets()
            setShowForm(false)
            setFormData({ code: '', serialNumber: '', condition: 'Novo', notes: '' })
            setSelectedAsset(null)
        }
    }

    const handleEdit = (asset: Asset) => {
        setSelectedAsset(asset)
        setFormData({
            code: asset.code,
            serialNumber: asset.serialNumber || '',
            condition: asset.condition || 'Novo',
            notes: asset.notes || ''
        })
        setShowForm(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este ativo?')) return

        const result = await deleteAsset(id, equipmentId)
        if (result.success) {
            await loadAssets()
        }
    }

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            AVAILABLE: 'bg-green-100 text-green-800',
            RENTED: 'bg-blue-100 text-blue-800',
            MAINTENANCE: 'bg-yellow-100 text-yellow-800',
            LOST: 'bg-red-100 text-red-800',
            RETIRED: 'bg-gray-100 text-gray-800'
        }
        return colors[status] || 'bg-gray-100 text-gray-800'
    }

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            AVAILABLE: 'Disponível',
            RENTED: 'Alugado',
            MAINTENANCE: 'Manutenção',
            LOST: 'Extraviado',
            RETIRED: 'Baixado'
        }
        return labels[status] || status
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Ativos / Patrimônio</h2>
                <button
                    onClick={() => {
                        setSelectedAsset(null)
                        setFormData({ code: '', serialNumber: '', condition: 'Novo', notes: '' })
                        setShowForm(!showForm)
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    <Plus size={16} />
                    Novo Ativo
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="mb-6 p-4 border rounded-lg bg-gray-50">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Código / Etiqueta</label>
                            <input
                                type="text"
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                placeholder="Deixe vazio para gerar automaticamente"
                                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Número de Série</label>
                            <input
                                type="text"
                                value={formData.serialNumber}
                                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Condição</label>
                            <select
                                value={formData.condition}
                                onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="Novo">Novo</option>
                                <option value="Bom">Bom</option>
                                <option value="Regular">Regular</option>
                                <option value="Ruim">Ruim</option>
                            </select>
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium mb-1">Observações</label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                rows={3}
                                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                            {selectedAsset ? 'Atualizar' : 'Cadastrar'}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setShowForm(false)
                                setSelectedAsset(null)
                            }}
                            className="px-4 py-2 border rounded hover:bg-gray-50"
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            )}

            {loading ? (
                <div className="text-center py-8 text-gray-500">Carregando...</div>
            ) : assets.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    Nenhum ativo cadastrado. Clique em "Novo Ativo" para começar.
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b bg-gray-50">
                                <th className="text-left p-3">Código</th>
                                <th className="text-left p-3">Número de Série</th>
                                <th className="text-left p-3">Status</th>
                                <th className="text-left p-3">Condição</th>
                                <th className="text-center p-3">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {assets.map((asset) => (
                                <tr key={asset.id} className="border-b hover:bg-gray-50">
                                    <td className="p-3 font-mono font-semibold">{asset.code}</td>
                                    <td className="p-3">{asset.serialNumber || '-'}</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 rounded text-xs ${getStatusColor(asset.status)}`}>
                                            {getStatusLabel(asset.status)}
                                        </span>
                                    </td>
                                    <td className="p-3">{asset.condition || '-'}</td>
                                    <td className="p-3">
                                        <div className="flex justify-center gap-2">
                                            <button
                                                onClick={() => setShowQRCode(asset.code)}
                                                className="p-2 hover:bg-gray-200 rounded"
                                                title="Ver QR Code"
                                            >
                                                <QrCode size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleEdit(asset)}
                                                className="p-2 hover:bg-gray-200 rounded"
                                                title="Editar"
                                            >
                                                <Pencil size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(asset.id)}
                                                className="p-2 hover:bg-red-100 text-red-600 rounded"
                                                title="Excluir"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* QR Code Modal */}
            {showQRCode && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-lg shadow-xl max-w-md">
                        <h3 className="text-lg font-semibold mb-4 text-center">QR Code - {showQRCode}</h3>
                        <div className="flex justify-center mb-4">
                            <QRCode value={showQRCode} size={256} />
                        </div>
                        <button
                            onClick={() => setShowQRCode(null)}
                            className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
