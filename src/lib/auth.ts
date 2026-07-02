import { cookies } from 'next/headers';
import type { User } from '@/generated/prisma/client';
import type { AppUser } from '@/features/tasks/types/user';
import { prisma } from './prisma';

export const SESSION_COOKIE_NAME = 'task_tracker_session';

export function toAppUser(user: User): AppUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role === 'ADMIN' ? 'admin' : 'member',
  };
}

export function getSessionExpiry(): Date {
  return new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
}

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) return null;

  const user = await prisma.user.findUnique({ where: { sessionToken } });

  if (!user?.sessionExpiresAt || user.sessionExpiresAt < new Date()) return null;

  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await getCurrentUser();

  if (!user || user.role !== 'ADMIN') {
    throw new Error('Forbidden');
  }

  return user;
}
