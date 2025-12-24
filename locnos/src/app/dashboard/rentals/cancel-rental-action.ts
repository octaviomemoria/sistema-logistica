'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'

export async function cancelRental(rentalId: string, reason?: string) {
    try {
        // Check if rental can be cancelled
        const rental = await prisma.rental.findUnique({
            where: { id: rentalId }
        })

        if (!rental) {
            return { success: false, error: 'Locação não encontrada' }
        }

        if (rental.status === 'CANCELLED') {
            return { success: false, error: 'Locação já está cancelada' }
        }

        if (rental.status === 'COMPLETED') {
            return { success: false, error: 'Não é possível cancelar locação concluída' }
        }

        // Update rental to cancelled
        const updatedRental = await prisma.rental.update({
            where: { id: rentalId },
            data: {
                status: 'CANCELLED',
                cancellationReason: reason || 'Cliente desistiu',
                cancelledAt: new Date()
            }
        })

        revalidatePath('/dashboard/rentals')
        revalidatePath(`/dashboard/rentals/${rentalId}`)

        return { success: true, rental: updatedRental }
    } catch (error) {
        console.error('Error canceling rental:', error)
        return { success: false, error: 'Erro ao cancelar locação' }
    }
}
