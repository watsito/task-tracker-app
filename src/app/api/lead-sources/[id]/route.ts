import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { Prisma } from '@/generated/prisma/client';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json() as {
      title?: string;
      monthLabel?: string;
      period?: string;
      channels?: Record<string, number>;
      totalLeads?: number;
    };

    const entry = await prisma.leadSource.update({
      where: { id },
      data: {
        ...(body.title !== undefined ? { title: body.title.trim() } : {}),
        ...(body.monthLabel !== undefined ? { monthLabel: body.monthLabel.trim() } : {}),
        ...(body.period !== undefined ? { period: body.period.trim() } : {}),
        ...(body.channels !== undefined ? { channels: body.channels as Prisma.InputJsonValue } : {}),
        ...(body.totalLeads !== undefined ? { totalLeads: body.totalLeads } : {}),
        updatedById: user.id,
      },
      include: { createdBy: { select: { id: true, name: true } }, updatedBy: { select: { id: true, name: true } } },
    });

    return NextResponse.json(entry);
  } catch (error) {
    console.error('[PATCH /api/lead-sources/[id]]', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to update lead source' }, { status: 400 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await context.params;
    await prisma.leadSource.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[DELETE /api/lead-sources/[id]]', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to delete lead source' }, { status: 400 });
  }
}
