import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { Prisma } from '@/generated/prisma/client';

const EMPTY_CHANNELS: Record<string, number> = {
  email: 0,
  googleAds: 0,
  metaAds: 0,
  tender: 0,
  socialMedia: 0,
  linkedin: 0,
  referral: 0,
  inboundWa: 0,
  web: 0,
  ka: 0,
  mes: 0,
  community: 0,
  other: 0,
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const leadSourceId = searchParams.get('leadSourceId');

    const entries = await prisma.leadEntry.findMany({
      where: leadSourceId ? { leadSourceId } : undefined,
      orderBy: { createdAt: 'desc' },
      include: { createdBy: { select: { id: true, name: true } } },
    });

    return NextResponse.json(entries);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch lead entries' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json() as {
      leadSourceId?: string;
      title?: string;
      monthLabel?: string;
      period?: string;
      channel?: string;
      name?: string;
      phoneNumber?: string;
      email?: string;
      companyName?: string;
      jobTitle?: string;
      typeOfNeed?: string;
      infoSource?: string;
    };

    const channel = body.channel?.trim();
    const title = body.title?.trim() ?? '';
    const monthLabel = body.monthLabel?.trim() ?? '';
    const period = body.period?.trim() ?? '';
    const name = body.name?.trim() ?? '';
    const phoneNumber = body.phoneNumber?.trim() ?? '';
    const email = body.email?.trim() ?? '';
    const companyName = body.companyName?.trim() ?? '';
    const jobTitle = body.jobTitle?.trim() ?? '';
    const typeOfNeed = body.typeOfNeed?.trim() ?? '';
    const infoSource = body.infoSource?.trim() ?? '';

    if (!channel || !(channel in EMPTY_CHANNELS)) {
      return NextResponse.json({ error: 'Channel tidak valid' }, { status: 400 });
    }

    if (!title || !monthLabel || !period) {
      return NextResponse.json({ error: 'Judul, bulan, dan periode wajib diisi' }, { status: 400 });
    }

    if (!name || !phoneNumber || !email || !companyName || !jobTitle || !typeOfNeed) {
      return NextResponse.json({ error: 'Field Name, Phone, Email, Company, Job Title, dan Type of Need wajib diisi' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      let leadSourceId = body.leadSourceId;

      if (!leadSourceId) {
        const createdLeadSource = await tx.leadSource.create({
          data: {
            team: 'Marketing',
            formType: 'MBNE & ACE Lead Form',
            title,
            monthLabel,
            period,
            channels: EMPTY_CHANNELS as Prisma.InputJsonValue,
            totalLeads: 0,
            createdById: user.id,
            updatedById: user.id,
          },
        });
        leadSourceId = createdLeadSource.id;
      }

      const leadEntry = await tx.leadEntry.create({
        data: {
          leadSourceId,
          channel,
          name,
          phoneNumber,
          email,
          companyName,
          jobTitle,
          typeOfNeed,
          infoSource,
          createdById: user.id,
        },
      });

      const currentLeadSource = await tx.leadSource.findUnique({ where: { id: leadSourceId } });
      if (!currentLeadSource) {
        throw new Error('Lead source tidak ditemukan');
      }

      const channels = ((currentLeadSource.channels as Record<string, number> | null) ?? EMPTY_CHANNELS);
      const nextChannels = {
        ...EMPTY_CHANNELS,
        ...channels,
        [channel]: (channels[channel] ?? 0) + 1,
      };

      const updatedLeadSource = await tx.leadSource.update({
        where: { id: leadSourceId },
        data: {
          title,
          monthLabel,
          period,
          channels: nextChannels as Prisma.InputJsonValue,
          totalLeads: Object.values(nextChannels).reduce((sum, value) => sum + value, 0),
          updatedById: user.id,
        },
        include: {
          createdBy: { select: { id: true, name: true } },
          updatedBy: { select: { id: true, name: true } },
          entries: {
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              channel: true,
              name: true,
              phoneNumber: true,
              email: true,
              companyName: true,
              jobTitle: true,
              typeOfNeed: true,
              infoSource: true,
              createdAt: true,
            },
          },
        },
      });

      return { leadEntry, leadSource: updatedLeadSource };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('[POST /api/lead-entries]', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to create lead entry' }, { status: 400 });
  }
}
