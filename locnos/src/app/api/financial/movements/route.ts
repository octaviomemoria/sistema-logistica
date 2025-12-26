import { NextRequest, NextResponse } from 'next/server';
import { MovementsService } from '@/lib/financial/movements.service';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // This is the "Pay/Receive" action
        const movement = await MovementsService.registerPayment({
            tenantId: body.tenantId || 'default-tenant',
            bankAccountId: body.bankAccountId,
            titleId: body.titleId,
            amount: parseFloat(body.amount),
            date: new Date(body.date),
            type: body.type, // INCOME or EXPENSE
            description: body.description
        });

        return NextResponse.json(movement);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed to register movement' }, { status: 500 });
    }
}
