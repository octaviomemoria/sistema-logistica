import { prisma } from "@/lib/prisma";
import { TransactionType } from "@prisma/client";
import { TitlesService } from "./titles.service";

export class MovementsService {

    /**
     * Revert a Payment (Delete Movement and Rollback Balances)
     */
    static async revertPayment(movementId: string, externalTx?: any) {
        const runLogic = async (tx: any) => {
            // 1. Get Movement
            const movement = await tx.financialMovement.findUnique({ where: { id: movementId } });
            if (!movement) throw new Error("Movement not found");

            // 2. Revert Bank Balance
            const bank = await tx.bankAccount.findUnique({ where: { id: movement.bankAccountId } });
            if (bank) {
                const signal = movement.type === 'INCOME' ? -1 : 1; // Opposite of original
                await tx.bankAccount.update({
                    where: { id: movement.bankAccountId },
                    data: { currentBalance: bank.currentBalance + (movement.amount * signal) }
                });
            }

            // 3. Revert Title Balance
            if (movement.titleId) {
                const title = await tx.financialTitle.findUnique({ where: { id: movement.titleId } });
                if (title) {
                    const newBalance = title.balance + movement.amount; // Add back the amount
                    let newStatus = title.status;
                    // If balance restored to original, it might be OPEN again.
                    // Or if partially paid, remains PARTIAL.
                    // Simplify: if newBalance >= originalValue, status = OPEN (tolerance checking needed?)

                    if (Math.abs(newBalance - title.originalValue) < 0.01) {
                        newStatus = 'OPEN';
                    } else if (newBalance > 0.01) {
                        newStatus = 'PARTIAL';
                    }

                    // Logic check: if we revert a payment, balance goes UP.
                    // If balance > 0, it is PARTIAL or OPEN.

                    await tx.financialTitle.update({
                        where: { id: movement.titleId },
                        data: { balance: newBalance, status: newStatus }
                    });
                }
            }

            // 4. Delete Movement
            await tx.financialMovement.delete({ where: { id: movementId } });
        };

        if (externalTx) {
            return runLogic(externalTx);
        } else {
            return prisma.$transaction(runLogic);
        }
    }

    /**
     * Register a Payment (Write-off)
     * Creates a Movement and Updates the Title Balance
     */
    static async registerPayment(data: {
        tenantId: string;
        bankAccountId: string;
        titleId?: string;
        amount: number;
        date: Date;
        type: TransactionType;
        description?: string; // Optional override
    }, externalTx?: any) {
        const runLogic = async (tx: any) => {
            // 1. Create Movement
            const movement = await tx.financialMovement.create({
                data: {
                    tenantId: data.tenantId,
                    bankAccountId: data.bankAccountId,
                    titleId: data.titleId,
                    amount: data.amount,
                    date: data.date,
                    type: data.type,
                    conciliated: false // Default false unless coming from OFX
                }
            });

            // 2. Update Bank Balance
            const bank = await tx.bankAccount.findUnique({ where: { id: data.bankAccountId } });
            if (bank) {
                const signal = data.type === 'INCOME' ? 1 : -1;
                await tx.bankAccount.update({
                    where: { id: data.bankAccountId },
                    data: { currentBalance: bank.currentBalance + (data.amount * signal) }
                });
            }

            // 3. Update Title Balance (if linked)
            if (data.titleId) {
                const title = await tx.financialTitle.findUnique({ where: { id: data.titleId } });
                if (title) {
                    const newBalance = title.balance - data.amount;
                    let newStatus = title.status;
                    if (newBalance <= 0.01) newStatus = 'PAID';
                    else newStatus = 'PARTIAL';

                    await tx.financialTitle.update({
                        where: { id: data.titleId },
                        data: { balance: newBalance, status: newStatus }
                    });
                }
            }

            return movement;
        };

        if (externalTx) {
            return runLogic(externalTx);
        } else {
            return prisma.$transaction(runLogic);
        }
    }
}
