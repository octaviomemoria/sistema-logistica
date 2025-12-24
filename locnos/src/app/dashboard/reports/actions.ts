'use server'

import { prisma } from '@/lib/prisma'

export async function getFinancialStats() {
    try {
        const rentals = await prisma.rental.findMany({
            where: {
                status: { not: 'CANCELLED' }
            },
            select: {
                totalAmount: true,
                amountPaid: true,
                createdAt: true,
                status: true,
                startDate: true
            }
        })

        const totalRevenue = rentals.reduce((acc: number, r) => acc + r.totalAmount, 0)
        const totalPaid = rentals.reduce((acc: number, r) => acc + r.amountPaid, 0)
        const pendingAmount = totalRevenue - totalPaid

        // Group by month
        const revenueByMonth = rentals.reduce((acc: Record<string, number>, r) => {
            const month = r.startDate.toLocaleString('pt-BR', { month: 'short', year: '2-digit' })
            acc[month] = (acc[month] || 0) + r.totalAmount
            return acc
        }, {} as Record<string, number>)

        return {
            totalRevenue,
            totalPaid,
            pendingAmount,
            count: rentals.length,
            revenueHistory: Object.entries(revenueByMonth).map(([name, value]) => ({ name, value }))
        }
    } catch (error) {
        return { totalRevenue: 0, totalPaid: 0, count: 0, pendingAmount: 0, revenueHistory: [] }
    }
}

export async function getABCAnalysis() {
    // 1. Get all rental items
    // This query might be heavy, grouping in DB is better but Prisma GroupBy for relations is tricky
    // Doing simpler approach: Get Top Rented Equipments from Equipment Table counters (we update them?)
    // Actually, we should aggregate RentalItems.

    /* 
       We need to know:
       - Equipment Name
       - Total Revenue Generated (Quantity * UnitPrice)
       - Frequency (Count)
    */

    // Since we don't store historical revenue per item easily without deep scan, 
    // we'll approximate using RentalItem + Rental status != CANCELLED

    const rentItems = await prisma.rentalItem.findMany({
        where: {
            rental: { status: { not: 'CANCELLED' } }
        },
        include: {
            equipment: true
        }
    })

    const productStats = rentItems.reduce((acc: any, item) => {
        const id = item.equipmentId
        if (!acc[id]) {
            acc[id] = {
                name: item.equipment.name,
                revenue: 0,
                count: 0
            }
        }
        acc[id].revenue += (item.unitPrice * item.quantity)
        acc[id].count += item.quantity
        return acc
    }, {})

    // Convert to array and sort by revenue
    const sorted = Object.values(productStats)
        .sort((a: any, b: any) => b.revenue - a.revenue) as { name: string, revenue: number, count: number }[]

    // Calculate Cumulative Percentage
    const totalRev = sorted.reduce((sum, item) => sum + item.revenue, 0)
    let accumulated = 0

    const abc = sorted.map(item => {
        accumulated += item.revenue
        const percentage = (accumulated / totalRev) * 100
        let category = 'C'
        if (percentage <= 80) category = 'A'
        else if (percentage <= 95) category = 'B'

        return { ...item, category, percentage }
    })

    return { params: abc.slice(0, 20) } // Return top 20 for chart
}

export async function getInventoryStats() {
    try {
        const equipment = await prisma.equipment.aggregate({
            _sum: {
                totalQty: true,
                rentedQty: true,
                purchasePrice: true
            },
            _count: {
                id: true
            }
        })

        return {
            totalItems: equipment._sum.totalQty || 0,
            rentedItems: equipment._sum.rentedQty || 0,
            availableItems: (equipment._sum.totalQty || 0) - (equipment._sum.rentedQty || 0),
            totalValue: equipment._sum.purchasePrice || 0,
            uniqueModels: equipment._count.id
        }
    } catch (error) {
        return { totalItems: 0, rentedItems: 0, availableItems: 0, totalValue: 0 }
    }
}
