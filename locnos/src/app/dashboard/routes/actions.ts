'use server'

import { RouteService, CreateRouteInput } from '@/lib/routes/service'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'

export async function getRouteData(dateString?: string) {
    const date = dateString ? new Date(dateString) : new Date()

    // Adjust for timezone if needed, or stick to UTC/Server time
    // For simplicity, using the date object directly for now

    const routes = await RouteService.getRoutesByDate(date)
    const availableJobs = await RouteService.getAvailableJobs(date)
    const drivers = await prisma.user.findMany({
        // where: { role: 'DRIVER' }, // Uncomment when roles are strict
        orderBy: { name: 'asc' }
    })

    return {
        routes,
        availableJobs,
        drivers
    }
}

export async function getRouteDetails(id: string) {
    const route = await prisma.route.findUnique({
        where: { id },
        include: {
            driver: true,
            stops: {
                orderBy: { sequence: 'asc' },
                include: {
                    rental: {
                        include: { person: true }
                    }
                }
            }
        }
    })
    return route
}

export async function createRoute(data: { vehicleId?: string, driverId: string, date: Date, stops: { rentalId: string, type: 'DELIVERY' | 'RETURN', sequence: number }[] }) {
    try {
        await RouteService.createRoute({
            date: data.date,
            driverId: data.driverId,
            stops: data.stops
        })
        revalidatePath('/dashboard/routes')
        return { success: true }
    } catch (error: any) {
        console.error('Create Route Error:', error)
        return { success: false, error: error.message }
    }
}

export async function updateRouteStatus(id: string, status: string) {
    try {
        await prisma.route.update({
            where: { id },
            data: { status }
        })
        revalidatePath('/dashboard/routes')
        return { success: true }
    } catch (error) {
        return { success: false, error: 'Erro ao atualizar status' }
    }
}

export async function deleteRoute(id: string) {
    try {
        await prisma.route.delete({ where: { id } })
        revalidatePath('/dashboard/routes')
        return { success: true }
    } catch (error) {
        return { success: false, error: 'Erro ao excluir rota' }
    }
}

export async function removeStopFromRoute(stopId: string) {
    try {
        const stop = await prisma.routeStop.findUnique({ where: { id: stopId } })
        if (!stop) throw new Error('Parada não encontrada')

        await prisma.$transaction(async (tx) => {
            // 1. Reset Rental statuses if needed (back to SCHEDULED/ACTIVE pool)
            if (stop.status !== 'COMPLETED') {
                if (stop.type === 'DELIVERY') {
                    await tx.rental.update({
                        where: { id: stop.rentalId },
                        data: { deliveryDriverId: null, status: 'SCHEDULED' } // Explicitly reset status
                    })
                } else {
                    await tx.rental.update({
                        where: { id: stop.rentalId },
                        data: { returnDriverId: null, status: 'ACTIVE' } // Explicitly reset status
                    })
                }
            }

            // 2. Delete Stop
            await tx.routeStop.delete({ where: { id: stopId } })
        })

        revalidatePath('/dashboard/routes')
        revalidatePath('/dashboard/routes/[id]', 'page')
        return { success: true }
    } catch (error) {
        return { success: false, error: 'Erro ao remover parada' }
    }
}
