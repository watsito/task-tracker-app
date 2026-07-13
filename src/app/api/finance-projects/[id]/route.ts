import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import type { FinanceProjectInput } from '@/features/finance/types/finance';
import { toFinanceProjectResponse, validateFinanceProjectInput } from '@/features/finance/utils/financeMapper';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await context.params;
    const project = await prisma.financeProject.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true } },
        termins: { orderBy: { order: 'asc' } },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Finance project not found' }, { status: 404 });
    }

    return NextResponse.json(toFinanceProjectResponse(project));
  } catch (error) {
    console.error('[GET /api/finance-projects/[id]]', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to fetch finance project' }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json() as FinanceProjectInput;
    validateFinanceProjectInput(body);

    const project = await prisma.$transaction(async (tx) => {
      await tx.financeTermin.deleteMany({ where: { financeProjectId: id } });

      return tx.financeProject.update({
        where: { id },
        data: {
          clientName: body.clientName.trim(),
          projectName: body.projectName.trim(),
          dateStart: body.dateStart ? new Date(body.dateStart) : null,
          dateEnd: body.dateEnd ? new Date(body.dateEnd) : null,
          totalProject: body.totalProject,
          status: body.status,
          notes: body.notes.trim(),
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
    });

    return NextResponse.json(toFinanceProjectResponse(project));
  } catch (error) {
    console.error('[PATCH /api/finance-projects/[id]]', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to update finance project' }, { status: 400 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await context.params;
    await prisma.financeProject.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[DELETE /api/finance-projects/[id]]', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to delete finance project' }, { status: 400 });
  }
}
