import { prisma } from '@/lib/prisma'

export interface CreateMaintenanceInput {
    equipmentId: string
    type: string // CORRECTIVE, PREVENTIVE
    description?: string
    cost?: number
    startDate?: Date
}

export class MaintenanceService {
    static async create(data: CreateMaintenanceInput) {
        // Validation: Check if equipment exists
        const equipment = await prisma.equipment.findUnique({
            where: { id: data.equipmentId }
        })
        if (!equipment) throw new Error('Equipamento não encontrado')

        // Create
        const maintenance = await prisma.maintenance.create({
            data: {
                equipmentId: data.equipmentId,
                type: data.type,
                description: data.description,
                cost: data.cost || 0,
                startDate: data.startDate || new Date(),
                status: 'OPEN'
            }
        })

        return maintenance
    }

    static async complete(id: string, endDate: Date, finalCost?: number, description?: string) {
        return await prisma.maintenance.update({
            where: { id },
            data: {
                status: 'COMPLETED',
                endDate,
                cost: finalCost !== undefined ? finalCost : undefined,
                description: description !== undefined ? description : undefined
            }
        })
    }
}
