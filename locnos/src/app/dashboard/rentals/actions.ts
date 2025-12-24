'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { RentalService } from '@/lib/rentals/service'
import { RentalStatus, PaymentStatus, RentalType } from '@prisma/client'
import { EmailService } from '@/lib/email/service'
import { EmailTemplates } from '@/lib/email/templates'

// Types
export interface RentalItemInput {
    equipmentId: string
    quantity: number
    unitPrice: number
    depositValue?: number
}

export interface RentalInput {
    personId: string
    startDate: Date
    endDate: Date
    status?: string // Default DRAFT
    type?: 'DAILY' | 'MONTHLY'
    items: RentalItemInput[]
    discount?: number
    deliveryFee?: number
    returnFee?: number
    securityDeposit?: number
    amountPaid?: number
    paymentMethod?: string
    deliveryAddress?: string
    deliveryDriverId?: string
    returnDriverId?: string
}

export interface RentalFilters {
    type?: 'ALL' | 'DAILY' | 'MONTHLY'
    status?: string
    search?: string
    startDate?: string
    endDate?: string
}

export async function getDrivers() {
    try {
        const drivers = await prisma.user.findMany({
            // where: { role: 'DRIVER' },
            orderBy: { name: 'asc' }
        })
        return { success: true, drivers }
    } catch (error) {
        return { success: false, drivers: [] }
    }
}

export async function createRental(data: RentalInput) {
    try {
        // 1. Stock Validation
        const stockCheck = await RentalService.validateStock(
            data.items.map(i => ({ equipmentId: i.equipmentId, quantity: i.quantity })),
            data.startDate,
            data.endDate
        )

        if (!stockCheck.available && data.status !== 'DRAFT') {
            const names = stockCheck.blockingItems.map(i => `${i.name} (Disp: ${i.available})`).join(', ')
            return { success: false, error: `Estoque insuficiente: ${names}` }
        }

        // 2. Calculations
        const calculations = RentalService.calculateTotals({
            items: data.items,
            startDate: data.startDate,
            endDate: data.endDate,
            discount: data.discount,
            deliveryFee: data.deliveryFee,
            returnFee: data.returnFee
        })

        const statusEnum = (data.status as RentalStatus) || 'DRAFT'
        const typeEnum = (data.type as RentalType) || 'DAILY'

        const rental = await prisma.$transaction(async (tx) => {
            const newRental = await tx.rental.create({
                data: {
                    personId: data.personId,
                    startDate: data.startDate,
                    endDate: data.endDate,
                    durationDays: calculations.duration,
                    status: statusEnum,
                    type: typeEnum,
                    paymentStatus: 'PENDING',
                    discount: data.discount || 0,
                    deliveryFee: data.deliveryFee || 0,
                    returnFee: data.returnFee || 0,
                    securityDeposit: data.securityDeposit || 0,
                    amountPaid: data.amountPaid || 0,
                    deliveryAddress: data.deliveryAddress,
                    deliveryDriverId: data.deliveryDriverId,
                    returnDriverId: data.returnDriverId,
                    totalAmount: calculations.finalTotal,
                    totalItems: calculations.itemsTotal,
                    items: {
                        create: data.items.map(item => ({
                            equipmentId: item.equipmentId,
                            quantity: item.quantity,
                            unitPrice: item.unitPrice,
                            totalPrice: item.unitPrice * item.quantity,
                            depositValue: item.depositValue || 0
                        }))
                    }
                },
                include: { person: true, items: { include: { equipment: true } } }
            })

            // 4. Update Stock Counters if Active
            if (statusEnum === 'ACTIVE' || statusEnum === 'LATE') {
                for (const item of data.items) {
                    await tx.equipment.update({
                        where: { id: item.equipmentId },
                        data: { rentedQty: { increment: item.quantity } }
                    })
                }
            }

            return newRental
        })

        revalidatePath('/dashboard/rentals')

        // Send Notification
        if (rental.person.email) {
            const equipmentList = rental.items.map((i: any) => `${i.equipment.name} (${i.quantity}x)`)
            await EmailService.send({
                to: rental.person.email,
                subject: `Nova Locação #${rental.id.slice(0, 8)} - Locnos`,
                html: EmailTemplates.rentalCreated(rental.id, rental.person.name, equipmentList)
            })
        }

        return { success: true, rental, rentalId: rental.id }

    } catch (error: any) {
        console.error('Create Rental Error:', error)
        return { success: false, error: error.message }
    }
}

export async function getRentals(filters?: RentalFilters) {
    try {
        const where: any = {}

        if (filters) {
            // Type Filter
            if (filters.type && filters.type !== 'ALL') {
                where.type = filters.type
            }

            // Status Filter
            if (filters.status) {
                if (filters.status === 'active_only') {
                    where.status = { notIn: ['COMPLETED', 'CANCELLED'] }
                } else if (filters.status !== '') {
                    where.status = filters.status
                }
            }

            // Search
            if (filters.search) {
                where.person = {
                    OR: [
                        { name: { contains: filters.search, mode: 'insensitive' } },
                        { document: { contains: filters.search } },
                        { phone: { contains: filters.search } }
                    ]
                }
            }

            // Date Range (Start Date)
            if (filters.startDate) {
                where.startDate = { gte: new Date(filters.startDate) }
            }
        }

        const rentals = await prisma.rental.findMany({
            where,
            include: { person: true, items: true },
            orderBy: { createdAt: 'desc' }
        })
        return { success: true, rentals }
    } catch (error) {
        console.error('Get Rentals Error:', error)
        return { success: false, error: 'Failed to fetch rentals' }
    }
}

export async function getRentalById(id: string) {
    try {
        const rental = await prisma.rental.findUnique({
            where: { id },
            include: { items: true, person: true }
        })
        return { success: true, rental }
    } catch (error) {
        return { success: false, error: 'Rental not found' }
    }
}

export async function updateRental(id: string, data: RentalInput) {
    try {
        const existing = await prisma.rental.findUnique({
            where: { id },
            include: { items: true }
        })

        if (!existing) return { success: false, error: 'Rental not found' }

        const calculations = RentalService.calculateTotals({
            items: data.items,
            startDate: data.startDate,
            endDate: data.endDate,
            discount: data.discount,
            deliveryFee: data.deliveryFee,
            returnFee: data.returnFee
        })

        const statusEnum = (data.status as RentalStatus) || 'DRAFT'
        const typeEnum = (data.type as RentalType) || 'DAILY'

        await prisma.$transaction(async (tx) => {
            // Revert Stock if was ACTIVE
            if (existing.status === 'ACTIVE' || existing.status === 'LATE') {
                for (const item of existing.items) {
                    await tx.equipment.update({
                        where: { id: item.equipmentId },
                        data: { rentedQty: { decrement: item.quantity } }
                    })
                }
            }

            // Delete Old Items
            await tx.rentalItem.deleteMany({ where: { rentalId: id } })

            // Validate New Stock (if active)
            if (statusEnum !== 'DRAFT' && statusEnum !== 'COMPLETED' && statusEnum !== 'CANCELLED') {
                const stockCheck = await RentalService.validateStock(
                    data.items.map(i => ({ equipmentId: i.equipmentId, quantity: i.quantity })),
                    data.startDate,
                    data.endDate
                )
                if (!stockCheck.available) {
                    throw new Error(`Estoque insuficiente: ${stockCheck.blockingItems.map(i => i.name).join(', ')}`)
                }
            }

            // Update Rental
            await tx.rental.update({
                where: { id },
                data: {
                    personId: data.personId,
                    startDate: data.startDate,
                    endDate: data.endDate,
                    durationDays: calculations.duration,
                    status: statusEnum,
                    type: typeEnum,
                    discount: data.discount || 0,
                    deliveryFee: data.deliveryFee || 0,
                    returnFee: data.returnFee || 0,
                    securityDeposit: data.securityDeposit || 0,
                    amountPaid: data.amountPaid || 0,
                    deliveryAddress: data.deliveryAddress,
                    deliveryDriverId: data.deliveryDriverId,
                    returnDriverId: data.returnDriverId,
                    totalAmount: calculations.finalTotal,
                    totalItems: calculations.itemsTotal,
                    items: {
                        create: data.items.map(item => ({
                            equipmentId: item.equipmentId,
                            quantity: item.quantity,
                            unitPrice: item.unitPrice,
                            totalPrice: item.unitPrice * item.quantity,
                            depositValue: item.depositValue || 0
                        }))
                    }
                }
            })

            // Apply New Stock if Active
            if (statusEnum === 'ACTIVE' || statusEnum === 'LATE') {
                for (const item of data.items) {
                    await tx.equipment.update({
                        where: { id: item.equipmentId },
                        data: { rentedQty: { increment: item.quantity } }
                    })
                }
            }
        })

        revalidatePath('/dashboard/rentals')
        return { success: true }
    } catch (error: any) {
        console.error('Update Rental Error:', error)
        return { success: false, error: error.message }
    }
}

export async function updateRentalStatus(id: string, newStatus: string) {
    try {
        const rental = await prisma.rental.findUnique({
            where: { id },
            include: { person: true, items: { include: { equipment: true } } }
        })
        if (!rental) throw new Error('Locação não encontrada')

        await prisma.$transaction(async (tx) => {
            const wasActive = rental.status === 'ACTIVE' || rental.status === 'LATE'
            const becomingActive = newStatus === 'ACTIVE' || newStatus === 'LATE'

            // 1. Starting Rental (Stock OUT) or Reverting Completion (Stock OUT)
            if (!wasActive && becomingActive) {
                // Validate Stock
                const stockCheck = await RentalService.validateStock(
                    rental.items.map(i => ({ equipmentId: i.equipmentId, quantity: i.quantity })),
                    rental.startDate,
                    rental.endDate
                )
                if (!stockCheck.available) {
                    throw new Error(`Estoque insuficiente: ${stockCheck.blockingItems.map(i => i.name).join(', ')}`)
                }

                // Decrement Stock
                for (const item of rental.items) {
                    await tx.equipment.update({
                        where: { id: item.equipmentId },
                        data: { rentedQty: { increment: item.quantity } }
                    })
                }
            }

            // 2. Ending Rental (Stock IN) or Reverting Start (Stock IN)
            if (wasActive && !becomingActive) {
                // Increment Stock (Return to Shelf)
                for (const item of rental.items) {
                    await tx.equipment.update({
                        where: { id: item.equipmentId },
                        data: { rentedQty: { decrement: item.quantity } }
                    })
                }
            }

            // 3. Update Status
            await tx.rental.update({
                where: { id },
                data: { status: newStatus as RentalStatus }
            })
        })

        if (rental.person.email) {
            await EmailService.send({
                to: rental.person.email,
                subject: `Atualização de Status #${id.slice(0, 8)}`,
                html: EmailTemplates.statusChanged(id, rental.person.name, newStatus)
            })
        }

        revalidatePath('/dashboard/rentals')
        return { success: true }
    } catch (error: any) {
        console.error('Update Status Error:', error)
        return { success: false, error: error.message }
    }
}

export async function addOccurrence(rentalId: string, data: { title: string, description: string, type: string, cost: number }) {
    try {
        await prisma.rentalOccurrence.create({
            data: {
                rentalId,
                title: data.title,
                description: data.description,
                type: data.type,
                cost: data.cost
            }
        })
        revalidatePath('/dashboard/rentals')
        return { success: true }
    } catch (error: any) {
        return { success: false, error: 'Erro ao registrar ocorrência' }
    }
}

export async function updateRentalDriver(rentalId: string, role: 'DELIVERY' | 'RETURN', driverId: string) {
    try {
        const field = role === 'DELIVERY' ? 'deliveryDriverId' : 'returnDriverId'
        await prisma.rental.update({
            where: { id: rentalId },
            data: { [field]: driverId }
        })
        revalidatePath('/dashboard/rentals')
        return { success: true }
    } catch (error: any) {
        return { success: false, error: 'Erro ao atualizar motorista' }
    }
}
