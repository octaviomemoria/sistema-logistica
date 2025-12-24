import { prisma } from '@/lib/prisma'
import { Route, RouteStop } from '@prisma/client'

export interface CreateRouteInput {
    date: Date
    driverId: string
    stops: {
        rentalId: string
        type: 'DELIVERY' | 'RETURN'
        sequence: number
    }[]
}

export class RouteService {
    static async getAvailableJobs(date: Date) {
        // Find rentals starting on this date (Deliveries)
        const deliveries = await prisma.rental.findMany({
            where: {
                startDate: {
                    gte: new Date(date.setHours(0, 0, 0, 0)),
                    lt: new Date(date.setHours(23, 59, 59, 999))
                },
                status: 'SCHEDULED', // Or APPROVED/CONFIRMED depending on flow
                deliveryDriverId: null // Not yet assigned
            },
            include: { person: true }
        })

        // Find rentals ending on this date (Returns)
        const returns = await prisma.rental.findMany({
            where: {
                endDate: {
                    gte: new Date(date.setHours(0, 0, 0, 0)),
                    lt: new Date(date.setHours(23, 59, 59, 999))
                },
                status: 'ACTIVE',
                returnDriverId: null // Not yet assigned
            },
            include: { person: true }
        })

        return { deliveries, returns }
    }

    static async createRoute(data: CreateRouteInput) {
        return await prisma.$transaction(async (tx) => {
            // Create Route
            const route = await tx.route.create({
                data: {
                    date: data.date,
                    driverId: data.driverId,
                    status: 'DRAFT',
                    stops: {
                        create: data.stops.map(stop => ({
                            rentalId: stop.rentalId,
                            type: stop.type,
                            sequence: stop.sequence,
                            status: 'PENDING'
                        }))
                    }
                },
                include: { stops: true }
            })

            // Update Rentals with Driver ID
            for (const stop of data.stops) {
                const field = stop.type === 'DELIVERY' ? 'deliveryDriverId' : 'returnDriverId'
                await tx.rental.update({
                    where: { id: stop.rentalId },
                    data: { [field]: data.driverId }
                })
            }

            return route
        })
    }

    static async getRoutesByDate(date: Date) {
        return await prisma.route.findMany({
            where: {
                date: {
                    gte: new Date(date.setHours(0, 0, 0, 0)),
                    lt: new Date(date.setHours(23, 59, 59, 999))
                }
            },
            include: {
                driver: true,
                stops: {
                    include: {
                        rental: {
                            include: { person: true }
                        }
                    },
                    orderBy: { sequence: 'asc' }
                }
            }
        })
    }
}
