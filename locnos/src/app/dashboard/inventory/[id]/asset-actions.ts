'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { AssetService } from '@/lib/inventory/asset-service'

export async function getAssets(equipmentId: string, tenantId: string) {
    try {
        const assets = await prisma.asset.findMany({
            where: {
                equipmentId,
                tenantId
            },
            orderBy: { code: 'asc' }
        })

        return { success: true, assets }
    } catch (error) {
        console.error('Error fetching assets:', error)
        return { success: false, error: 'Failed to fetch assets' }
    }
}

export async function createAsset(data: {
    equipmentId: string
    tenantId: string
    code?: string
    serialNumber?: string
    condition?: string
    notes?: string
}) {
    try {
        const asset = await AssetService.createAsset(data)

        // Also increment equipment totalQty
        await prisma.equipment.update({
            where: { id: data.equipmentId },
            data: { totalQty: { increment: 1 } }
        })

        revalidatePath('/dashboard/inventory')
        return { success: true, asset }
    } catch (error) {
        console.error('Error creating asset:', error)
        return { success: false, error: 'Failed to create asset' }
    }
}

export async function updateAsset(id: string, data: {
    code?: string
    serialNumber?: string
    condition?: string
    notes?: string
    status?: string
}) {
    try {
        const asset = await prisma.asset.update({
            where: { id },
            data
        })

        revalidatePath('/dashboard/inventory')
        return { success: true, asset }
    } catch (error) {
        console.error('Error updating asset:', error)
        return { success: false, error: 'Failed to update asset' }
    }
}

export async function deleteAsset(id: string, equipmentId: string) {
    try {
        await prisma.asset.delete({ where: { id } })

        // Decrement equipment totalQty
        await prisma.equipment.update({
            where: { id: equipmentId },
            data: { totalQty: { decrement: 1 } }
        })

        revalidatePath('/dashboard/inventory')
        return { success: true }
    } catch (error) {
        console.error('Error deleting asset:', error)
        return { success: false, error: 'Failed to delete asset' }
    }
}
