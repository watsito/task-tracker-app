import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAdmin, toAppUser } from '@/lib/auth';
import type { UserRole } from '@/features/tasks/types/user';

export async function GET() {
  try {
    await requireAdmin();

    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(users.map(toAppUser));
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json() as {
      name?: string;
      email?: string;
      password?: string;
      role?: UserRole;
      permissions?: Record<string, unknown>;
    };

    const name = body.name?.trim();
    const email = body.email?.trim().toLowerCase();
    const password = body.password ?? '';
    const role = body.role === 'admin' ? 'ADMIN' : 'MEMBER';
    const permissions = body.permissions as Prisma.InputJsonValue | undefined;

    if (!name || !email || password.length < 8) {
      return NextResponse.json({ error: 'Name, valid email, and password min 8 chars are required' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, passwordHash, role, permissions },
    });

    return NextResponse.json(toAppUser(user), { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ error: 'Failed to create user' }, { status: 400 });
  }
}
