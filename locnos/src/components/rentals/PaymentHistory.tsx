'use client'

import { useState, useEffect } from 'react'
import { Trash2, DollarSign, TrendingUp, Printer } from 'lucide-react'
import { getPaymentsByRental, deletePayment } from '../../app/dashboard/rentals/payment-actions'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import type { LocalPayment } from './RentalForm'

interface PaymentHistoryProps {
    rentalId?: string  // Optional for new rentals
    totalAmount: number
    localPayments?: LocalPayment[]  // For new rentals before save
    onDeleteLocal?: (id: string) => void  // Delete local payment
    refreshKey?: number  // Force re-render
}

interface Payment {
    id: string
    amount: number
    paymentMethod: string
    paymentDate: Date
    notes?: string | null
    createdAt: Date
}

const PAYMENT_METHODS: Record<string, string> = {
    'DINHEIRO': 'Dinheiro',
    'PIX': 'Pix',
    'BOLETO': 'Boleto',
    'DEBITO': 'Débito',
    'CREDITO_1X': 'Crédito 1x',
    'CREDITO_2X': 'Crédito 2x',
    'CREDITO_3X': 'Crédito 3x',
    'CREDITO_4X': 'Crédito 4x',
    'CREDITO_5X': 'Crédito 5x',
    'CREDITO_6X': 'Crédito 6x',
    'CREDITO_7X': 'Crédito 7x',
    'CREDITO_8X': 'Crédito 8x',
    'CREDITO_9X': 'Crédito 9x',
    'CREDITO_10X': 'Crédito 10x',
    'CREDITO_11X': 'Crédito 11x',
    'CREDITO_12X': 'Crédito 12x',
    'PROMISSORIA': 'Promissória'
}

export default function PaymentHistory({ rentalId, totalAmount, localPayments, onDeleteLocal, refreshKey }: PaymentHistoryProps) {
    const router = useRouter()
    const { showToast } = useToast()
    const [payments, setPayments] = useState<Payment[]>([])
    const [loading, setLoading] = useState(true)

    // Use local payments if provided, otherwise load from DB
    const isLocalMode = !rentalId && localPayments
    const displayPayments = isLocalMode ? localPayments : payments

    useEffect(() => {
        if (rentalId) {
            loadPayments()
        } else {
            setLoading(false)
        }
    }, [rentalId, refreshKey])

    const loadPayments = async () => {
        if (!rentalId) return

        setLoading(true)
        const result = await getPaymentsByRental(rentalId)
        if (result.success && result.payments) {
            setPayments(result.payments)
        }
        setLoading(false)
    }

    const handleDelete = async (paymentId: string) => {
        if (!confirm('Deseja realmente excluir este pagamento?')) return

        if (isLocalMode && onDeleteLocal) {
            // Delete local payment
            onDeleteLocal(paymentId)
        } else {
            // Delete from DB
            const result = await deletePayment(paymentId)
            if (result.success) {
                showToast('success', 'Pagamento excluído')
                loadPayments()
                router.refresh()
            } else {
                showToast('error', result.error || 'Erro ao excluir pagamento')
            }
        }
    }

    const totalPaid = (displayPayments || []).reduce((sum: number, p: any) => sum + p.amount, 0)
    const remaining = totalAmount - totalPaid
    const progress = totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0

    if (loading) {
        return <div className="p-4 text-center text-gray-500">Carregando pagamentos...</div>
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2 border-b pb-2">
                <DollarSign className="text-green-600" size={20} />
                <h3 className="font-bold text-lg">Histórico de Pagamentos</h3>
            </div>

            {/* Progress Bar */}
            <div className="bg-gray-100 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Progresso de Pagamento</span>
                    <span className="text-sm font-bold text-gray-800">{progress.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-300 rounded-full h-3">
                    <div
                        className={`h-3 rounded-full transition-all ${progress >= 100 ? 'bg-green-500' : progress >= 50 ? 'bg-blue-500' : 'bg-yellow-500'
                            }`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                    ></div>
                </div>
                <div className="flex justify-between mt-2">
                    <div className="text-center">
                        <p className="text-xs text-gray-500">Pago</p>
                        <p className="text-sm font-bold text-green-600">R$ {totalPaid.toFixed(2)}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xs text-gray-500">Total</p>
                        <p className="text-sm font-bold text-gray-800">R$ {totalAmount.toFixed(2)}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xs text-gray-500">Restante</p>
                        <p className={`text-sm font-bold ${remaining > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            R$ {remaining.toFixed(2)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Payments List */}
            {(!displayPayments || displayPayments.length === 0) ? (
                <div className="text-center py-8 text-gray-400">
                    <TrendingUp size={48} className="mx-auto mb-2 opacity-20" />
                    <p>Nenhum pagamento registrado</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-600 font-medium text-xs uppercase">
                            <tr>
                                <th className="px-4 py-2 text-left">Data</th>
                                <th className="px-4 py-2 text-right">Valor</th>
                                <th className="px-4 py-2 text-left">Forma de Pagamento</th>
                                <th className="px-4 py-2 text-left">Observações</th>
                                <th className="px-4 py-2 text-center w-16">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {displayPayments.map((payment: any) => (
                                <tr key={payment.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        {new Date(payment.paymentDate).toLocaleDateString('pt-BR')}
                                    </td>
                                    <td className="px-4 py-3 text-right font-bold text-green-600">
                                        R$ {payment.amount.toFixed(2)}
                                    </td>
                                    <td className="px-4 py-3">
                                        {PAYMENT_METHODS[payment.paymentMethod] || payment.paymentMethod}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600 text-xs">
                                        {payment.notes || '-'}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <a
                                            href={`/print/receipts/${payment.id}`}
                                            target="_blank"
                                            className="text-gray-400 hover:text-blue-600 transition-colors mr-2 inline-block"
                                            title="Imprimir Recibo"
                                        >
                                            <Printer size={16} />
                                        </a>
                                        <button
                                            onClick={() => handleDelete(payment.id)}
                                            className="text-gray-400 hover:text-red-500 transition-colors"
                                            title="Excluir pagamento"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
