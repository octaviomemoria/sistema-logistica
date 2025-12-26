import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const centers = await prisma.costCenter.findMany({
        where: { active: true },
        orderBy: { code: 'asc' }
    });
    return NextResponse.json(centers);
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { code, name } = body;

        const center = await prisma.costCenter.create({
            data: { code, name }
        });

        return NextResponse.json(center);
    } catch (error) {
        return NextResponse.json({ error: "Failed to create cost center" }, { status: 500 });
    }
}
