'use server'

import { prisma } from '@/lib/prisma'

export async function getCustomerRentals(customerId: string) {
    try {
        const rentals = await prisma.rental.findMany({
            where: { customerId },
            include: {
                items: {
                    include: { equipment: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        })
        return { success: true, rentals }
    } catch (error) {
        console.error('Failed to fetch customer rentals:', error)
        return { success: false, error: 'Failed to fetch rentals' }
    }
}
