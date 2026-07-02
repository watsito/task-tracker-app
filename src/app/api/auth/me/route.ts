import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { SESSION_COOKIE_NAME, toAppUser } from '@/lib/auth';

export async function GET() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { sessionToken } });

  if (!user?.sessionExpiresAt || user.sessionExpiresAt < new Date()) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json(toAppUser(user));
}
