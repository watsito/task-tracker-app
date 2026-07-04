import { NextResponse } from 'next/server';
import { Prisma, UserRole } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAdmin, toAppUser } from '@/lib/auth';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const body = await request.json() as {
      role?: string;
      permissions?: Record<string, unknown>;
    };

    const data: Prisma.UserUpdateInput = {};
    if (body.role) data.role = body.role.toUpperCase() as UserRole;
    if (body.permissions !== undefined) data.permissions = body.permissions as Prisma.InputJsonValue;

    const user = await prisma.user.update({
      where: { id },
      data,
    });

    return NextResponse.json(toAppUser(user));
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('[PATCH /api/users/[id]]', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to update user' }, { status: 400 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const currentUser = await requireAdmin();
    const { id } = await context.params;

    if (currentUser.id === id) {
      return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 400 });
    }

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ error: 'Failed to delete user' }, { status: 400 });
  }
}
