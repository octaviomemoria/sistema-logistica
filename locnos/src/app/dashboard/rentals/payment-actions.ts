'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { MovementsService } from '@/lib/financial/movements.service'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export interface PaymentInput {
    rentalId: string
    amount: number
    paymentMethod: string
    paymentDate: Date
    notes?: string
}

export async function addPayment(data: PaymentInput) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.tenantId) {
            return { success: false, error: 'Sessão inválida' }
        }
        const tenantId = session.user.tenantId

        // Validate input
        if (!data.rentalId || !data.amount || !data.paymentMethod) {
            return { success: false, error: 'Dados obrigatórios faltando' }
        }

        if (data.amount <= 0) {
            return { success: false, error: 'Valor deve ser maior que zero' }
        }

        const result = await prisma.$transaction(async (tx) => {
            // 1. Find Financial Title for this Rental
            const title = await tx.financialTitle.findFirst({
                where: {
                    rentalId: data.rentalId,
                    tenantId: tenantId
                }
            })

            // 2. Find Bank Account (Default to first)
            const bankAccount = await tx.bankAccount.findFirst({
                where: { tenantId }
            })

            if (title && bankAccount) {
                // Use Financial Service with SAME transaction
                await MovementsService.registerPayment({
                    tenantId,
                    bankAccountId: bankAccount.id,
                    titleId: title.id,
                    amount: data.amount,
                    date: data.paymentDate,
                    type: 'INCOME', // Receipt
                    description: `Pagamento Locação - ${data.notes || ''}`
                }, tx) // Pass tx here!
            }

            // 3. Create Rental Payment Record
            const payment = await tx.payment.create({
                data: {
                    rentalId: data.rentalId,
                    amount: data.amount,
                    paymentMethod: data.paymentMethod,
                    paymentDate: data.paymentDate,
                    notes: data.notes || null
                }
            })

            // Get all payments for this rental to recalculate total
            const allPayments = await tx.payment.findMany({
                where: { rentalId: data.rentalId }
            })

            const totalPaid = allPayments.reduce((sum: number, p: any) => sum + p.amount, 0)

            // Get rental to check total amount and end date
            const rental = await tx.rental.findUnique({
                where: { id: data.rentalId }
            })

            if (!rental) {
                throw new Error('Locação não encontrada')
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
            await tx.rental.update({
                where: { id: data.rentalId },
                data: {
                    amountPaid: totalPaid,
                    paymentStatus: paymentStatus
                }
            })

            return payment
        })

        revalidatePath('/dashboard/rentals')
        revalidatePath(`/dashboard/rentals/${data.rentalId}`)

        return { success: true, payment: result }
    } catch (error: any) {
        console.error('Error adding payment:', error)
        // Return friendly message if possible
        return { success: false, error: error.message || 'Erro ao registrar pagamento' }
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
        const session = await getServerSession(authOptions)
        if (!session?.user?.tenantId) {
            return { success: false, error: 'Sessão inválida' }
        }
        const tenantId = session.user.tenantId

        // Get payment to know which rental to update
        const payment = await prisma.payment.findUnique({
            where: { id: paymentId }
        })

        if (!payment) {
            return { success: false, error: 'Pagamento não encontrado' }
        }

        const rentalId = payment.rentalId

        await prisma.$transaction(async (tx) => {
            // 1. Try to find Financial Movement to Revert
            // We don't have a direct link, so we search by Title + Amount + Date
            const title = await tx.financialTitle.findFirst({
                where: { rentalId, tenantId }
            })

            if (title) {
                // Find matching movement
                const movement = await tx.financialMovement.findFirst({
                    where: {
                        titleId: title.id,
                        amount: payment.amount,
                        date: payment.paymentDate,
                        type: 'INCOME',
                        tenantId
                    }
                })

                if (movement) {
                    await MovementsService.revertPayment(movement.id, tx)
                }
            }

            // 2. Delete payment
            await tx.payment.delete({
                where: { id: paymentId }
            })

            // 3. Recalculate total paid for this rental
            const remainingPayments = await tx.payment.findMany({
                where: { rentalId }
            })

            const totalPaid = remainingPayments.reduce((sum: number, p: any) => sum + p.amount, 0)

            // Get rental
            const rental = await tx.rental.findUnique({
                where: { id: rentalId }
            })

            if (!rental) {
                throw new Error('Locação não encontrada')
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
            await tx.rental.update({
                where: { id: rentalId },
                data: {
                    amountPaid: totalPaid,
                    paymentStatus: paymentStatus
                }
            })
        })

        revalidatePath('/dashboard/rentals')
        revalidatePath(`/dashboard/rentals/${rentalId}`)

        return { success: true }
    } catch (error) {
        console.error('Error deleting payment:', error)
        return { success: false, error: 'Erro ao excluir pagamento' }
    }
}
