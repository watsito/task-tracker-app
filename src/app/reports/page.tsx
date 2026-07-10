'use client';

import AuthGuard from '@/features/tasks/components/AuthGuard';
import AppHeader from '@/features/tasks/components/AppHeader';
import ReportsContent from '@/features/reports/components/ReportsContent';

export default function ReportsPage() {
  return (
    <AuthGuard>
      <AppHeader />

      <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-5 py-10 md:px-8">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-600 to-indigo-700 shadow-lg shadow-indigo-500/30">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
              <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-slate-100">Reports</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400">Statistik dan export data sesuai department aktif</p>
          </div>
        </div>

        <ReportsContent />
      </main>
    </AuthGuard>
  );
}
