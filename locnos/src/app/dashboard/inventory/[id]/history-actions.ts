'use server'

import { prisma } from '@/lib/prisma'

export async function getEquipmentHistory(id: string) {
    try {
        const equipment = await prisma.equipment.findUnique({
            where: { id }
        })

        if (!equipment) return { success: false, error: 'Equipment not found' }

        const history = await prisma.rentalItem.findMany({
            where: { equipmentId: id },
            include: {
                rental: {
                    include: { customer: true }
                }
            },
            orderBy: {
                rental: { createdAt: 'desc' }
            }
        })

        return { success: true, equipment, history }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}
