'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export type InventoryFilter = 'ALL' | 'AVAILABLE' | 'RENTED' | 'MAINTENANCE'

export interface RentalPeriod {
    description: string
    days: number
    price: number
    isDefault?: boolean
}

export interface Specification {
    key: string
    value: string
}

export interface EquipmentInput {
    name: string
    category: string
    subCategory?: string
    brand?: string
    description?: string
    purchasePrice: number
    salePrice?: number
    suggestedDeposit?: number
    replacementValue?: number
    totalQty: number
    rentedQty: number
    imageUrl?: string
    rentalPeriods: RentalPeriod[]
    specifications: Specification[]
    externalLinks: string[]
}

export async function getEquipments(filter: InventoryFilter = 'ALL', search?: string) {
    try {
        const where: any = {}

        // Filter by status
        // Note: For strict status filtering (Available/Rented), we might need complex logic
        // For now, simpler logic based on rentedQty vs totalQty
        /*
         Status Logic:
         - AVAILABLE: totalQty > rentedQty
         - RENTED: rentedQty >= totalQty (or partial?) 
         Realistically, equipment can be partially rented. 
         Let's assume "RENTED" filter shows items currently having >0 rentedQty
         "AVAILABLE" shows items having >0 available stock
         "MAINTENANCE" - we didn't add a specific maintenance column, let's skip for now or use Description tag
        */

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { brand: { contains: search, mode: 'insensitive' } },
                { category: { contains: search, mode: 'insensitive' } },
            ]
        }

        const equipments = await prisma.equipment.findMany({
            where,
            orderBy: { name: 'asc' }
        })

        // Post-processing for complex filters if needed
        let filtered = equipments
        if (filter === 'AVAILABLE') {
            filtered = equipments.filter((e: any) => e.totalQty > e.rentedQty)
        } else if (filter === 'RENTED') {
            filtered = equipments.filter((e: any) => e.rentedQty > 0)
        }

        return { success: true, equipments: filtered }
    } catch (error) {
        console.error('Failed to fetch equipment:', error)
        return { success: false, error: 'Failed to fetch equipment' }
    }
}

export async function createEquipment(data: EquipmentInput) {
    try {
        await prisma.equipment.create({
            data: {
                ...data,
                // Cast JSON arrays to any for Prisma
                rentalPeriods: data.rentalPeriods as any,
                specifications: data.specifications as any,
            }
        })

        revalidatePath('/dashboard/inventory')
        return { success: true }
    } catch (error: any) {
        console.error('Failed to create equipment:', error)
        return { success: false, error: error.message || 'Failed to create equipment' }
    }
}

export async function updateEquipment(id: string, data: EquipmentInput) {
    try {
        await prisma.equipment.update({
            where: { id },
            data: {
                ...data,
                rentalPeriods: data.rentalPeriods as any,
                specifications: data.specifications as any,
            }
        })

        revalidatePath('/dashboard/inventory')
        return { success: true }
    } catch (error: any) {
        console.error('Failed to update equipment:', error)
        return { success: false, error: error.message || 'Failed to update equipment' }
    }
}

export async function deleteEquipment(id: string) {
    try {
        await prisma.equipment.delete({
            where: { id }
        })

        revalidatePath('/dashboard/inventory')
        return { success: true }
    } catch (error: any) {
        console.error('Failed to delete equipment:', error)
        return { success: false, error: error.message || 'Failed to delete equipment' }
    }
}

export async function getDistinctCategories() {
    try {
        const categories = await prisma.equipment.findMany({
            select: { category: true },
            distinct: ['category']
        })
        return { success: true, categories: categories.map(c => c.category) }
    } catch (error) {
        return { success: false, categories: [] }
    }
}

export async function bulkImportEquipments(items: EquipmentInput[]) {
    try {
        // Create many does not support JSON relations well in all DBs, but simple types yes.
        // However, we are sending complex JSON. It's safer to loop for now or use createMany if confident.
        // Let's use transaction for safety.

        await prisma.$transaction(
            items.map(item => prisma.equipment.create({
                data: {
                    ...item,
                    rentalPeriods: item.rentalPeriods as any,
                    specifications: item.specifications as any,
                }
            }))
        )

        revalidatePath('/dashboard/inventory')
        return { success: true, count: items.length }
    } catch (error: any) {
        console.error('Bulk import failed:', error)
        return { success: false, error: error.message || 'Bulk import failed' }
    }
}
