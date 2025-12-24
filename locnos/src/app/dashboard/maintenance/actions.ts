'use server'

import { MaintenanceService } from '@/lib/maintenance/service'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getMaintenances(filter: 'ALL' | 'OPEN' | 'COMPLETED' = 'ALL') {
    try {
        const where: any = {}
        if (filter !== 'ALL') where.status = filter

        const maintenances = await prisma.maintenance.findMany({
            where,
            include: { equipment: true },
            orderBy: { createdAt: 'desc' }
        })
        return { success: true, maintenances }
    } catch (error) {
        return { success: false, error: 'Failed to fetch' }
    }
}

export async function createMaintenance(data: any) {
    try {
        await MaintenanceService.create(data)
        revalidatePath('/dashboard/maintenance')
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function completeMaintenance(id: string, endDate: Date, cost?: number, description?: string) {
    try {
        await MaintenanceService.complete(id, endDate, cost, description)
        revalidatePath('/dashboard/maintenance')
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}
