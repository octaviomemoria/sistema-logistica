'use client'

import { useState, useEffect } from 'react'
import { X, Truck, Save } from 'lucide-react'
import { updateRentalDriver, getDrivers } from '@/app/dashboard/rentals/actions'
import { useToast } from '@/hooks/use-toast'

interface RentalDriverModalProps {
    rentalId: string
    role: 'DELIVERY' | 'RETURN' // 'DELIVERY' | 'RETURN'
    isOpen: boolean
    onClose: () => void
    currentDriverId?: string
}

export default function RentalDriverModal({ rentalId, role, isOpen, onClose, currentDriverId }: RentalDriverModalProps) {
    const { showToast } = useToast()
    const [loading, setLoading] = useState(false)
    const [drivers, setDrivers] = useState<any[]>([])
    const [selectedDriver, setSelectedDriver] = useState(currentDriverId || '')

    useEffect(() => {
        if (isOpen) {
            getDrivers().then(res => {
                if (res.success) setDrivers(res.drivers || [])
            })
            setSelectedDriver(currentDriverId || '')
        }
    }, [isOpen, currentDriverId])

    if (!isOpen) return null

    const handleSubmit = async () => {
        setLoading(true)
        const res = await updateRentalDriver(rentalId, role, selectedDriver)
        setLoading(false)

        if (res.success) {
            showToast('success', 'Motorista atribuído!')
            onClose()
        } else {
            showToast('error', res.error || 'Erro ao atribuir')
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-sm animate-in fade-in zoom-in-95 duration-200">

                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="font-bold flex items-center gap-2 text-gray-800">
                        <Truck size={20} className="text-orange-500" />
                        Planejar {role === 'DELIVERY' ? 'Entrega' : 'Devolução'}
                    </h3>
                    <button onClick={onClose}><X size={20} className="text-gray-400 hover:text-gray-600" /></button>
                </div>

                <div className="p-4 space-y-4">
                    <p className="text-sm text-gray-600">Selecione o motorista responsável por esta {role === 'DELIVERY' ? 'entrega' : 'coleta'}.</p>

                    <div>
                        <label className="label">Motorista / Responsável</label>
                        <select
                            className="input"
                            value={selectedDriver}
                            onChange={e => setSelectedDriver(e.target.value)}
                        >
                            <option value="">Selecione...</option>
                            {drivers.map(d => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="p-4 bg-gray-50 flex justify-end gap-2 rounded-b-lg">
                    <button onClick={onClose} className="btn-secondary text-sm">Cancelar</button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="btn-primary text-sm"
                    >
                        {loading ? 'Salvando...' : 'Confirmar'}
                    </button>
                </div>

            </div>
        </div>
    )
}
