import AuthGuard from '@/features/tasks/components/AuthGuard';
import AppHeader from '@/features/tasks/components/AppHeader';
import FinanceBoardPageContent from '@/features/finance/components/FinanceBoardPageContent';

export default function FinanceBoardPage() {
  return (
    <AuthGuard>
      <AppHeader />
      <main className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden">
        <FinanceBoardPageContent />
      </main>
    </AuthGuard>
  );
}
