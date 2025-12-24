'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'

export interface PaymentInput {
    rentalId: string
    amount: number
    paymentMethod: string
    paymentDate: Date
    notes?: string
}

export async function addPayment(data: PaymentInput) {
    try {
        // Validate input
        if (!data.rentalId || !data.amount || !data.paymentMethod) {
            return { success: false, error: 'Dados obrigatórios faltando' }
        }

        if (data.amount <= 0) {
            return { success: false, error: 'Valor deve ser maior que zero' }
        }

        // Create payment
        const payment = await prisma.payment.create({
            data: {
                rentalId: data.rentalId,
                amount: data.amount,
                paymentMethod: data.paymentMethod,
                paymentDate: data.paymentDate,
                notes: data.notes || null
            }
        })

        // Get all payments for this rental to recalculate total
        const allPayments = await prisma.payment.findMany({
            where: { rentalId: data.rentalId }
        })

        const totalPaid = allPayments.reduce((sum: number, p: any) => sum + p.amount, 0)

        // Get rental to check total amount
        const rental = await prisma.rental.findUnique({
            where: { id: data.rentalId }
        })

        if (!rental) {
            return { success: false, error: 'Locação não encontrada' }
        }

        // Determine payment status
        let paymentStatus: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE' = 'PENDING'

        if (totalPaid >= rental.totalAmount) {
            paymentStatus = 'PAID'
        } else if (totalPaid > 0) {
            paymentStatus = 'PARTIAL'
        }

        // Check if overdue
        const now = new Date()
        if (paymentStatus !== 'PAID' && rental.endDate < now) {
            paymentStatus = 'OVERDUE'
        }

        // Update rental with new totals
        await prisma.rental.update({
            where: { id: data.rentalId },
            data: {
                amountPaid: totalPaid,
                paymentStatus: paymentStatus
            }
        })

        revalidatePath('/dashboard/rentals')
        revalidatePath(`/dashboard/rentals/${data.rentalId}`)

        return { success: true, payment }
    } catch (error) {
        console.error('Error adding payment:', error)
        return { success: false, error: 'Erro ao registrar pagamento' }
    }
}

export async function getPaymentsByRental(rentalId: string) {
    try {
        const payments = await prisma.payment.findMany({
            where: { rentalId },
            orderBy: { paymentDate: 'desc' }
        })

        return { success: true, payments }
    } catch (error) {
        console.error('Error fetching payments:', error)
        return { success: false, error: 'Erro ao buscar pagamentos', payments: [] }
    }
}

export async function deletePayment(paymentId: string) {
    try {
        // Get payment to know which rental to update
        const payment = await prisma.payment.findUnique({
            where: { id: paymentId }
        })

        if (!payment) {
            return { success: false, error: 'Pagamento não encontrado' }
        }

        const rentalId = payment.rentalId

        // Delete payment
        await prisma.payment.delete({
            where: { id: paymentId }
        })

        // Recalculate total paid for this rental
        const remainingPayments = await prisma.payment.findMany({
            where: { rentalId }
        })

        const totalPaid = remainingPayments.reduce((sum: number, p: any) => sum + p.amount, 0)

        // Get rental
        const rental = await prisma.rental.findUnique({
            where: { id: rentalId }
        })

        if (!rental) {
            return { success: false, error: 'Locação não encontrada' }
        }

        // Determine payment status
        let paymentStatus: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE' = 'PENDING'

        if (totalPaid >= rental.totalAmount) {
            paymentStatus = 'PAID'
        } else if (totalPaid > 0) {
            paymentStatus = 'PARTIAL'
        }

        // Check if overdue
        const now = new Date()
        if (paymentStatus !== 'PAID' && rental.endDate < now) {
            paymentStatus = 'OVERDUE'
        }

        // Update rental
        await prisma.rental.update({
            where: { id: rentalId },
            data: {
                amountPaid: totalPaid,
                paymentStatus: paymentStatus
            }
        })

        revalidatePath('/dashboard/rentals')
        revalidatePath(`/dashboard/rentals/${rentalId}`)

        return { success: true }
    } catch (error) {
        console.error('Error deleting payment:', error)
        return { success: false, error: 'Erro ao excluir pagamento' }
    }
}
