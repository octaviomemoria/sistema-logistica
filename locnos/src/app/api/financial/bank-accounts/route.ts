import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const accounts = await prisma.bankAccount.findMany({
        orderBy: { name: 'asc' }
    });
    return NextResponse.json(accounts);
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, bankName, initialBalance } = body;

        const account = await prisma.bankAccount.create({
            data: {
                name,
                bankName,
                initialBalance: parseFloat(initialBalance || 0),
                currentBalance: parseFloat(initialBalance || 0)
            }
        });

        return NextResponse.json(account);
    } catch (error) {
        return NextResponse.json({ error: "Failed to create bank account" }, { status: 500 });
    }
}
