'use server'

import { prisma } from '@/lib/prisma'

export async function getPersonRentals(personId: string) {
    try {
        const rentals = await prisma.rental.findMany({
            where: { personId },
            include: {
                items: {
                    include: { equipment: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        })
        return { success: true, rentals }
    } catch (error) {
        console.error('Failed to fetch person rentals:', error)
        return { success: false, error: 'Failed to fetch person rentals' }
    }
}
