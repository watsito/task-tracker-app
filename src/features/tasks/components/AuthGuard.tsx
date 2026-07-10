'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '../store/authStore';
import { PageKey, PAGE_ROUTES, Department } from '../types/user';

const ROUTE_TO_PAGE: Record<string, PageKey> = Object.fromEntries(
  Object.entries(PAGE_ROUTES).map(([key, route]) => [route, key as PageKey])
);

const PAGE_DEPARTMENT_MAP: Record<PageKey, Department[]> = {
  board: ['OPERATIONAL', 'MARKETING', 'MANAGEMENT'],
  reports: ['OPERATIONAL', 'MARKETING'],
  integrations: ['OPERATIONAL'],
  form: ['MARKETING'],
  users: [],
  settings: [],
  operationalDashboard: ['OPERATIONAL'],
};

function hasPageAccess(user: { role: string; departments?: Department[]; permissions?: { pages?: Record<string, boolean> } } | null, page: PageKey, currentDept: Department): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;
  const allowedDepts = PAGE_DEPARTMENT_MAP[page];
  if (allowedDepts && !allowedDepts.includes(currentDept)) return false;
  return user.permissions?.pages?.[page] ?? true;
}

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const currentUser = useAuthStore((s) => s.currentUser);
  const currentDepartment = useAuthStore((s) => s.currentDepartment);
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
  const canAccess = !currentPage || hasPageAccess(currentUser, currentPage, currentDepartment);

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
