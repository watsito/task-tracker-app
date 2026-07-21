import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import type { FinanceTerminAuditRecord } from '@/features/finance/types/finance';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const terminId = searchParams.get('terminId');

    if (!terminId) {
      return NextResponse.json({ error: 'terminId wajib diisi.' }, { status: 400 });
    }

    const audits = await prisma.financeTerminAudit.findMany({
      where: { financeTerminId: terminId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    const response: FinanceTerminAuditRecord[] = audits.map((audit) => ({
      id: audit.id,
      action: audit.action as FinanceTerminAuditRecord['action'],
      fromStatus: audit.fromStatus as FinanceTerminAuditRecord['fromStatus'],
      toStatus: audit.toStatus as FinanceTerminAuditRecord['toStatus'],
      metadata: audit.metadata as Record<string, unknown> | null,
      createdByName: audit.user.name,
      createdAt: audit.createdAt.toISOString(),
    }));

    return NextResponse.json(response);
  } catch (error) {
    console.error('[GET /api/finance-termin-audits]', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Gagal memuat riwayat' }, { status: 500 });
  }
}
