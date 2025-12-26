import { prisma } from "@/lib/prisma";
import { TitlesService } from "./titles.service";
import { Rental, RentalStatus } from "@prisma/client";

export class FinancialRentalService {

    /**
     * Creates a Financial Title (Receivable) from a Rental
     * Should be called when Rental status becomes ACTIVE
     */
    static async createTitleFromRental(rental: Rental & { person: { name: string } }, tenantId: string, tx?: any) {
        if (!tenantId) {
            throw new Error("Cannot create financial title: TenantID is missing");
        }

        const db = tx || prisma;

        // 1. Find default Revenue Account (1.01 - Receita de Locação/Serviços)
        const revenueAccount = await db.chartOfAccount.findFirst({
            where: {
                tenantId,
                code: '1.01'
            }
        });

        if (!revenueAccount) {
            throw new Error(`Cannot create financial title: Default Revenue Account (1.01) not found for tenant ${tenantId}. Please configure the Chart of Accounts.`);
        }

        // 2. Create Title
        await TitlesService.create({
            tenantId,
            description: `Locação #${rental.id.slice(0, 8)} - ${rental.person.name}`,
            amount: rental.totalAmount,
            dueDate: rental.endDate,
            competenceDate: rental.startDate, // Competencia is when service started
            type: 'INCOME',
            accountId: revenueAccount.id,
            origin: 'RENTAL',
            rentalId: rental.id,
            // personId: rental.personId // Not in schema yet, but ideally should send
        }, tx);

        console.log(`✅ Financial Title created for Rental ${rental.id}`);
    }

    /**
     * Updates an existing Title if Rental values change
     * (e.g. extension of days, additional items)
     */
    static async syncTitleWithRental(rental: Rental, tenantId: string) {
        const title = await prisma.financialTitle.findFirst({
            where: { rentalId: rental.id, tenantId }
        });

        if (title) {
            // Update value 
            // NOTE: If title is already PARTIAL/PAID, changing originalValue might break balance logic.
            // For MVP, we only update if OPEN.
            if (title.status === 'OPEN') {
                await prisma.financialTitle.update({
                    where: { id: title.id },
                    data: {
                        originalValue: rental.totalAmount,
                        balance: rental.totalAmount, // Reset balance (assuming no partial payments yet)
                        dueDate: rental.endDate
                    }
                });
            }
        }
    }
}
