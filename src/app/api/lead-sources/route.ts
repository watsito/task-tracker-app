import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { Prisma } from '@/generated/prisma/client';

export async function GET() {
  try {
    const entries = await prisma.leadSource.findMany({
      orderBy: { createdAt: 'desc' },
      include: { createdBy: { select: { id: true, name: true } }, updatedBy: { select: { id: true, name: true } } },
    });
    return NextResponse.json(entries);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch lead sources' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json() as {
      team: string;
      formType: string;
      title: string;
      monthLabel: string;
      period: string;
      channels: Record<string, number>;
      totalLeads: number;
    };

    const entry = await prisma.leadSource.create({
      data: {
        team: body.team,
        formType: body.formType,
        title: body.title.trim(),
        monthLabel: body.monthLabel.trim(),
        period: body.period.trim(),
        channels: body.channels as Prisma.InputJsonValue,
        totalLeads: body.totalLeads,
        createdById: user.id,
        updatedById: user.id,
      },
      include: { createdBy: { select: { id: true, name: true } }, updatedBy: { select: { id: true, name: true } } },
    });

    return NextResponse.json(entry);
  } catch (error) {
    console.error('[POST /api/lead-sources]', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to create lead source' }, { status: 400 });
  }
}
