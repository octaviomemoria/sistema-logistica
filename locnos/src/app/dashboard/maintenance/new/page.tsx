'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getEquipments } from '../../inventory/actions'
import { createMaintenance } from '../actions'
import { ArrowLeft, Save, Wrench, AlertTriangle, Clock } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function NewMaintenancePage() {
    const router = useRouter()
    const { showToast } = useToast()
    const [loading, setLoading] = useState(false)
    const [equipments, setEquipments] = useState<any[]>([])

    // Form
    const [equipmentId, setEquipmentId] = useState('')
    const [type, setType] = useState('CORRECTIVE')
    const [description, setDescription] = useState('')
    const [cost, setCost] = useState(0)

    useEffect(() => {
        getEquipments('ALL').then(res => {
            if (res.success) setEquipments(res.equipments || [])
        })
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!equipmentId) return showToast('error', 'Selecione um equipamento')

        setLoading(true)
        const res = await createMaintenance({
            equipmentId,
            type,
            description,
            cost
        })

        if (res.success) {
            showToast('success', 'Manutenção registrada!')
            router.push('/dashboard/maintenance')
        } else {
            showToast('error', res.error || 'Erro ao registrar')
            setLoading(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto p-6">
            <button onClick={() => router.back()} className="flex items-center text-gray-500 mb-6 hover:text-gray-800">
                <ArrowLeft size={20} className="mr-2" /> Voltar
            </button>

            <div className="bg-white rounded-xl shadow-sm border p-8">
                <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <Wrench className="text-orange-600" /> Nova Manutenção
                </h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="label">Equipamento</label>
                        <select
                            className="input"
                            value={equipmentId}
                            onChange={e => setEquipmentId(e.target.value)}
                            required
                        >
                            <option value="">Selecione...</option>
                            {equipments.map(e => (
                                <option key={e.id} value={e.id}>{e.name} ({e.brand})</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">Tipo</label>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setType('CORRECTIVE')}
                                    className={`flex-1 py-2 px-3 rounded border text-sm font-medium flex items-center justify-center gap-2 ${type === 'CORRECTIVE' ? 'bg-red-50 border-red-200 text-red-700 ring-1 ring-red-200' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                                >
                                    <AlertTriangle size={16} /> Corretiva
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setType('PREVENTIVE')}
                                    className={`flex-1 py-2 px-3 rounded border text-sm font-medium flex items-center justify-center gap-2 ${type === 'PREVENTIVE' ? 'bg-blue-50 border-blue-200 text-blue-700 ring-1 ring-blue-200' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                                >
                                    <Clock size={16} /> Preventiva
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="label">Custo Estimado</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-gray-500">R$</span>
                                <input
                                    type="number"
                                    className="input pl-10"
                                    value={cost}
                                    onChange={e => setCost(parseFloat(e.target.value) || 0)}
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="label">Descrição do Problema / Serviço</label>
                        <textarea
                            className="input min-h-[100px]"
                            placeholder="Descreva o que precisa ser feito..."
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full flex items-center justify-center gap-2"
                    >
                        {loading ? 'Salvando...' : <><Save size={20} /> Registrar Manutenção</>}
                    </button>
                </form>
            </div>
        </div>
    )
}
