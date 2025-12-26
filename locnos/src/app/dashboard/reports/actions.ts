'use server'

import { prisma } from '@/lib/prisma'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function getFinancialStats() {
    const session = await getServerSession(authOptions)
    const tenantId = session?.user?.tenantId

    if (!tenantId) return { totalRevenue: 0, totalPaid: 0, count: 0, pendingAmount: 0, revenueHistory: [] }

    try {
        const rentals = await prisma.rental.findMany({
            where: {
                tenantId: tenantId,
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

export async function getABCAnalysis(startDate?: Date | string, endDate?: Date | string) {
    const session = await getServerSession(authOptions)
    const tenantId = session?.user?.tenantId

    if (!tenantId) return { params: [] }

    const dateFilter: any = {}
    if (startDate) dateFilter.gte = new Date(startDate)
    if (endDate) dateFilter.lte = new Date(endDate)

    // 1. Get all rental items filtered by tenant and date
    const rentItems = await prisma.rentalItem.findMany({
        where: {
            rental: {
                tenantId: tenantId,
                status: { not: 'CANCELLED' },
                startDate: Object.keys(dateFilter).length > 0 ? dateFilter : undefined
            }
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
        const percentage = totalRev > 0 ? (accumulated / totalRev) * 100 : 0
        let category = 'C'
        if (percentage <= 80) category = 'A'
        else if (percentage <= 95) category = 'B'

        return { ...item, category, percentage }
    })

    return { params: abc.slice(0, 50) } // Return top 50
}

export async function getInventoryStats() {
    const session = await getServerSession(authOptions)
    const tenantId = session?.user?.tenantId

    if (!tenantId) return { totalItems: 0, rentedItems: 0, availableItems: 0, totalValue: 0 }

    try {
        const equipment = await prisma.equipment.aggregate({
            where: {
                tenantId: tenantId
            },
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

export async function getDefaulters() {
    const session = await getServerSession(authOptions)
    const tenantId = session?.user?.tenantId

    if (!tenantId) return []

    // Find overdue titles
    const overdueTitles = await prisma.financialTitle.findMany({
        where: {
            tenantId: tenantId,
            status: 'OVERDUE',
            type: 'INCOME' // Receivables usually
        },
        include: {
            rental: {
                include: { person: true }
            },
            tenant: true
        },
        orderBy: { dueDate: 'asc' }
    })

    // Group by Person
    const defaultersMap = new Map<string, {
        personId: string,
        name: string,
        totalDebt: number,
        titlesCount: number,
        oldestDebt: Date
    }>()

    for (const title of overdueTitles) {
        // Person comes from Rental usually, or we might need personId on Title if we link directly
        // Currently Title has rentalId. 
        // If title is manual, we might not have person. 
        // We need Person on FinancialTitle eventually? 
        // For now, use Rental's person.

        const person = title.rental?.person
        if (!person) continue

        const current = defaultersMap.get(person.id) || {
            personId: person.id,
            name: person.name,
            totalDebt: 0,
            titlesCount: 0,
            oldestDebt: title.dueDate
        }

        current.totalDebt += title.balance
        current.titlesCount += 1
        if (title.dueDate < current.oldestDebt) {
            current.oldestDebt = title.dueDate
        }

        defaultersMap.set(person.id, current)
    }

    return Array.from(defaultersMap.values()).sort((a, b) => b.totalDebt - a.totalDebt)
}

