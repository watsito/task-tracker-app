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
        termins: { where: { deletedAt: null }, orderBy: { order: 'asc' } },
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
      const existingProject = await tx.financeProject.findUnique({
        where: { id },
        include: { termins: true },
      });

      if (!existingProject) {
        throw new Error('Finance project not found');
      }

      const existingTerminIds = new Set(existingProject.termins.map((termin) => termin.id));
      const submittedExistingIds = body.termins.flatMap((termin) => termin.id ? [termin.id] : []);
      const invalidTerminId = submittedExistingIds.find((terminId) => !existingTerminIds.has(terminId));

      if (invalidTerminId) {
        throw new Error('Termin tidak valid untuk project ini.');
      }

      const submittedIds = new Set(submittedExistingIds);
      const activeTerminIdsToArchive = existingProject.termins
        .filter((termin) => !termin.deletedAt && !submittedIds.has(termin.id))
        .map((termin) => termin.id);

      await tx.financeProject.update({
        where: { id },
        data: {
          clientName: body.clientName.trim(),
          projectName: body.projectName.trim(),
          dateStart: body.dateStart ? new Date(body.dateStart) : null,
          dateEnd: body.dateEnd ? new Date(body.dateEnd) : null,
          totalProject: body.totalProject,
          status: body.status,
          notes: body.notes.trim(),
        },
      });

      if (activeTerminIdsToArchive.length > 0) {
        await tx.financeTermin.updateMany({
          where: { id: { in: activeTerminIdsToArchive }, financeProjectId: id, deletedAt: null },
          data: { deletedAt: new Date() },
        });
      }

      for (const [index, termin] of body.termins.entries()) {
        const billingDate = termin.billingDate ? new Date(termin.billingDate) : null;
        const paymentDeadline = termin.paymentDeadline ? new Date(termin.paymentDeadline) : null;
        const editableData = {
          order: index + 1,
          name: termin.name.trim(),
          percentage: termin.percentage,
          billingDate,
          paymentDeadline,
          description: termin.description.trim(),
          termOfPaymentDays: 0,
          deletedAt: null,
        };

        if (termin.id) {
          const previousTermin = existingProject.termins.find((item) => item.id === termin.id)!;

          await tx.financeTermin.update({
            where: { id: termin.id },
            data: editableData,
          });

          if (previousTermin.billingDate?.getTime() !== billingDate?.getTime()) {
            await tx.financeTerminAudit.create({
              data: {
                financeTerminId: termin.id,
                userId: user.id,
                action: previousTermin.billingDate ? 'BILLING_DATE_EDITED' : 'BILLING_DATE_SET',
                metadata: {
                  previousValue: previousTermin.billingDate?.toISOString() ?? null,
                  newValue: billingDate?.toISOString() ?? null,
                },
              },
            });
          }

          if (previousTermin.paymentDeadline?.getTime() !== paymentDeadline?.getTime()) {
            await tx.financeTerminAudit.create({
              data: {
                financeTerminId: termin.id,
                userId: user.id,
                action: 'PAYMENT_DEADLINE_EDITED',
                metadata: {
                  previousValue: previousTermin.paymentDeadline?.toISOString() ?? null,
                  newValue: paymentDeadline?.toISOString() ?? null,
                },
              },
            });
          }
        } else {
          await tx.financeTermin.create({
            data: {
              ...editableData,
              financeProjectId: id,
              termStatus: 'TO_INVOICE',
              billingStatus: 'NOT_BILLABLE',
              disbursementStatus: 'NOT_DISBURSED',
            },
          });
        }
      }

      return tx.financeProject.findUnique({
        where: { id },
        include: {
          createdBy: { select: { id: true, name: true } },
          termins: { where: { deletedAt: null }, orderBy: { order: 'asc' } },
        },
      });
    });

    return NextResponse.json(toFinanceProjectResponse(project!));
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
