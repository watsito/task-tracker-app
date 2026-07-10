'use client';

import { useAuthStore } from '@/features/tasks/store/authStore';
import AuthGuard from '@/features/tasks/components/AuthGuard';
import AppHeader from '@/features/tasks/components/AppHeader';
import TaskBoard from '@/features/tasks/components/TaskBoard';
import MarketingDashboard from '@/features/tasks/components/MarketingDashboard';
import ManagementDashboard from '@/features/tasks/components/ManagementDashboard';

export default function HomePage() {
  const currentDepartment = useAuthStore((s) => s.currentDepartment);

  return (
    <AuthGuard>
      <AppHeader />
      <main className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden">
        {currentDepartment === 'MANAGEMENT' ? <ManagementDashboard /> : currentDepartment === 'MARKETING' ? <MarketingDashboard /> : <TaskBoard />}
      </main>
    </AuthGuard>
  );
}
