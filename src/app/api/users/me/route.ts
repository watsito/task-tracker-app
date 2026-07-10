import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import type { Department } from '@/features/tasks/types/user';

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const departments = (user.departments as Department[]) ?? [];

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role === 'ADMIN' ? 'admin' : 'member',
      departments,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error('[GET /api/users/me]', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}
