'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '../store/authStore';
import { PageKey, PAGE_ROUTES } from '../types/user';

const ROUTE_TO_PAGE: Record<string, PageKey> = Object.fromEntries(
  Object.entries(PAGE_ROUTES).map(([key, route]) => [route, key as PageKey])
);

function hasPageAccess(user: { role: string; permissions?: { pages?: Record<string, boolean> } } | null, page: PageKey): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return user.permissions?.pages?.[page] ?? (page !== 'users');
}

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const currentUser = useAuthStore((s) => s.currentUser);
  const checkSession = useAuthStore((s) => s.checkSession);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  const currentPage = ROUTE_TO_PAGE[pathname];
  const canAccess = !currentPage || hasPageAccess(currentUser, currentPage);

  useEffect(() => {
    if (!isLoading && isAuthenticated && !canAccess) {
      router.replace('/');
    }
  }, [isLoading, isAuthenticated, canAccess, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-indigo-500" />
      </div>
    );
  }

  if (!canAccess) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-indigo-500" />
      </div>
    );
  }

  return <>{children}</>;
}
