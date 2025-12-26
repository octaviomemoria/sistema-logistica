import { prisma } from '@/lib/prisma'
import { InventoryMovementType } from '@prisma/client'

interface AdjustStockInput {
    equipmentId: string
    quantity: number // Can be negative
    type: InventoryMovementType
    reason?: string
    assetId?: string
    userId: string
    tenantId: string
    rentalId?: string
    maintenanceId?: string
}

export class StockService {
    /**
     * Adjusts stock for an equipment or asset.
     * This is the CENTRAL place for all stock changes.
     */
    static async adjustStock(input: AdjustStockInput) {
        const { equipmentId, quantity, type, reason, assetId, userId, tenantId, rentalId, maintenanceId } = input

        return prisma.$transaction(async (tx) => {
            // 1. Create Movement Log
            await tx.inventoryMovement.create({
                data: {
                    type,
                    quantity,
                    equipmentId,
                    assetId,
                    userId,
                    reason,
                    tenantId,
                    rentalId,
                    maintenanceId,
                }
            })

            // 2. Update Equipment Total/Rented Qty based on movement type
            if (type === 'PURCHASE' || type === 'INITIAL_BALANCE') {
                await tx.equipment.update({
                    where: { id: equipmentId },
                    data: { totalQty: { increment: quantity } }
                })
            } else if (type === 'RETIREMENT' || type === 'LOSS') {
                await tx.equipment.update({
                    where: { id: equipmentId },
                    data: { totalQty: { increment: quantity } } // quantity should be negative
                })
            } else if (type === 'RENTAL_OUT') {
                await tx.equipment.update({
                    where: { id: equipmentId },
                    data: { rentedQty: { increment: Math.abs(quantity) } }
                })
            } else if (type === 'RENTAL_IN') {
                await tx.equipment.update({
                    where: { id: equipmentId },
                    data: { rentedQty: { decrement: Math.abs(quantity) } }
                })
            } else if (type === 'CORRECTION') {
                await tx.equipment.update({
                    where: { id: equipmentId },
                    data: { totalQty: { increment: quantity } }
                })
            }

            // 3. Update Asset Status if applicable
            if (assetId) {
                let newStatus = undefined
                if (type === 'RENTAL_OUT') newStatus = 'RENTED'
                if (type === 'RENTAL_IN') newStatus = 'AVAILABLE'
                if (type === 'MAINTENANCE_OUT') newStatus = 'MAINTENANCE'
                if (type === 'MAINTENANCE_IN') newStatus = 'AVAILABLE'
                if (type === 'RETIREMENT') newStatus = 'RETIRED'
                if (type === 'LOSS') newStatus = 'LOST'

                if (newStatus) {
                    await tx.asset.update({
                        where: { id: assetId },
                        data: { status: newStatus as any }
                    })
                }
            }
        })
    }

    static async getHistory(equipmentId: string, tenantId: string) {
        return prisma.inventoryMovement.findMany({
            where: { equipmentId, tenantId },
            include: { user: true, asset: true },
            orderBy: { createdAt: 'desc' }
        })
    }
}
