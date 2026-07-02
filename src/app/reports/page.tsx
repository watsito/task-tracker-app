import AuthGuard from '@/features/tasks/components/AuthGuard';
import AppHeader from '@/features/tasks/components/AppHeader';
import ReportStats from '@/features/reports/components/ReportStats';
import ExportPanel from '@/features/reports/components/ExportPanel';
import ImportPanel from '@/features/reports/components/ImportPanel';
import TaskTable from '@/features/reports/components/TaskTable';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reports — Task Tracker',
  description: 'Laporan statistik task, export data ke CSV/JSON, dan import data dari file.',
};

export default function ReportsPage() {
  return (
    <AuthGuard>
      <AppHeader />

      {/* Main */}
      <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-5 py-10 md:px-8">
        {/* Page title */}
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-600 to-indigo-700 shadow-lg shadow-indigo-500/30">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
              <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-100">Reports</h1>
            <p className="text-sm text-slate-400">Statistik, export, dan import data task Anda</p>
          </div>
        </div>

        <div className="flex flex-col gap-8">
          {/* Section 1 — Stats */}
          <section>
            <SectionLabel icon="📊" title="Ringkasan & Statistik" />
            <ReportStats />
          </section>

          {/* Section 2 — Export & Import */}
          <section>
            <SectionLabel icon="🔄" title="Export & Import Data" />
            <div className="grid gap-4 md:grid-cols-2">
              <ExportPanel />
              <ImportPanel />
            </div>
          </section>

          {/* Section 3 — Data Table */}
          <section>
            <SectionLabel icon="📋" title="Data Task Lengkap" />
            <TaskTable />
          </section>
        </div>
      </main>
    </AuthGuard>
  );
}

function SectionLabel({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span>{icon}</span>
      <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</h2>
      <div className="h-px flex-1 bg-white/[0.05]" />
    </div>
  );
}
