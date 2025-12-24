'use client'

import { useState } from 'react'
import { X, AlertTriangle, Save } from 'lucide-react'
import { addOccurrence } from '@/app/dashboard/rentals/actions'
import { useToast } from '@/hooks/use-toast'

interface RentalOccurrenceModalProps {
    rentalId: string
    isOpen: boolean
    onClose: () => void
}

export default function RentalOccurrenceModal({ rentalId, isOpen, onClose }: RentalOccurrenceModalProps) {
    const { showToast } = useToast()
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState({
        title: '',
        description: '',
        type: 'DAMAGE',
        cost: 0
    })

    if (!isOpen) return null

    const handleSubmit = async () => {
        if (!data.title) return showToast('error', 'Informe um título')

        setLoading(true)
        const res = await addOccurrence(rentalId, data)
        setLoading(false)

        if (res.success) {
            showToast('success', 'Ocorrência registrada!')
            onClose()
            setData({ title: '', description: '', type: 'DAMAGE', cost: 0 })
        } else {
            showToast('error', res.error || 'Erro ao registrar')
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200">

                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="font-bold flex items-center gap-2 text-red-600">
                        <AlertTriangle size={20} /> Registrar Ocorrência
                    </h3>
                    <button onClick={onClose}><X size={20} className="text-gray-400 hover:text-gray-600" /></button>
                </div>

                <div className="p-4 space-y-4">
                    <div>
                        <label className="label">Título do Problema</label>
                        <input
                            className="input"
                            placeholder="Ex: Pneu furado, Peça quebrada..."
                            value={data.title}
                            onChange={e => setData({ ...data, title: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">Tipo</label>
                            <select
                                className="input"
                                value={data.type}
                                onChange={e => setData({ ...data, type: e.target.value })}
                            >
                                <option value="DAMAGE">Dano / Quebra</option>
                                <option value="LOSS">Perda / Extravio</option>
                                <option value="CLEANING">Limpeza / Sujeira</option>
                                <option value="OTHER">Outros</option>
                            </select>
                        </div>
                        <div>
                            <label className="label">Custo Estimado (R$)</label>
                            <input
                                type="number"
                                className="input text-right"
                                value={data.cost}
                                onChange={e => setData({ ...data, cost: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="label">Descrição Detalhada</label>
                        <textarea
                            className="input h-24"
                            placeholder="Detalhes do ocorrido..."
                            value={data.description}
                            onChange={e => setData({ ...data, description: e.target.value })}
                        />
                    </div>
                </div>

                <div className="p-4 bg-gray-50 flex justify-end gap-2 rounded-b-lg">
                    <button onClick={onClose} className="btn-secondary text-sm">Cancelar</button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="btn-primary text-sm bg-red-600 hover:bg-red-700 border-red-700"
                    >
                        {loading ? 'Salvando...' : 'Registrar Ocorrência'}
                    </button>
                </div>

            </div>
        </div>
    )
}
