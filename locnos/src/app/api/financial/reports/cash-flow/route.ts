import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TransactionType } from "@prisma/client";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');

    if (!startDateStr || !endDateStr) {
        return NextResponse.json({ error: "startDate and endDate are required" }, { status: 400 });
    }

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    const transactions = await prisma.financialTransaction.findMany({
        where: {
            paymentDate: {
                gte: startDate,
                lte: endDate
            },
            status: 'PAID'
        },
        orderBy: { paymentDate: 'asc' }
    });

    // Group by Date
    const dailyFlow: Record<string, { income: number, expense: number, balance: number, transactions: any[] }> = {};

    transactions.forEach(tx => {
        const dateKey = tx.paymentDate!.toISOString().split('T')[0];

        if (!dailyFlow[dateKey]) {
            dailyFlow[dateKey] = { income: 0, expense: 0, balance: 0, transactions: [] };
        }

        if (tx.type === TransactionType.INCOME) {
            dailyFlow[dateKey].income += tx.amount;
        } else {
            dailyFlow[dateKey].expense += tx.amount;
        }

        dailyFlow[dateKey].transactions.push(tx);
    });

    // Calculate daily balances
    Object.keys(dailyFlow).forEach(key => {
        dailyFlow[key].balance = dailyFlow[key].income - dailyFlow[key].expense;
    });

    return NextResponse.json(dailyFlow);
}
