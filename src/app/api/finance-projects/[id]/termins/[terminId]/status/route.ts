import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import type { FinanceTerminStatus, FinanceTerminStatusTransitionRequest } from '@/features/finance/types/finance';
import { toFinanceProjectResponse } from '@/features/finance/utils/financeMapper';

interface RouteContext {
  params: Promise<{ id: string; terminId: string }>;
}

const VALID_TRANSITIONS: Record<FinanceTerminStatus, FinanceTerminStatus[]> = {
  TO_INVOICE: ['OPEN_INVOICE', 'OUTSTANDING', 'PAID'],
  OPEN_INVOICE: ['TO_INVOICE', 'OUTSTANDING', 'PAID'],
  OUTSTANDING: ['TO_INVOICE', 'OPEN_INVOICE', 'PAID'],
  PAID: ['TO_INVOICE', 'OPEN_INVOICE', 'OUTSTANDING'],
};

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id, terminId } = await context.params;
    const body = (await request.json()) as FinanceTerminStatusTransitionRequest;

    if (!body?.targetStatus) {
      return NextResponse.json({ error: 'targetStatus wajib diisi.' }, { status: 400 });
    }

    const project = await prisma.financeProject.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true } },
        termins: {
          orderBy: { order: 'asc' },
          where: { id: terminId, deletedAt: null },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project finance tidak ditemukan.' }, { status: 404 });
    }

    const termin = project.termins[0];

    if (!termin) {
      return NextResponse.json({ error: 'Termin tidak ditemukan pada project ini.' }, { status: 404 });
    }

    if (!VALID_TRANSITIONS[termin.termStatus].includes(body.targetStatus)) {
      return NextResponse.json({ error: 'Perpindahan status tidak valid.' }, { status: 400 });
    }

    const billingDateToPersist = body.targetStatus === 'OPEN_INVOICE'
      ? body.billingDate ? new Date(body.billingDate) : termin.billingDate
      : termin.billingDate;
    const paymentDeadlineToPersist = body.targetStatus === 'OPEN_INVOICE'
      ? body.paymentDeadline ? new Date(body.paymentDeadline) : termin.paymentDeadline
      : termin.paymentDeadline;

    if (billingDateToPersist && paymentDeadlineToPersist && paymentDeadlineToPersist < billingDateToPersist) {
      return NextResponse.json({ error: 'Payment Deadline tidak boleh lebih awal dari Billing Date.' }, { status: 400 });
    }

    const updatedProject = await prisma.$transaction(async (tx) => {
      await tx.financeTermin.update({
        where: { id: terminId },
        data: {
          termStatus: body.targetStatus,
          billingDate: billingDateToPersist,
          paymentDeadline: paymentDeadlineToPersist,
          billingStatus: body.targetStatus === 'TO_INVOICE' ? 'NOT_BILLABLE' : 'BILLABLE',
          disbursementStatus: body.targetStatus === 'PAID' ? 'DISBURSED' : 'NOT_DISBURSED',
        },
      });

      await tx.financeTerminAudit.create({
        data: {
          financeTerminId: terminId,
          userId: user.id,
          action: 'STATUS_CHANGED',
          fromStatus: termin.termStatus,
          toStatus: body.targetStatus,
          metadata: {
            previousBillingDate: termin.billingDate?.toISOString() ?? null,
            newBillingDate: billingDateToPersist?.toISOString() ?? null,
            previousPaymentDeadline: termin.paymentDeadline?.toISOString() ?? null,
            newPaymentDeadline: paymentDeadlineToPersist?.toISOString() ?? null,
          },
        },
      });

      return tx.financeProject.findUnique({
        where: { id },
        include: {
          createdBy: { select: { id: true, name: true } },
          termins: { where: { deletedAt: null }, orderBy: { order: 'asc' } },
        },
      });
    });

    return NextResponse.json(toFinanceProjectResponse(updatedProject!));
  } catch (error) {
    console.error('[POST /api/finance-projects/[id]/termins/[terminId]/status]', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Gagal memperbarui status termin' }, { status: 400 });
  }
}
