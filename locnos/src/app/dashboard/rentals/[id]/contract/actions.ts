'use server'

import { prisma } from '@/lib/prisma'

export async function getRentalForContract(rentalId: string) {
    try {
        const rental = await prisma.rental.findUnique({
            where: { id: rentalId },
            include: {
                customer: true,
                items: {
                    include: {
                        equipment: true
                    }
                }
            }
        })

        if (!rental) return { success: false, error: 'Rental not found' }

        const templates = await prisma.contractTemplate.findMany({
            where: { active: true },
            orderBy: { name: 'asc' }
        })

        return { success: true, rental, templates }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}
