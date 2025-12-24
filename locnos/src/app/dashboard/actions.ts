'use server'

import { PrismaClient } from '@prisma/client'
import { getFinancialStats } from './reports/actions'

const prisma = new PrismaClient()

export async function getDashboardStats() {
    try {
        const [
            activeRentals,
            scheduledRentals,
            totalCustomers,
            totalEquipments,
            rentedEquipments,
            availableEquipmentsCount,
            financialStats
        ] = await Promise.all([
            prisma.rental.count({ where: { status: 'ACTIVE' } }),
            prisma.rental.count({ where: { status: 'SCHEDULED' } }),
            prisma.person.count({ where: { status: 'ACTIVE' } }),
            prisma.equipment.aggregate({ _sum: { totalQty: true } }),
            prisma.equipment.aggregate({ _sum: { rentedQty: true } }),
            prisma.equipment.count({ where: { totalQty: { gt: 0 } } }),
            getFinancialStats()
        ])

        const totalStock = totalEquipments._sum.totalQty || 0
        const rentedStock = rentedEquipments._sum.rentedQty || 0
        const availableStock = totalStock - rentedStock

        return {
            activeRentals,
            scheduledRentals,
            totalCustomers,
            totalStock,
            rentedStock,
            availableStock,
            financial: financialStats
        }
    } catch (error) {
        console.error('Failed to fetch dashboard stats:', error)
        return {
            activeRentals: 0,
            scheduledRentals: 0,
            totalCustomers: 0,
            totalStock: 0,
            rentedStock: 0,
            availableStock: 0,
            financial: { totalRevenue: 0, totalPaid: 0, count: 0 }
        }
    }
}
