import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json() as { name?: string };
    const name = body.name?.trim();

    if (!name || name.length < 2) {
      return NextResponse.json({ error: 'Nama harus minimal 2 karakter' }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { name },
    });

    return NextResponse.json({ name: updated.name });
  } catch (error) {
    console.error('[PATCH /api/users/me/name]', error);
    return NextResponse.json({ error: 'Gagal mengubah nama' }, { status: 500 });
  }
}
