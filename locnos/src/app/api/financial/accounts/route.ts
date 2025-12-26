import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureStandardAccounts } from "@/lib/financial";
import { AccountType, DreCategory } from "@prisma/client";

export async function GET() {
    try {
        await ensureStandardAccounts();

        const accounts = await prisma.chartOfAccount.findMany({
            orderBy: { code: 'asc' }
        });

        return NextResponse.json(accounts);
    } catch (error) {
        console.error("Error fetching accounts:", error);
        return NextResponse.json(
            { error: "Failed to fetch accounts", details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { code, name, type, dreCategory } = body;

        const account = await prisma.chartOfAccount.create({
            data: {
                code,
                name,
                type: type as AccountType,
                dreCategory: dreCategory as DreCategory
            }
        });

        return NextResponse.json(account);
    } catch (error) {
        return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
    }
}
