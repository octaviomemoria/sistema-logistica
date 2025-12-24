'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { addPayment } from '../../app/dashboard/rentals/payment-actions'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import type { LocalPayment } from './RentalForm'

interface PaymentRegistrationProps {
    rentalId?: string  // Optional for new rentals
    onSuccess?: () => void
    onAddLocal?: (payment: LocalPayment) => void  // For new rentals
}

const PAYMENT_METHODS = [
    { value: 'DINHEIRO', label: 'Dinheiro' },
    { value: 'PIX', label: 'Pix' },
    { value: 'BOLETO', label: 'Boleto' },
    { value: 'DEBITO', label: 'Cartão de Débito' },
    { value: 'CREDITO_1X', label: 'Cartão de Crédito 1x' },
    { value: 'CREDITO_2X', label: 'Cartão de Crédito 2x' },
    { value: 'CREDITO_3X', label: 'Cartão de Crédito 3x' },
    { value: 'CREDITO_4X', label: 'Cartão de Crédito 4x' },
    { value: 'CREDITO_5X', label: 'Cartão de Crédito 5x' },
    { value: 'CREDITO_6X', label: 'Cartão de Crédito 6x' },
    { value: 'CREDITO_7X', label: 'Cartão de Crédito 7x' },
    { value: 'CREDITO_8X', label: 'Cartão de Crédito 8x' },
    { value: 'CREDITO_9X', label: 'Cartão de Crédito 9x' },
    { value: 'CREDITO_10X', label: 'Cartão de Crédito 10x' },
    { value: 'CREDITO_11X', label: 'Cartão de Crédito 11x' },
    { value: 'CREDITO_12X', label: 'Cartão de Crédito 12x' },
    { value: 'PROMISSORIA', label: 'Promissória' }
]

export default function PaymentRegistration({ rentalId, onSuccess, onAddLocal }: PaymentRegistrationProps) {
    const router = useRouter()
    const { showToast } = useToast()
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    // Form state
    const [amount, setAmount] = useState<string>('')
    const [paymentMethod, setPaymentMethod] = useState('')
    const [paymentDate, setPaymentDate] = useState(() => {
        const today = new Date()
        today.setMinutes(today.getMinutes() - today.getTimezoneOffset())
        return today.toISOString().slice(0, 16)
    })
    const [notes, setNotes] = useState('')

    const resetForm = () => {
        setAmount('')
        setPaymentMethod('')
        setNotes('')
        setPaymentDate(() => {
            const today = new Date()
            today.setMinutes(today.getMinutes() - today.getTimezoneOffset())
            return today.toISOString().slice(0, 16)
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!amount || !paymentMethod) {
            showToast('error', 'Preencha todos os campos obrigatórios')
            return
        }

        const amountNum = parseFloat(amount)
        if (isNaN(amountNum) || amountNum <= 0) {
            showToast('error', 'Valor deve ser maior que zero')
            return
        }

        // Local mode - add to parent state
        if (!rentalId && onAddLocal) {
            onAddLocal({
                id: crypto.randomUUID(),
                amount: amountNum,
                paymentMethod,
                paymentDate: new Date(paymentDate),
                notes: notes || undefined
            })
            resetForm()
            setIsOpen(false)
            return
        }

        // DB mode - save to database
        if (!rentalId) {
            showToast('error', 'ID da locação não encontrado')
            return
        }

        setLoading(true)

        const result = await addPayment({
            rentalId,
            amount: amountNum,
            paymentMethod,
            paymentDate: new Date(paymentDate),
            notes: notes || undefined
        })

        setLoading(false)

        if (result.success) {
            showToast('success', 'Pagamento registrado com sucesso!')
            resetForm()
            setIsOpen(false)

            if (onSuccess) onSuccess()
            
            // Force full page reload to update rental list
            setTimeout(() => {
                window.location.reload()
            }, 500)
        } else {
            showToast('error', result.error || 'Erro ao registrar pagamento')
        }
    }

    if (!isOpen) {
        return (
            <div className="mt-4">
                <button
                    onClick={() => setIsOpen(true)}
                    className="w-full btn-primary flex items-center justify-center gap-2 py-3"
                >
                    <Plus size={18} />
                    Registrar Novo Pagamento
                </button>
            </div>
        )
    }

    return (
        <div className="mt-4 bg-blue-50 border-2 border-blue-200 rounded-lg p-5">
            <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-lg text-blue-900">Registrar Pagamento</h4>
                <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-gray-600"
                >
                    <X size={20} />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Amount */}
                    <div>
                        <label className="label">Valor * (R$)</label>
                        <input
                            type="number"
                            step="0.01"
                            className="input"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            placeholder="0.00"
                            required
                        />
                    </div>

                    {/* Payment Method */}
                    <div>
                        <label className="label">Forma de Pagamento *</label>
                        <select
                            className="input"
                            value={paymentMethod}
                            onChange={e => setPaymentMethod(e.target.value)}
                            required
                        >
                            <option value="">Selecione...</option>
                            {PAYMENT_METHODS.map(method => (
                                <option key={method.value} value={method.value}>
                                    {method.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Payment Date */}
                <div>
                    <label className="label">Data do Pagamento</label>
                    <input
                        type="datetime-local"
                        className="input"
                        value={paymentDate}
                        onChange={e => setPaymentDate(e.target.value)}
                    />
                </div>

                {/* Notes */}
                <div>
                    <label className="label">Observações</label>
                    <textarea
                        className="input"
                        rows={2}
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder="Informações adicionais sobre o pagamento..."
                    />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                    <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="flex-1 btn-secondary"
                        disabled={loading}
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="flex-1 btn-primary"
                        disabled={loading}
                    >
                        {loading ? 'Registrando...' : 'Registrar Pagamento'}
                    </button>
                </div>
            </form>
        </div>
    )
}
