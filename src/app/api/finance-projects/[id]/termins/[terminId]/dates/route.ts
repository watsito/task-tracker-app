import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import type { FinanceTerminDateUpdateRequest } from '@/features/finance/types/finance';
import { toFinanceProjectResponse } from '@/features/finance/utils/financeMapper';

interface RouteContext {
  params: Promise<{ id: string; terminId: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { id, terminId } = await context.params;
    const body = (await request.json()) as FinanceTerminDateUpdateRequest;
    const billingDate = body.billingDate ? new Date(body.billingDate) : null;
    const paymentDeadline = body.paymentDeadline ? new Date(body.paymentDeadline) : null;

    if (billingDate && paymentDeadline && paymentDeadline < billingDate) {
      return NextResponse.json({ error: 'Payment Deadline tidak boleh lebih awal dari Billing Date.' }, { status: 400 });
    }

    const termin = await prisma.financeTermin.findFirst({
      where: { id: terminId, financeProjectId: id, deletedAt: null },
    });

    if (!termin) return NextResponse.json({ error: 'Termin tidak ditemukan.' }, { status: 404 });

    const updatedProject = await prisma.$transaction(async (tx) => {
      await tx.financeTermin.update({
        where: { id: terminId },
        data: { billingDate, paymentDeadline },
      });

      if (termin.billingDate?.getTime() !== billingDate?.getTime()) {
        await tx.financeTerminAudit.create({
          data: {
            financeTerminId: terminId,
            userId: user.id,
            action: termin.billingDate ? 'BILLING_DATE_EDITED' : 'BILLING_DATE_SET',
            metadata: {
              previousValue: termin.billingDate?.toISOString() ?? null,
              newValue: billingDate?.toISOString() ?? null,
            },
          },
        });
      }

      if (termin.paymentDeadline?.getTime() !== paymentDeadline?.getTime()) {
        await tx.financeTerminAudit.create({
          data: {
            financeTerminId: terminId,
            userId: user.id,
            action: 'PAYMENT_DEADLINE_EDITED',
            metadata: {
              previousValue: termin.paymentDeadline?.toISOString() ?? null,
              newValue: paymentDeadline?.toISOString() ?? null,
            },
          },
        });
      }

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
    console.error('[PATCH /api/finance-projects/[id]/termins/[terminId]/dates]', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Gagal memperbarui tanggal termin' }, { status: 400 });
  }
}
