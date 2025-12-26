import { prisma } from "@/lib/prisma";
import { FinancialTitle, TitleStatus, TransactionType, TransactionOrigin } from "@prisma/client";

export class TitlesService {

    /**
     * Create a new Financial Title (Receivable or Payable)
     */
    static async create(data: {
        tenantId: string;
        description: string;
        amount: number;
        dueDate: Date;
        competenceDate: Date;
        type: TransactionType;
        accountId: string; // Chart of Account
        origin?: TransactionOrigin;
        personId?: string; // Optional: Link to Person (not in schema yet but logical)
        rentalId?: string;
        maintenanceId?: string;
    }, tx?: any) {
        const db = tx || prisma;
        return db.financialTitle.create({
            data: {
                tenantId: data.tenantId,
                description: data.description,
                originalValue: data.amount,
                balance: data.amount, // Initial balance = full amount
                dueDate: data.dueDate,
                competenceDate: data.competenceDate,
                type: data.type,
                status: 'OPEN',
                origin: data.origin || 'MANUAL',
                accountId: data.accountId,
                rentalId: data.rentalId,
                maintenanceId: data.maintenanceId,
            }
        });
    }

    /**
     * Update Title Balance after a Movement
     */
    static async updateBalance(titleId: string, amountPaid: number) {
        const title = await prisma.financialTitle.findUnique({ where: { id: titleId } });
        if (!title) throw new Error("Title not found");

        const newBalance = title.balance - amountPaid;
        let newStatus: TitleStatus = title.status;

        if (newBalance <= 0.01) { // Tolerance for rounding
            newStatus = 'PAID';
        } else if (amountPaid > 0) {
            newStatus = 'PARTIAL';
        }

        await prisma.financialTitle.update({
            where: { id: titleId },
            data: {
                balance: newBalance,
                status: newStatus
            }
        });
    }

    /**
     * List Titles with filters
     */
    static async list(tenantId: string, filters?: {
        status?: TitleStatus;
        startDate?: Date;
        endDate?: Date;
        type?: TransactionType;
    }) {
        return prisma.financialTitle.findMany({
            where: {
                tenantId,
                status: filters?.status,
                type: filters?.type,
                dueDate: {
                    gte: filters?.startDate,
                    lte: filters?.endDate
                }
            },
            include: {
                account: true,
                tenant: true
            },
            orderBy: { dueDate: 'asc' }
        });
    }
}
