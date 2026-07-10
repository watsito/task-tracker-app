import AuthGuard from '@/features/tasks/components/AuthGuard';
import AppHeader from '@/features/tasks/components/AppHeader';
import OperationalDashboard from '@/features/tasks/components/OperationalDashboard';

export default function OperationalDashboardPage() {
  return (
    <AuthGuard>
      <AppHeader />
      <main className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden">
        <OperationalDashboard />
      </main>
    </AuthGuard>
  );
}
