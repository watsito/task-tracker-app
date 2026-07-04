import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
  try {
    const entries = await prisma.leadSource.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(entries);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch lead sources' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
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
        title: body.title,
        monthLabel: body.monthLabel,
        period: body.period,
        channels: body.channels,
        totalLeads: body.totalLeads,
      },
    });

    return NextResponse.json(entry);
  } catch (error) {
    if (error instanceof Error && error.message === 'Not authenticated') {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('[POST /api/lead-sources]', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to create lead source' }, { status: 400 });
  }
}
