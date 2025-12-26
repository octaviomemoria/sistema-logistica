import { prisma } from '@/lib/prisma'
import { MaintenanceStatus, MaintenanceExecutor, MaintenanceApprovalStatus } from '@prisma/client'
import { FinancialIntegrationService } from '@/lib/financial/financial-integration.service'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export interface CreateMaintenanceInput {
    equipmentId: string
    type: string // CORRECTIVE, PREVENTIVE
    description?: string
    cost?: number
    startDate?: Date
    executorType?: MaintenanceExecutor
    providerId?: string
    tenantId?: string
}

export class MaintenanceService {
    static async create(data: CreateMaintenanceInput) {
        // Get tenant from session if not provided
        let tenantId = data.tenantId
        if (!tenantId) {
            const session: any = await getServerSession(authOptions)
            tenantId = session?.user?.tenantId
        }

        if (!tenantId) throw new Error('TenantID is required')

        // Validation: Check if equipment exists
        const equipment = await prisma.equipment.findUnique({
            where: { id: data.equipmentId }
        })
        if (!equipment) throw new Error('Equipamento não encontrado')

        // Transaction: Create Maintenance + Create Stock Movement
        const result = await prisma.$transaction(async (tx) => {
            const maintenance = await tx.maintenance.create({
                data: {
                    equipmentId: data.equipmentId,
                    type: data.type,
                    description: data.description,
                    cost: data.cost || 0,
                    startDate: data.startDate || new Date(),
                    status: 'OPEN',
                    executorType: data.executorType || 'INTERNAL',
                    providerId: data.providerId,
                    approvalStatus: 'PENDING',
                    tenantId
                },
                include: { equipment: true }
            })

            // Create Stock Movement (MAINTENANCE_OUT)
            await tx.stockMovement.create({
                data: {
                    type: 'MAINTENANCE_OUT',
                    quantity: 1,
                    equipmentId: data.equipmentId,
                    maintenanceId: maintenance.id,
                    tenantId,
                    reason: `Manutenção ${data.type} - ${data.description || 'N/A'}`
                }
            })

            return maintenance
        })

        return result
    }

    static async complete(id: string, endDate: Date, finalCost?: number, description?: string) {
        const session: any = await getServerSession(authOptions)
        const tenantId = session?.user?.tenantId

        if (!tenantId) throw new Error('TenantID is required')

        return await prisma.$transaction(async (tx) => {
            const maintenance = await tx.maintenance.update({
                where: { id },
                data: {
                    status: 'COMPLETED',
                    endDate,
                    cost: finalCost !== undefined ? finalCost : undefined,
                    description: description !== undefined ? description : undefined
                },
                include: {
                    equipment: true,
                    provider: true
                }
            })

            // Create Stock Movement (MAINTENANCE_IN)
            await tx.stockMovement.create({
                data: {
                    type: 'MAINTENANCE_IN',
                    quantity: 1,
                    equipmentId: maintenance.equipmentId,
                    maintenanceId: maintenance.id,
                    tenantId,
                    reason: 'Retorno de manutenção'
                }
            })

            // Financial Integration for External Maintenance
            if (maintenance.executorType === 'EXTERNAL' && maintenance.cost > 0) {
                await FinancialIntegrationService.createTitleFromMaintenance(maintenance, tenantId, tx)
            }

            return maintenance
        })
    }

    static async updateStatus(id: string, status: MaintenanceStatus) {
        const session: any = await getServerSession(authOptions)
        const tenantId = session?.user?.tenantId

        if (!tenantId) throw new Error('TenantID is required')

        // If cancelling, create stock movement to return equipment
        if (status === 'CANCELLED') {
            return await prisma.$transaction(async (tx) => {
                const maintenance = await tx.maintenance.update({
                    where: { id },
                    data: { status }
                })

                // Create Stock Movement (MAINTENANCE_IN) for cancellation
                await tx.stockMovement.create({
                    data: {
                        type: 'MAINTENANCE_IN',
                        quantity: 1,
                        equipmentId: maintenance.equipmentId,
                        maintenanceId: maintenance.id,
                        tenantId,
                        reason: 'Manutenção cancelada'
                    }
                })

                return maintenance
            })
        }

        return await prisma.maintenance.update({
            where: { id },
            data: { status }
        })
    }
}
