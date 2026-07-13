import AuthGuard from '@/features/tasks/components/AuthGuard';
import AppHeader from '@/features/tasks/components/AppHeader';
import FinanceForm from '@/features/finance/components/FinanceForm';

export default function FinanceFormPage() {
  return (
    <AuthGuard>
      <AppHeader />
      <main className="relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto">
        <FinanceForm />
      </main>
    </AuthGuard>
  );
}
