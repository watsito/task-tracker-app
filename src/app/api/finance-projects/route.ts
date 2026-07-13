import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import type { FinanceProjectInput } from '@/features/finance/types/finance';
import { toFinanceProjectResponse, validateFinanceProjectInput } from '@/features/finance/utils/financeMapper';

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const projects = await prisma.financeProject.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { id: true, name: true } },
        termins: { orderBy: { order: 'asc' } },
      },
    });

    return NextResponse.json(projects.map(toFinanceProjectResponse));
  } catch (error) {
    console.error('[GET /api/finance-projects]', error);
    return NextResponse.json({ error: 'Failed to fetch finance projects' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json() as FinanceProjectInput;
    validateFinanceProjectInput(body);

    const project = await prisma.financeProject.create({
      data: {
        clientName: body.clientName.trim(),
        projectName: body.projectName.trim(),
        dateStart: body.dateStart ? new Date(body.dateStart) : null,
        dateEnd: body.dateEnd ? new Date(body.dateEnd) : null,
        totalProject: body.totalProject,
        status: body.status,
        notes: body.notes.trim(),
        createdById: user.id,
        termins: {
          create: body.termins.map((termin, index) => ({
            order: index + 1,
            name: termin.name.trim(),
            percentage: termin.percentage,
            billingDate: termin.billingDate ? new Date(termin.billingDate) : null,
            description: termin.description.trim(),
            billingStatus: termin.billingStatus,
            disbursementStatus: termin.billingStatus === 'BILLABLE' ? termin.disbursementStatus : 'NOT_DISBURSED',
          })),
        },
      },
      include: {
        createdBy: { select: { id: true, name: true } },
        termins: { orderBy: { order: 'asc' } },
      },
    });

    return NextResponse.json(toFinanceProjectResponse(project), { status: 201 });
  } catch (error) {
    console.error('[POST /api/finance-projects]', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to create finance project' }, { status: 400 });
  }
}
