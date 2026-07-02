import type { User } from '@/generated/prisma/client';
import type { AppUser } from '@/features/tasks/types/user';

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
