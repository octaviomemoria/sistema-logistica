'use client'

import { useState } from 'react'
import { Edit2, Truck, CheckCircle, RotateCcw, AlertTriangle, PackageCheck, XCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { updateRentalStatus } from '@/app/dashboard/rentals/actions'
import { cancelRental } from '@/app/dashboard/rentals/cancel-rental-action'
import { useToast } from '@/hooks/use-toast'
import RentalOccurrenceModal from './RentalOccurrenceModal'
import RentalDriverModal from './RentalDriverModal'

interface RentalActionsProps {
    rental: any
}

export default function RentalActions({ rental }: RentalActionsProps) {
    const router = useRouter()
    const { showToast } = useToast()
    const [loading, setLoading] = useState(false)
    const [modalType, setModalType] = useState<'NONE' | 'OCCURRENCE' | 'DELIVERY' | 'RETURN'>('NONE')
    const [showCancelModal, setShowCancelModal] = useState(false)
    const [cancelReason, setCancelReason] = useState('')

    // Handlers
    const handleStatusChange = async (newStatus: string) => {
        if (!confirm(`Confirmar alteração de status para ${newStatus}?`)) return
        setLoading(true)
        const res = await updateRentalStatus(rental.id, newStatus)
        if (res.success) {
            showToast('success', 'Status atualizado!')
        } else {
            showToast('error', res.error || 'Erro ao atualizar')
        }
        setLoading(false)
    }

    const handleCancelRental = async () => {
        setLoading(true)
        const res = await cancelRental(rental.id, cancelReason)
        if (res.success) {
            showToast('success', 'Locação cancelada!')
            setShowCancelModal(false)
            setCancelReason('')
            router.refresh()
        } else {
            showToast('error', res.error || 'Erro ao cancelar')
        }
        setLoading(false)
    }

    const showDeliveryRoute = rental.deliveryFee > 0 && rental.status !== 'ACTIVE' && rental.status !== 'COMPLETED'
    const showReturnRoute = rental.returnFee > 0 && rental.status === 'ACTIVE'

    // Status Logic
    const canDeliver = rental.status === 'DRAFT' || rental.status === 'SCHEDULED'
    const canReturn = rental.status === 'ACTIVE' || rental.status === 'LATE'

    return (
        <div className="flex items-center justify-end gap-1">
            {/* 1. Edit */}
            <Link
                href={`/dashboard/rentals/${rental.id}`}
                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                title="Editar Locação"
            >
                <Edit2 size={16} />
            </Link>

            {/* 2. Route Delivery */}
            {showDeliveryRoute && (
                <button
                    onClick={() => setModalType('DELIVERY')}
                    className={`p-1.5 rounded-md transition-colors ${rental.deliveryDriverId ? 'text-green-600 bg-green-50' : 'text-orange-600 hover:bg-orange-50'}`}
                    title={rental.deliveryDriverId ? "Rota Definida (Alterar)" : "Planejar Rota de Entrega"}
                >
                    <Truck size={16} />
                </button>
            )}

            {/* 3. Deliver (Mark as Entregue) */}
            {canDeliver && (
                <button
                    onClick={() => handleStatusChange('ACTIVE')}
                    disabled={loading}
                    className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                    title="Marcar como Entregue"
                >
                    <PackageCheck size={16} />
                </button>
            )}

            {/* 4. Route Return */}
            {showReturnRoute && (
                <button
                    onClick={() => setModalType('RETURN')}
                    className={`p-1.5 rounded-md transition-colors ${rental.returnDriverId ? 'text-green-600 bg-green-50' : 'text-purple-600 hover:bg-purple-50'}`}
                    title={rental.returnDriverId ? "Rota Definida (Alterar)" : "Planejar Rota de Devolução"}
                >
                    <Truck size={16} className="transform scale-x-[-1]" />
                </button>
            )}

            {/* 5. Return (Mark as Devolvido) */}
            {canReturn && (
                <button
                    onClick={() => handleStatusChange('COMPLETED')}
                    disabled={loading}
                    className="p-1.5 text-teal-600 hover:bg-teal-50 rounded-md transition-colors"
                    title="Marcar como Devolvido"
                >
                    <RotateCcw size={16} />
                </button>
            )}

            {/* 6. Occurrences */}
            <button
                onClick={() => setModalType('OCCURRENCE')}
                className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                title="Registrar Ocorrência"
            >
                <AlertTriangle size={16} />
            </button>

            {/* 7. Cancel Rental */}
            {rental.status !== 'CANCELLED' && rental.status !== 'COMPLETED' && (
                <button
                    onClick={() => setShowCancelModal(true)}
                    className="p-1.5 text-gray-500 hover:bg-gray-100 hover:text-red-600 rounded-md transition-colors"
                    title="Cancelar Locação"
                >
                    <XCircle size={16} />
                </button>
            )}


            {/* Modals */}
            <RentalOccurrenceModal
                rentalId={rental.id}
                isOpen={modalType === 'OCCURRENCE'}
                onClose={() => setModalType('NONE')}
            />

            <RentalDriverModal
                rentalId={rental.id}
                role={modalType === 'DELIVERY' ? 'DELIVERY' : 'RETURN'}
                isOpen={modalType === 'DELIVERY' || modalType === 'RETURN'}
                onClose={() => setModalType('NONE')}
                currentDriverId={modalType === 'DELIVERY' ? rental.deliveryDriverId : rental.returnDriverId}
            />

            {/* Cancel Modal */}
            {showCancelModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-bold mb-2 text-gray-900">Cancelar Locação</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Tem certeza que deseja cancelar esta locação? Esta ação não pode ser desfeita.
                        </p>

                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Motivo do cancelamento (opcional)
                        </label>
                        <textarea
                            className="w-full border border-gray-300 rounded-lg p-2 text-sm mb-4 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                            rows={3}
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            placeholder="Ex: Cliente desistiu, mudança de planos..."
                        />

                        <div className="flex gap-3">
                            <button
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                onClick={() => {
                                    setShowCancelModal(false)
                                    setCancelReason('')
                                }}
                                disabled={loading}
                            >
                                Voltar
                            </button>
                            <button
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                                onClick={handleCancelRental}
                                disabled={loading}
                            >
                                {loading ? 'Cancelando...' : 'Confirmar Cancelamento'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}
