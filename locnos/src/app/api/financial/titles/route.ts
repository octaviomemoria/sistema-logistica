import { NextRequest, NextResponse } from 'next/server';
import { TitlesService } from '@/lib/financial/titles.service';
import { TransactionType, TitleStatus, TransactionOrigin } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const tenantId = session.user.tenantId;

    const searchParams = req.nextUrl.searchParams;
    // const tenantId = searchParams.get('tenantId') || 'default-tenant'; // REMOVED SECURITY RISK
    const status = searchParams.get('status') as TitleStatus | undefined;
    const type = searchParams.get('type') as TransactionType | undefined; // INCOME, EXPENSE
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;

    try {
        const titles = await TitlesService.list(tenantId, {
            status,
            type,
            startDate,
            endDate
        });
        return NextResponse.json(titles);
    } catch (e) {
        return NextResponse.json({ error: 'Failed to list titles' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const tenantId = session.user.tenantId;

    try {
        const body = await req.json();
        // Validation would happen here

        const title = await TitlesService.create({
            tenantId,
            description: body.description,
            amount: parseFloat(body.amount),
            dueDate: new Date(body.dueDate),
            competenceDate: new Date(body.competenceDate),
            type: body.type,
            accountId: body.accountId,
            origin: body.origin || 'MANUAL'
        });

        return NextResponse.json(title);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed to create title' }, { status: 500 });
    }
}
