import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { addDays, startOfDay } from "date-fns";

export async function GET() {
    const today = startOfDay(new Date());

    // Find FinancialTransactions that are PENDING and overdue
    const overdueTransactions = await prisma.financialTransaction.findMany({
        where: {
            status: 'PENDING',
            dueDate: {
                lt: today
            },
            type: 'INCOME' // Only concerned with receiving money
        },
        include: {
            rental: {
                select: {
                    id: true,
                    person: {
                        select: { name: true, phone: true, email: true }
                    }
                }
            }
        },
        orderBy: { dueDate: 'asc' }
    });

    return NextResponse.json(overdueTransactions);
}
