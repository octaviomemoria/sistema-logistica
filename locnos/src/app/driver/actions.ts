'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { RouteStop } from '@prisma/client'

// Since we don't have real auth for driver context yet, we'll fetch the first active route for today
// In a real app, we would use currentUser.id
export async function getDriverRoute() {
    const today = new Date()

    // Find a route for today that is CONFIRMED or IN_PROGRESS
    const route = await prisma.route.findFirst({
        where: {
            date: {
                gte: new Date(today.setHours(0, 0, 0, 0)),
                lt: new Date(today.setHours(23, 59, 59, 999))
            },
            status: { in: ['CONFIRMED', 'IN_PROGRESS'] }
        },
        include: {
            stops: {
                orderBy: { sequence: 'asc' },
                include: {
                    rental: {
                        include: { person: true }
                    }
                }
            },
            driver: true
        }
    })

    return { route }
}

export async function completeStop(stopId: string, podData: { signature?: string, receiverName?: string }) {
    try {
        const stop = await prisma.routeStop.findUnique({ where: { id: stopId } })
        if (!stop) throw new Error('Parada não encontrada')

        await prisma.$transaction(async (tx) => {
            // 1. Mark Stop as Completed with PoD
            await tx.routeStop.update({
                where: { id: stopId },
                data: {
                    status: 'COMPLETED',
                    completedAt: new Date(),
                    signature: podData.signature,
                    receiverName: podData.receiverName
                }
            })

            // 2. Update Rental Status if needed
            if (stop.type === 'DELIVERY') {
                // Determine if we should set to ACTIVE
                await tx.rental.update({
                    where: { id: stop.rentalId },
                    data: { status: 'ACTIVE' }
                })
            } else if (stop.type === 'RETURN') {
                await tx.rental.update({
                    where: { id: stop.rentalId },
                    data: { status: 'COMPLETED' }
                })
            }
        })

        revalidatePath('/driver')
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}
