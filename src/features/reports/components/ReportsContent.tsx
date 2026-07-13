'use client';

import { useAuthStore } from '@/features/tasks/store/authStore';
import ReportStats from './ReportStats';
import ExportPanel from './ExportPanel';
import ImportPanel from './ImportPanel';
import TaskTable from './TaskTable';
import MarketingReportsContent from './MarketingReportsContent';
import FinanceReportsContent from './FinanceReportsContent';

export default function ReportsContent() {
  const currentDepartment = useAuthStore((s) => s.currentDepartment);

  if (currentDepartment === 'MARKETING') {
    return <MarketingReportsContent />;
  }

  if (currentDepartment === 'FINANCE') {
    return <FinanceReportsContent />;
  }

  return (
    <div className="flex flex-col gap-8">
      <section>
        <SectionLabel icon="📊" title="Ringkasan & Statistik" />
        <ReportStats />
      </section>

      <section>
        <SectionLabel icon="🔄" title="Export & Import Data" />
        <div className="grid gap-4 md:grid-cols-2">
          <ExportPanel />
          <ImportPanel />
        </div>
      </section>

      <section>
        <SectionLabel icon="📋" title="Data Task Lengkap" />
        <TaskTable />
      </section>
    </div>
  );
}

function SectionLabel({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span>{icon}</span>
      <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-500">{title}</h2>
      <div className="h-px flex-1 bg-gray-200 dark:bg-white/[0.05]" />
    </div>
  );
}
