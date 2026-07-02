import TaskBoard from '@/features/tasks/components/TaskBoard';
import AuthGuard from '@/features/tasks/components/AuthGuard';
import AppHeader from '@/features/tasks/components/AppHeader';

export default function HomePage() {
  return (
    <AuthGuard>
      <AppHeader showRoleToggle />
      <main className="relative z-10 flex flex-1 flex-col overflow-auto">
        <TaskBoard />
      </main>
    </AuthGuard>
  );
}
