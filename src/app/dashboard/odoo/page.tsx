import AuthGuard from '@/features/tasks/components/AuthGuard';
import AppHeader from '@/features/tasks/components/AppHeader';
import OdooDashboard from '@/features/tasks/components/OdooDashboard';

export default function OdooDashboardPage() {
  return (
    <AuthGuard>
      <AppHeader />
      <main className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden">
        <OdooDashboard />
      </main>
    </AuthGuard>
  );
}
