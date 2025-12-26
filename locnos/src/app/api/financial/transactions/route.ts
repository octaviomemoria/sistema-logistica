import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TransactionType } from "@prisma/client";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = {};
    if (startDate && endDate) {
        where.competenceDate = {
            gte: new Date(startDate),
            lte: new Date(endDate)
        };
    }

    const transactions = await prisma.financialTransaction.findMany({
        where,
        include: {
            account: true,
            rental: { select: { id: true, person: { select: { name: true } } } },
            maintenance: { select: { id: true, equipment: { select: { name: true } } } }
        },
        orderBy: { competenceDate: 'desc' }
    });

    return NextResponse.json(transactions);
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { description, amount, type, dueDate, paymentDate, competenceDate, accountId } = body;

        const transaction = await prisma.financialTransaction.create({
            data: {
                description,
                amount: parseFloat(amount),
                type: type as TransactionType,
                dueDate: new Date(dueDate),
                paymentDate: paymentDate ? new Date(paymentDate) : null,
                competenceDate: new Date(competenceDate),
                accountId,
                status: paymentDate ? 'PAID' : 'PENDING'
            }
        });

        return NextResponse.json(transaction);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 });
    }
}
