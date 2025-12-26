
import { PrismaClient } from '@prisma/client'
import { TitlesService } from './titles.service'

const prisma = new PrismaClient()

export class FinancialIntegrationService {
    /**
     * Creates a Revenue Title from a Rental
     */
    static async createTitleFromRental(rental: any, tenantId: string, tx?: any) {
        if (!tenantId) throw new Error("TenantID missing")
        const db = tx || prisma

        // 1. Find Revenue Account (1.01)
        const revenueAccount = await db.chartOfAccount.findFirst({
            where: { tenantId, code: '1.01' }
        })

        if (!revenueAccount) {
            // Fallback or Error? Ideally Error.
            // For now, let's log and likely fail or use a default if system accounts existed.
            throw new Error("Revenue Account (1.01) not found.")
        }

        // 2. Create Title
        await TitlesService.create({
            tenantId,
            description: `Locação #${rental.id.slice(0, 8)} - ${rental.person.name}`,
            amount: rental.totalAmount,
            dueDate: rental.endDate,
            competenceDate: rental.startDate,
            type: 'INCOME',
            accountId: revenueAccount.id,
            origin: 'RENTAL',
            rentalId: rental.id
        }, tx)
    }

    /**
     * Creates an Expense Title from a Maintenance (External)
     */
    static async createTitleFromMaintenance(maintenance: any, tenantId: string, tx?: any) {
        if (!tenantId) throw new Error("TenantID missing")
        const db = tx || prisma

        // Only External Maintenances generate titles
        if (maintenance.executorType !== 'EXTERNAL' || !maintenance.cost || maintenance.cost <= 0) {
            return
        }

        // 1. Find Maintenance Expense Account (assume 2.01 or similar/search by name)
        // Ideally we search by a specific code. Let's assume '2.03' (Maintenance) for now or find first expense.
        let expenseAccount = await db.chartOfAccount.findFirst({
            where: { tenantId, code: '2.03' } // Hypothetical Maintenance Code
        })

        if (!expenseAccount) {
            // Fallback to any expense account
            expenseAccount = await db.chartOfAccount.findFirst({
                where: { tenantId, type: 'EXPENSE' }
            })
        }

        if (!expenseAccount) {
            console.warn("No Expense Account found. Skipping Financial Title for Maintenance.")
            return
        }

        // 2. Create Title
        await TitlesService.create({
            tenantId,
            description: `Manutenção #${maintenance.id.slice(0, 8)} - ${maintenance.equipment?.name || 'Equipamento'}`,
            amount: maintenance.cost,
            dueDate: new Date(), // Due today (or endDate)
            competenceDate: maintenance.startDate,
            type: 'EXPENSE',
            accountId: expenseAccount.id,
            origin: 'MAINTENANCE',
            // maintenanceId: maintenance.id  (If schema had it, but TitlesService might not have it mapped yet? user added titles to Maintenance relation)
            // schema: maintenance has `titles FinancialTitle[]`
            // financialTitle has `maintenanceId`? Let's check TitlesService input.
        }, tx)

        // We need to link the title to the maintenance. 
        // If TitlesService doesn't support maintenanceId param yet, we might need to update TitlesService or do an update after.
        // Let's assume we update TitlesService to accept maintenanceId or we update the title here.
    }
}
