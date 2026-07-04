import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(_request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await context.params;

    const notification = await prisma.notification.update({
      where: { id, userId: user.id },
      data: { isRead: true },
    });

    return NextResponse.json(notification);
  } catch {
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 400 });
  }
}
